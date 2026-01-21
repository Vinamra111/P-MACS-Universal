/**
 * Query Classifier for Cost Optimization
 * Routes queries to appropriate handler (direct DB vs LLM)
 * Preserves quality while reducing API costs
 */

import type { ClassifiedQuery, QueryIntent, QueryRoute, UserRole } from '../types/index.js';
import { smartDrugMatch } from '../utils/fuzzyMatch.js';

// ============================================================
// PATTERN DEFINITIONS
// ============================================================

interface QueryPattern {
  pattern: RegExp;
  intent: QueryIntent;
  extractors?: Record<string, number>; // Capture group indices
}

/**
 * Patterns that can be handled directly by database queries
 * These bypass LLM entirely for faster, more accurate responses
 */
const DIRECT_DB_PATTERNS: QueryPattern[] = [
  // Drug lookups
  { pattern: /^where\s+is\s+(.+?)[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^find\s+(.+?)[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^show\s+(.+?)\s+stock[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+stock[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^how\s+much\s+(.+?)[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^check\s+(.+?)[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+quantity[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },
  { pattern: /^(.+?)\s+levels?[\?\s]*$/i, intent: 'lookup_drug', extractors: { drugName: 1 } },

  // Location lookups
  { pattern: /^(.+?)\s+in\s+(icu|er|pharmacy|ward|emergency|central)/i, intent: 'lookup_location', extractors: { drugName: 1, location: 2 } },
  { pattern: /^(icu|er|pharmacy|ward|emergency|central).*\s+stock/i, intent: 'lookup_location', extractors: { location: 1 } },
  { pattern: /^what'?s?\s+in\s+(icu|er|pharmacy|ward|emergency|central)/i, intent: 'lookup_location', extractors: { location: 1 } },
  { pattern: /^(icu|er|pharmacy|ward|emergency|central).*\s+inventory/i, intent: 'lookup_location', extractors: { location: 1 } },

  // List operations
  { pattern: /^show\s+(all\s+)?inventory/i, intent: 'list_inventory' },
  { pattern: /^list\s+(all\s+)?drugs?/i, intent: 'list_inventory' },
  { pattern: /^full\s+inventory/i, intent: 'list_inventory' },

  // Expiry checks
  { pattern: /^what'?s?\s+expiring/i, intent: 'expiring_drugs' },
  { pattern: /^expiring\s+(drugs?|items?|soon)/i, intent: 'expiring_drugs' },
  { pattern: /^expiry\s+(report|check|list)/i, intent: 'expiring_drugs' },
  { pattern: /^check\s+expir/i, intent: 'expiring_drugs' },

  // Location list
  { pattern: /^list\s+(all\s+)?locations?/i, intent: 'list_locations' },
  { pattern: /^show\s+(all\s+)?locations?/i, intent: 'list_locations' },
  { pattern: /^where\s+are\s+drugs?\s+stored/i, intent: 'list_locations' },

  // Stockout reports
  { pattern: /^stockouts?/i, intent: 'stockout_report' },
  { pattern: /^out\s+of\s+stock/i, intent: 'stockout_report' },
  { pattern: /^what'?s?\s+out/i, intent: 'stockout_report' },
  { pattern: /^empty\s+stock/i, intent: 'stockout_report' },

  // Low stock reports
  { pattern: /^low\s+stock/i, intent: 'low_stock_report' },
  { pattern: /^below\s+safety/i, intent: 'low_stock_report' },
  { pattern: /^critical\s+(stock|items?)/i, intent: 'low_stock_report' },

  // Update operations (simple format)
  { pattern: /^add\s+(\d+)\s+(.+?)$/i, intent: 'update_stock', extractors: { quantity: 1, drugName: 2 } },
  { pattern: /^update\s+(.+?)\s+to\s+(\d+)/i, intent: 'update_stock', extractors: { drugName: 1, quantity: 2 } },
  { pattern: /^receive\s+(\d+)\s+(.+?)$/i, intent: 'update_stock', extractors: { quantity: 1, drugName: 2 } },
];

/**
 * Patterns that require LLM reasoning
 * These need natural language understanding or complex analysis
 */
const LLM_REQUIRED_PATTERNS: RegExp[] = [
  // Reasoning queries
  /\bwhy\b/i,
  /\bshould\s+i\b/i,
  /\brecommend/i,
  /\banalyze\b/i,
  /\bcompare\b/i,
  /\bexplain\b/i,
  /\bhelp\s+me\s+understand\b/i,

  // Decision queries
  /\bwhat.*(best|optimal|better)\b/i,
  /\bhow.*(optimize|improve)\b/i,

  // Complex generation
  /\bgenerate.*order\b/i,
  /\bcreate.*(po|order)\b/i,
  /\bforecast\b/i,
  /\bpredict\b/i,

  // Multi-entity queries
  /\band\b.*\band\b/i, // Multiple "and"s suggest complex query

  // Contextual queries (require conversation history)
  /\bwhat\s+about\b/i,
  /\bthe\s+other\b/i,
  /\bsame\s+for\b/i,
];

/**
 * Keywords that suggest forecast/analytics queries
 */
const ANALYTICS_KEYWORDS = [
  'forecast', 'predict', 'trend', 'pattern', 'usage', 'consumption',
  'analysis', 'analytics', 'report', 'top', 'most used', 'slow mover',
  'seasonal', 'monthly', 'weekly', 'daily',
];

// ============================================================
// CLASSIFIER IMPLEMENTATION
// ============================================================

/**
 * Classify a user query to determine optimal handling route
 */
export function classifyQuery(query: string): ClassifiedQuery {
  const normalizedQuery = query.trim().toLowerCase();

  // Step 1: Check for direct DB patterns (80% of queries)
  for (const { pattern, intent, extractors } of DIRECT_DB_PATTERNS) {
    const match = query.match(pattern);
    if (match) {
      const entities: ClassifiedQuery['entities'] = {};

      if (extractors) {
        if (extractors.drugName && match[extractors.drugName]) {
          entities.drugName = match[extractors.drugName].trim();
        }
        if (extractors.location && match[extractors.location]) {
          entities.location = match[extractors.location].trim();
        }
        if (extractors.quantity && match[extractors.quantity]) {
          entities.quantity = parseInt(match[extractors.quantity], 10);
        }
      }

      return {
        route: 'direct_db',
        intent,
        entities,
        confidence: 0.95,
        requiresLLM: false,
      };
    }
  }

  // Step 2: Check if LLM is required
  for (const pattern of LLM_REQUIRED_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return {
        route: 'llm_required',
        intent: 'complex',
        entities: {},
        confidence: 0.9,
        requiresLLM: true,
      };
    }
  }

  // Step 3: Check for analytics keywords
  if (ANALYTICS_KEYWORDS.some((kw) => normalizedQuery.includes(kw))) {
    return {
      route: 'llm_required',
      intent: 'analytics',
      entities: {},
      confidence: 0.85,
      requiresLLM: true,
    };
  }

  // Step 4: Try to extract drug name as fallback (fuzzy lookup)
  // If query is just a drug name, treat as lookup
  const words = normalizedQuery.split(/\s+/);
  if (words.length <= 3 && !normalizedQuery.includes('?')) {
    return {
      route: 'direct_db',
      intent: 'fuzzy_lookup',
      entities: { drugName: normalizedQuery },
      confidence: 0.7,
      requiresLLM: false,
    };
  }

  // Step 5: Default to LLM for ambiguous queries
  return {
    route: 'llm_required',
    intent: 'complex',
    entities: {},
    confidence: 0.5,
    requiresLLM: true,
  };
}

/**
 * Check if a query should definitely use LLM
 * Used for quality assurance - never skip LLM for these
 */
export function mustUseLLM(query: string, userRole: UserRole): boolean {
  const normalizedQuery = query.toLowerCase();

  // Always use LLM for permission-sensitive operations by non-privileged users
  if (userRole === 'Nurse' && /\b(update|add|change|modify|delete)\b/i.test(query)) {
    return true; // LLM will properly deny with explanation
  }

  // Always use LLM for multi-step reasoning
  if (normalizedQuery.includes(' and ') && normalizedQuery.includes(' then ')) {
    return true;
  }

  // Always use LLM for comparative queries
  if (/\b(better|worse|more|less|versus|vs)\b/i.test(query)) {
    return true;
  }

  return false;
}

/**
 * Estimate token usage for a query (for cost monitoring)
 */
export function estimateTokens(query: string, responseType: string): {
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
} {
  // Rough estimates based on typical P-MACS responses
  const baseSystemPromptTokens = 400; // Optimized prompt
  const queryTokens = Math.ceil(query.length / 4);

  // Output estimates by type
  const outputEstimates: Record<string, number> = {
    inventory_lookup: 200,
    forecast: 350,
    purchase_order: 500,
    expiry_report: 300,
    analytics: 400,
    message: 150,
    error: 50,
  };

  const inputTokens = baseSystemPromptTokens + queryTokens;
  const outputTokens = outputEstimates[responseType] || 200;

  // Cost calculation (GPT-4o-mini pricing)
  const inputCost = (inputTokens / 1000000) * 0.15;
  const outputCost = (outputTokens / 1000000) * 0.60;

  return {
    inputTokens,
    outputTokens,
    estimatedCost: inputCost + outputCost,
  };
}

export default {
  classifyQuery,
  mustUseLLM,
  estimateTokens,
};
