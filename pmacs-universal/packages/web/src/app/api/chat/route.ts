import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { ConversationChain } from 'langchain/chains';
import { CSVDatabaseAdapter, createAllTools } from '@pmacs/core';
import path from 'path';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Initialize database adapter
const dataPath = path.join(process.cwd(), '../api/data');
const db = new CSVDatabaseAdapter(dataPath);

// ============================================================
// CONVERSATION MEMORY MANAGEMENT (Session-based)
// ============================================================

interface ConversationContext {
  memory: BufferMemory;
  lastDrug?: string;
  lastLocation?: string;
  lastAction?: string;
  messageCount: number;
  createdAt: number;
}

// Store conversation memories per user session (in-memory for now)
const conversationSessions = new Map<string, ConversationContext>();

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [sessionId, context] of conversationSessions.entries()) {
    if (context.createdAt < oneHourAgo) {
      conversationSessions.delete(sessionId);
    }
  }
}, 15 * 60 * 1000); // Run cleanup every 15 minutes

function getOrCreateConversationContext(userId: string): ConversationContext {
  if (!conversationSessions.has(userId)) {
    conversationSessions.set(userId, {
      memory: new BufferMemory({
        returnMessages: true,
        memoryKey: 'chat_history',
        inputKey: 'input',
        outputKey: 'output',
      }),
      messageCount: 0,
      createdAt: Date.now(),
    });
  }
  return conversationSessions.get(userId)!;
}

// ============================================================
// INTENT DETECTION (Pharmacy vs Out-of-Scope)
// ============================================================

function detectIntent(message: string): 'pharmacy_query' | 'out_of_scope' | 'greeting' {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
    /^(how are you|what's up|wassup)\b/i,
  ];
  if (greetingPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'greeting';
  }

  // Pharmacy-related keywords
  const pharmacyKeywords = [
    'stock', 'inventory', 'drug', 'medication', 'medicine', 'pharma',
    'expir', 'expiry', 'location', 'ward', 'quantity', 'order',
    'alert', 'low', 'critical', 'batch', 'safety', 'reorder',
    'forecast', 'predict', 'usage', 'consumption', 'transaction',
    'shelf', 'cabinet', 'storage', 'icu', 'emergency',
    'paracetamol', 'ibuprofen', 'aspirin', 'amoxicillin', // Common drugs
    'where is', 'how much', 'how many', 'what drugs', 'which items',
    'show me', 'find', 'search', 'check', 'list', 'get', 'tell me about',
  ];

  const hasPharmacyKeyword = pharmacyKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Context-dependent queries (follow-ups)
  const contextPatterns = [
    /\b(it|that|this|those|these|them)\b/i,
    /\b(where|when|how much|how many)\b/i,
    /\bmore (details|info|information)\b/i,
  ];
  const hasContextReference = contextPatterns.some(pattern => pattern.test(lowerMessage));

  if (hasPharmacyKeyword || hasContextReference) {
    return 'pharmacy_query';
  }

  return 'out_of_scope';
}

// ============================================================
// EDGE CASE HANDLING
// ============================================================

function handleEdgeCases(message: string, context: ConversationContext): {
  shouldProceed: boolean;
  response?: string;
} {
  const trimmed = message.trim();

  // 1. Empty or very short messages
  if (!trimmed || trimmed.length < 2) {
    return {
      shouldProceed: false,
      response: "Please enter a message. I can help you check drug inventory, find expiring items, or search for medications.",
    };
  }

  // 2. Very long messages
  if (trimmed.length > 2000) {
    return {
      shouldProceed: false,
      response: "Your message is too long (max 2000 characters). Please be more concise.",
    };
  }

  // 3. Nonsense/gibberish detection
  const hasVowels = /[aeiou]/i.test(trimmed);
  const hasSpaces = trimmed.includes(' ');
  const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 10;
  const repeatingChars = /(.)\1{5,}/.test(trimmed); // More than 5 repeated chars

  if ((!hasVowels && trimmed.length > 5) || repeatingChars) {
    return {
      shouldProceed: false,
      response: "I didn't understand that. Try asking about:\n• Drug stock levels (e.g., 'Check Paracetamol stock')\n• Expiring items (e.g., 'Show drugs expiring soon')\n• Locations (e.g., 'What's in Ward-1?')\n• Usage patterns (e.g., 'Top moving drugs this month')",
    };
  }

  // 4. Intent-based routing
  const intent = detectIntent(message);

  if (intent === 'greeting') {
    return {
      shouldProceed: false,
      response: `Hello! I'm your pharmacy inventory assistant. I can help you:\n• Check drug stock levels\n• Find expiring medications\n• Locate items in the pharmacy\n• View usage patterns and forecasts\n• Check low stock alerts\n\nWhat would you like to know?`,
    };
  }

  if (intent === 'out_of_scope') {
    return {
      shouldProceed: false,
      response: "I can only help with pharmacy inventory questions. Try asking about drug stock levels, expiring items, locations, or usage patterns.",
    };
  }

  // 5. Ambiguous queries without context
  const ambiguousPatterns = [
    /^(check|show|find|get|tell me|where|what|how much|how many)$/i,
    /^(stock|inventory|items|drugs|medications)$/i,
    /^(it|that|this|those|these)$/i,
  ];

  if (ambiguousPatterns.some(pattern => pattern.test(trimmed)) && context.messageCount === 0) {
    return {
      shouldProceed: false,
      response: "I need more information. What would you like to check? For example:\n• 'Check Paracetamol stock'\n• 'Show drugs expiring in 30 days'\n• 'What's in Ward-1?'\n• 'List low stock items'",
    };
  }

  // All checks passed
  return { shouldProceed: true };
}

// ============================================================
// SUGGESTED FOLLOW-UP QUESTIONS
// ============================================================

function generateSuggestions(
  userQuery: string,
  botResponse: string,
  context: ConversationContext
): string[] {
  const suggestions: string[] = [];
  const lowerQuery = userQuery.toLowerCase();
  const lowerResponse = botResponse.toLowerCase();

  // Smart suggestion generation based on context

  // If we just looked up a drug, suggest related actions
  if (context.lastDrug) {
    const drugName = context.lastDrug;

    // Don't repeat the same type of question
    if (!lowerQuery.includes('where') && !lowerQuery.includes('locat')) {
      suggestions.push(`Where is ${drugName} located?`);
    }

    if (!lowerQuery.includes('expir') && !lowerQuery.includes('when')) {
      suggestions.push(`When does ${drugName} expire?`);
    }

    if (!lowerQuery.includes('usage') && !lowerQuery.includes('history')) {
      suggestions.push(`Show usage trends for ${drugName}`);
    }

    if (!lowerQuery.includes('forecast') && suggestions.length < 3) {
      suggestions.push(`Forecast demand for ${drugName}`);
    }
  }

  // If we just looked at a location, suggest location-based queries
  if (context.lastLocation && suggestions.length < 3) {
    const location = context.lastLocation;

    if (!lowerQuery.includes('expir')) {
      suggestions.push(`Show expiring items in ${location}`);
    }

    if (!lowerQuery.includes('low') && !lowerQuery.includes('stock')) {
      suggestions.push(`Check low stock in ${location}`);
    }

    if (suggestions.length < 3) {
      suggestions.push(`What else is stored in ${location}?`);
    }
  }

  // Query-type based suggestions (when no specific drug/location context)
  if (suggestions.length < 2) {
    if (lowerQuery.includes('expir') || lowerResponse.includes('expir')) {
      suggestions.push('Which expiring items are critical?');
      suggestions.push('Show me items expiring in 7 days');
    } else if (lowerQuery.includes('low stock') || lowerResponse.includes('low stock')) {
      suggestions.push('What should I reorder urgently?');
      suggestions.push('Show me usage forecasts');
    } else if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
      suggestions.push('Show me low stock alerts');
      suggestions.push('What drugs are expiring soon?');
    } else if (lowerQuery.includes('top') || lowerQuery.includes('trend')) {
      suggestions.push('Show me slow moving drugs');
      suggestions.push('Analyze seasonal patterns');
    }
  }

  // General high-value suggestions if we still don't have enough
  if (suggestions.length < 2) {
    const generalSuggestions = [
      'Show critical stock alerts',
      'What drugs are expiring in 30 days?',
      'Top moving drugs this month',
      'Show stockout risks',
      'Check safety stock levels',
    ];

    // Add general suggestions that aren't already included
    for (const suggestion of generalSuggestions) {
      if (suggestions.length >= 3) break;
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
  }

  // Return max 3 unique suggestions
  return [...new Set(suggestions)].slice(0, 3);
}

// ============================================================
// EXTRACT ENTITIES FROM QUERY AND RESPONSE
// ============================================================

function extractEntities(query: string, response: string): {
  drug?: string;
  location?: string;
  action?: string;
} {
  const result: { drug?: string; location?: string; action?: string } = {};

  // ===== DRUG NAME EXTRACTION =====
  // Priority 1: Extract from response (bot confirms the actual drug name)
  // Look for bolded drug names in markdown: **DrugName**
  const boldDrugPattern = /\*\*([A-Z][a-zA-Z\s]+(?:Sulfate|Hydrochloride|mg\/mL|mcg|Patch)?)\*\*/g;
  const boldMatches = [...response.matchAll(boldDrugPattern)];

  if (boldMatches.length > 0) {
    // Get the first bolded drug name (usually the main drug being discussed)
    let drugName = boldMatches[0][1].trim();

    // Filter out common non-drug bold text
    const excludeWords = ['Inventory', 'Top', 'Slow', 'Movers', 'Expiring', 'Drugs',
                          'Stock', 'Alerts', 'Low', 'Critical', 'Items', 'Next',
                          'Last', 'Ward', 'ICU', 'Emergency', 'Pharmacy'];

    // Clean up the drug name - remove trailing words
    drugName = drugName.replace(/\s+(Inventory|Stock|Level|Count|Total|Report)$/i, '');

    if (!excludeWords.some(word => drugName.includes(word))) {
      result.drug = drugName;
    }
  }

  // Priority 2: Extract from query (user's input)
  // Look for drug name after common action words
  if (!result.drug) {
    const queryDrugPattern = /(?:check|show|find|search|get|locate|where is|for)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+)?(?:\s+\d+mg)?)/i;
    const queryMatch = query.match(queryDrugPattern);

    if (queryMatch && queryMatch[1]) {
      const drugCandidate = queryMatch[1].trim();

      // Exclude common action words that might be capitalized
      const excludeQueryWords = ['Stock', 'Inventory', 'Items', 'Drugs', 'All', 'List'];
      if (!excludeQueryWords.includes(drugCandidate)) {
        result.drug = drugCandidate;
      }
    }
  }

  // Priority 3: Look for pharmaceutical suffix patterns
  if (!result.drug) {
    const pharmaPattern = /\b([A-Z][a-z]+(?:cillin|mycin|phen|zole|prazole|tadine|lol|pine|caine|ine|ol|ate))\b/g;
    const pharmaMatches = response.match(pharmaPattern) || query.match(pharmaPattern);

    if (pharmaMatches && pharmaMatches.length > 0) {
      result.drug = pharmaMatches[0];
    }
  }

  // ===== LOCATION EXTRACTION =====
  // Look for location names in both response and query
  const locationPattern = /\b(Ward[- ]?\d+|ICU|Emergency[- ]?Room|Pharmacy[- ]?Main|Secure[- ]?Vault[- ]?\d*|Cabinet|Shelf[- ]?[A-Z]|Storage)\b/gi;
  const locationMatches = response.match(locationPattern) || query.match(locationPattern);

  if (locationMatches && locationMatches.length > 0) {
    result.location = locationMatches[0];
  }

  // ===== ACTION EXTRACTION =====
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('check') || lowerQuery.includes('show')) {
    result.action = 'check';
  } else if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('locate')) {
    result.action = 'find';
  } else if (lowerQuery.includes('list')) {
    result.action = 'list';
  } else if (lowerQuery.includes('where')) {
    result.action = 'locate';
  }

  return result;
}

// ============================================================
// AGENT EXECUTOR (Cached)
// ============================================================

let agentExecutor: AgentExecutor | null = null;

async function getAgentExecutor() {
  if (agentExecutor) return agentExecutor;

  // Get current user (default to pharmacist)
  const currentUser = await db.getUserById('P001');

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Create tools
  const tools = createAllTools({
    db,
    userRole: currentUser.role,
    userId: currentUser.empId,
  });

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // ENHANCED SYSTEM PROMPT WITH CONVERSATION CONTEXT
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are P-MACS Agent, an intelligent pharmacy management assistant for hospital staff.

Current User: ${currentUser.name} (${currentUser.role})

You have access to ${tools.length} specialized tools for pharmacy management.

CRITICAL: CONVERSATION MEMORY
- You can remember previous messages in this conversation
- When users say "it", "that", "this drug", "the one I mentioned", refer to the conversation history
- If a user asks a follow-up question, use context from previous messages
- If you need clarification, ask specific questions

CRITICAL RESPONSE RULES:
1. Call the appropriate tool immediately and extract ALL data from the results
2. Present information in the MOST SCANNABLE format possible
3. USE TABLES whenever showing multiple items with similar data (stock levels, expiry dates, locations)
4. Use **bold** for drug names, locations, and critical values
5. ONLY show the data table - nothing else

FORBIDDEN COLUMNS - NEVER SHOW THESE IN ANY TABLE:
❌ Category
❌ Recommendation
❌ Estimated Value
❌ Turnover Rate
❌ Risk Level
❌ Action
❌ Days Until Expiry
❌ Expiry Date (unless specifically asked about expiring drugs)
❌ Severity
❌ Day of Week Pattern (use Peak Day instead)
❌ Variability
❌ Any column with mostly 0 or N/A values

When creating tables, ONLY include these types of columns:
✅ Rank
✅ Drug Name
✅ Location
✅ Quantity / Qty On Hand / Current Stock
✅ Total Used / Avg Daily Usage
✅ Days of Stock Remaining
✅ Stock Status (use EXACT value from tool data - do NOT interpret or change it)
✅ Transaction Count

6. Only show what the user asks for - if they ask for "top movers", show only top movers. If they ask for "slow movers", show only slow movers
7. For movers reports (top/slow), show ONLY 10 items in the table unless user specifically asks for more
8. For seasonal trends, show ONLY 10 items in the table unless user specifically asks for more
9. CRITICAL: Use the EXACT stockStatus value from the tool output. DO NOT add your own risk assessments or urgency indicators. If the tool says "No Usage", display "No Usage" - not "High Risk" or "Urgent"
10. NEVER add separate text sections after tables

FORMATTING GUIDELINES:
- For seasonal trends/patterns: Use this EXACT format
  | Drug Name | Trend | Change | Recent Daily | Historical Daily | Peak Day | Pattern |

  NO RANK COLUMN - trends are already sorted by severity
  Trend formatting: 📈 Increasing, 📉 Decreasing, ➡️ Stable
  Change: Show percentage with + or - (e.g., "+25.5%" or "-18.2%")
  Recent/Historical Daily: Round to 1 decimal (e.g., "12.5" not "12.500")
  Peak Day: Day name only (e.g., "Monday", "Tuesday")
  Pattern: Simple text (e.g., "Stable", "Weekly cycle", "Increasing trend")

- For multiple drug locations/batches: USE A TABLE
  Example format:
  | Location | Quantity | Expiry Date | Batch | Status |
  |----------|----------|-------------|-------|--------|
  | **ICU-Shelf-A** | 70 units | 2025-06-15 | BATCH-001 | ✅ Available |

- For single drug info: Use clean bullet points with **bold** labels
  Example:
  **Propofol 20mg/mL** - Total: 145 units across 3 locations

  • **ICU-Shelf-A**: 70 units, Expires: 2025-06-15
  • **Emergency-Room-Cabinet**: 45 units, Expires: 2025-07-20
  • **Ward-1-Storage**: 30 units, Expires: 2025-08-10

- For alerts/warnings: Use ⚠️ or 🚨 for critical issues, ✅ for good status
- For lists of drugs: Always use tables to show quantities, locations, expiry
- Include ALL relevant data: quantities, expiry dates, batch numbers, locations, safety stock levels

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE THESE SECTIONS:
❌ "Controlled Substances:" - NEVER create this section
❌ "Recommendations:" - NEVER create this section
❌ "Estimated Value:" or "Value:" - NEVER create this section
❌ Any bullet points or lists after the table
❌ Any text after the data table
❌ Summary sections of any kind

THE ONLY OUTPUT YOU PROVIDE:
✅ A simple header explaining what the table shows and the time period (if applicable)
✅ Then the data table (markdown format)
✅ Nothing else after the table

HEADER FORMAT RULES:
- Keep headers brief and descriptive
- For time-based reports: Include the period (e.g., "**Top Movers - December 2025**" or "**Slow Movers - Last 30 days**")
- For expiring drugs: "**Expiring Drugs - Next [X] days**"
- For inventory: "**[Drug Name] Inventory**" or "**Full Inventory**"
- For stock alerts: "**Low Stock Alerts**" or "**Stockout Risk**"
- For seasonal trends: "**Seasonal Usage Trends - [Period]**"
- For batch reports: "**Batch Report - [Batch/Drug Name]**"
- Use **bold** for the header

Examples:
- "**Top Movers - December 2025**"
- "**Slow Movers - Last 90 days**"
- "**Expiring Drugs - Next 30 days**"
- "**Propofol Inventory**"
- "**Seasonal Usage Trends - Last 60 vs 120 days**"

HANDLING "HOW DID YOU CALCULATE THIS?" QUESTIONS:
When users ask about prediction methods, formulas, or how calculations were made:
- For ML-based tools (forecast, safety stock, seasonal patterns, stockout prediction, usage trends):
  "I used a machine learning model that analyzes your historical usage patterns, seasonal trends, and inventory data. I can't share the specific formula, but the model factors in usage history, variability, lead times, and demand patterns to generate these predictions."
- For statistical tools (analytics, reports):
  "This is based on statistical analysis of your transaction history and current inventory levels. The calculations follow industry-standard pharmacy forecasting methods."
- Keep it brief and professional - don't elaborate unless asked

CONTEXT RESOLUTION:
- If user says "it", "that", "this" - check conversation history for last mentioned drug/location
- If ambiguous, ask: "I found X and Y. Which one do you mean?"
- If completely unclear, ask specific question: "Which drug/location are you asking about?"

REMEMBER: Show ONLY the table. Stop immediately after the table ends. Do not add any text after the closing table.`,
    ],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  // Create agent
  const agent = await createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  agentExecutor = new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 5,
  });

  return agentExecutor;
}

// ============================================================
// MAIN CHAT HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { message, userId = 'P001' } = await request.json();

    // Validate message format
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Get or create conversation context
    const context = getOrCreateConversationContext(userId);
    context.messageCount++;

    // EDGE CASE HANDLING
    const edgeCheck = handleEdgeCases(message, context);
    if (!edgeCheck.shouldProceed) {
      return NextResponse.json({
        response: edgeCheck.response!,
        success: true,
        suggestions: context.messageCount === 1 ? [
          'Check Paracetamol stock',
          'Show drugs expiring in 30 days',
          'What are the low stock items?',
        ] : [],
      });
    }

    // Get agent executor
    const executor = await getAgentExecutor();

    // Load conversation history from memory
    const chatHistory = await context.memory.loadMemoryVariables({});

    // Build smart context hints
    let enhancedMessage = message;
    const contextHints: string[] = [];

    // Check for pronoun references that need context
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.match(/\b(it|that|this|the drug|the medication)\b/)) {
      if (context.lastDrug) {
        contextHints.push(`referring to ${context.lastDrug}`);
      }
    }

    if (lowerMessage.match(/\b(there|that location|that place)\b/)) {
      if (context.lastLocation) {
        contextHints.push(`referring to ${context.lastLocation}`);
      }
    }

    // Add context for vague location queries
    if (lowerMessage.match(/^(where|location|find)/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Add context for follow-up quantity/expiry questions
    if (lowerMessage.match(/\b(how much|how many|quantity|stock level|when|expire|expiry)\b/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Apply context hints naturally
    if (contextHints.length > 0) {
      enhancedMessage = `${message} [User is ${contextHints.join(', ')}]`;
    }

    // Execute query with conversation context
    const result = await executor.invoke({
      input: enhancedMessage,
    });

    // Extract entities from this conversation turn
    const entities = extractEntities(message, result.output);

    // Clean up extracted drug name (remove common suffixes)
    if (entities.drug) {
      let cleanDrug = entities.drug;
      cleanDrug = cleanDrug.replace(/\s+(stock|inventory|level|levels|count|total|item|items)$/i, '');
      context.lastDrug = cleanDrug.trim();
    }

    if (entities.location) {
      context.lastLocation = entities.location;
    }

    if (entities.action) {
      context.lastAction = entities.action;
    }

    // Save conversation to memory
    await context.memory.saveContext(
      { input: message },
      { output: result.output }
    );

    // Generate suggested follow-up questions
    const suggestions = generateSuggestions(message, result.output, context);

    return NextResponse.json({
      response: result.output,
      success: true,
      suggestions,
      context: {
        lastDrug: context.lastDrug,
        lastLocation: context.lastLocation,
        messageCount: context.messageCount,
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);

    // Enhanced error messages
    let errorMessage = 'I encountered an error processing your request.';

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try a simpler question.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Too many requests. Please wait 30 seconds and try again.';
      } else if (error.message.includes('API key')) {
        errorMessage = 'API configuration error. Please contact support.';
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
