import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { CSVDatabaseAdapter, createAllTools, getToolsByPermission } from '@pmacs/core';
import path from 'path';
import { logAccess } from '@/lib/access-logger';

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

  // Pharmacy-related keywords (pharmacist-focused - includes analytics, forecasting)
  const pharmacyKeywords = [
    'stock', 'inventory', 'drug', 'medication', 'medicine', 'pharma',
    'expir', 'expiry', 'location', 'ward', 'quantity', 'order',
    'alert', 'low', 'critical', 'batch', 'safety', 'reorder',
    'forecast', 'predict', 'usage', 'consumption', 'transaction',
    'trend', 'pattern', 'seasonal', 'analytics', 'report',
    'top movers', 'slow movers', 'stockout', 'purchase', 'procurement',
    'update', 'add stock', 'receive', 'dispense', 'adjust',
    'where is', 'how much', 'how many', 'what drugs', 'which items',
    'show me', 'find', 'search', 'check', 'list', 'get', 'analyze',
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
      response: "Please enter a message. I can help you:\n• Analyze inventory trends\n• Forecast demand\n• Check stock levels\n• Generate reports\n• Update inventory",
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
  const repeatingChars = /(.)\1{5,}/.test(trimmed); // More than 5 repeated chars

  if ((!hasVowels && trimmed.length > 5) || repeatingChars) {
    return {
      shouldProceed: false,
      response: "I didn't understand that. Try asking:\n• 'Show top movers this month'\n• 'Forecast Morphine demand'\n• 'Check expiring drugs'\n• 'Analyze seasonal patterns'",
    };
  }

  // 4. Intent-based routing
  const intent = detectIntent(message);

  if (intent === 'greeting') {
    return {
      shouldProceed: false,
      response: `Hello! I'm your pharmacy management assistant. I can help you:\n• Analyze inventory and usage trends\n• Forecast demand and predict stockouts\n• Check stock levels and expiring items\n• Generate reports (top/slow movers, analytics)\n• Update inventory and create purchase orders\n\nWhat would you like to do?`,
    };
  }

  if (intent === 'out_of_scope') {
    return {
      shouldProceed: false,
      response: "I can only help with pharmacy management questions. Try asking about inventory analytics, forecasting, stock levels, or reports.",
    };
  }

  // 5. Ambiguous queries without context
  const ambiguousPatterns = [
    /^(check|show|find|get|tell me|where|what|how much|how many)$/i,
    /^(stock|inventory|items|drugs|medications|report|data)$/i,
    /^(it|that|this|those|these)$/i,
  ];

  if (ambiguousPatterns.some(pattern => pattern.test(trimmed)) && context.messageCount === 0) {
    return {
      shouldProceed: false,
      response: "I need more information. For example:\n• 'Show top movers for December'\n• 'Forecast Paracetamol demand'\n• 'Check drugs expiring in 30 days'\n• 'Analyze seasonal patterns'",
    };
  }

  // All checks passed
  return { shouldProceed: true };
}

// ============================================================
// SUGGESTED FOLLOW-UP QUESTIONS (Pharmacist-focused)
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

  // If we just looked up a drug, suggest analytics/forecasting
  if (context.lastDrug) {
    const drugName = context.lastDrug;

    // Don't repeat the same type of question
    if (!lowerQuery.includes('forecast') && !lowerQuery.includes('predict')) {
      suggestions.push(`Forecast ${drugName} demand`);
    }

    if (!lowerQuery.includes('trend') && !lowerQuery.includes('usage')) {
      suggestions.push(`Analyze ${drugName} usage trends`);
    }

    if (!lowerQuery.includes('where') && !lowerQuery.includes('locat') && suggestions.length < 3) {
      suggestions.push(`Where is ${drugName} located?`);
    }
  }

  // If we just looked at a location, suggest location-based queries
  if (context.lastLocation && suggestions.length < 3) {
    const location = context.lastLocation;

    if (!lowerQuery.includes('expir')) {
      suggestions.push(`Show expiring items in ${location}`);
    }

    if (!lowerQuery.includes('low') && suggestions.length < 3) {
      suggestions.push(`Check low stock in ${location}`);
    }
  }

  // Query-type based suggestions
  if (suggestions.length < 2) {
    if (lowerQuery.includes('top movers') || lowerResponse.includes('top movers')) {
      suggestions.push('Show slow movers');
      suggestions.push('Analyze seasonal patterns');
    } else if (lowerQuery.includes('slow movers') || lowerResponse.includes('slow movers')) {
      suggestions.push('Show top movers');
      suggestions.push('Check stockout risks');
    } else if (lowerQuery.includes('expir')) {
      suggestions.push('Generate purchase order');
      suggestions.push('Check low stock items');
    } else if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      suggestions.push('Show usage trends');
      suggestions.push('Check safety stock levels');
    } else if (lowerQuery.includes('stock') || lowerQuery.includes('inventory')) {
      suggestions.push('Show expiring drugs');
      suggestions.push('Analyze usage patterns');
    }
  }

  // General high-value suggestions if we still don't have enough
  if (suggestions.length < 2) {
    const generalSuggestions = [
      'Show this month\'s top movers',
      'Check critical stock alerts',
      'Analyze seasonal patterns',
      'Forecast high-priority drugs',
      'Show expiring items',
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

  // Drug name extraction (from bolded text in response)
  const boldDrugPattern = /\*\*([A-Z][a-zA-Z\s]+(?:Sulfate|Hydrochloride|mg\/mL|mcg|mg|Patch)?)\*\*/g;
  const boldMatches = [...response.matchAll(boldDrugPattern)];

  if (boldMatches.length > 0) {
    let drugName = boldMatches[0][1].trim();

    // Filter out non-drug bold text
    const excludeWords = ['Inventory', 'Top', 'Slow', 'Movers', 'Expiring', 'Drugs',
                          'Stock', 'Alerts', 'Low', 'Critical', 'Items', 'Next',
                          'Last', 'Ward', 'ICU', 'Emergency', 'Pharmacy', 'Report',
                          'Trends', 'Patterns', 'Monthly', 'Seasonal'];

    drugName = drugName.replace(/\s+(Inventory|Stock|Level|Report|Trends)$/i, '');

    if (!excludeWords.some(word => drugName.includes(word))) {
      result.drug = drugName;
    }
  }

  // Location extraction
  const locationPattern = /\b(Ward[- ]?\d+|ICU|Emergency[- ]?Room|Pharmacy[- ]?Main|Secure[- ]?Vault|Cabinet|Shelf[- ]?[A-Z0-9]|Storage)\b/gi;
  const locationMatches = response.match(locationPattern) || query.match(locationPattern);

  if (locationMatches && locationMatches.length > 0) {
    result.location = locationMatches[0];
  }

  // Action extraction
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
    result.action = 'forecast';
  } else if (lowerQuery.includes('analyze') || lowerQuery.includes('trend')) {
    result.action = 'analyze';
  } else if (lowerQuery.includes('check') || lowerQuery.includes('show')) {
    result.action = 'check';
  } else if (lowerQuery.includes('update') || lowerQuery.includes('add')) {
    result.action = 'update';
  }

  return result;
}

// Cache the agent executor
let agentExecutor: AgentExecutor | null = null;

async function getAgentExecutor() {
  if (agentExecutor) return agentExecutor;

  // Get current user (pharmacist)
  const currentUser = await db.getUserById('P001');

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Create tools - using getToolsByPermission for role-based access
  const allTools = createAllTools({
    db,
    userRole: currentUser.role,
    userId: currentUser.empId,
  });

  const tools = getToolsByPermission(allTools, 'Pharmacist');

  // Initialize LLM with streaming for faster perceived response
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
    streaming: true, // Enable streaming for faster responses
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create agent prompt
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are P-MACS Agent, an intelligent pharmacy management assistant for hospital pharmacists.

CRITICAL: CONVERSATION MEMORY
- You can remember previous messages in this conversation
- When users say "it", "that", "this drug", "the one I mentioned", refer to the conversation history
- If a user asks a follow-up question, use context from previous messages
- If you need clarification, ask specific questions

Current User: ${currentUser.name} (${currentUser.role})
Current Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Current Year: ${new Date().getFullYear()}
Current Month: ${new Date().toLocaleDateString('en-US', { month: 'long' })}

CONTEXT RESOLUTION:
- If user says "it", "that", "this" - check conversation history for last mentioned drug/location
- If ambiguous, ask: "Which drug do you mean - X or Y?"
- If completely unclear, ask specific question: "Which drug/report are you asking about?"

TEMPORAL CONTEXT & DATE INTELLIGENCE (CRITICAL):
- ALWAYS assume users want RECENT data, not old/archived data from years ago
- When users ask for "November data" or any month WITHOUT specifying a year, they mean the MOST RECENT occurrence of that month
- If today is January 2026 and user asks "November data", they mean November 2025 (NOT November 2023 or 2024)
- NEVER default to years 2023, 2024 or earlier unless explicitly requested
- Calculate the correct recent year: If asked month is in the future relative to current month, use previous year; otherwise use current year
  Example: Today is January 2026, user asks "November" → November 2025 (past relative to January)
  Example: Today is November 2026, user asks "January" → January 2026 (past relative to November in same year)
- "Last month" = previous calendar month from current date
- "This month" = current calendar month
- "Monthly report" = report for the most recent complete month (if today is January 2026, show December 2025)
- Default time ranges: Last 30 days, Last 60 days, Last 90 days (from current date)
- For seasonal analysis: Compare recent period to same period last year

MONTHLY REPORT LOGIC:
When user asks for "monthly report" or "monthly data":
1. Determine the most recent COMPLETE month (if today is January 15, 2026, use December 2025)
2. Use tool parameters like "days: 30" or "startDate/endDate" to get that specific month's data
3. Header must include: "**[Month] [Year] Report**" (e.g., "**December 2025 Monthly Report**")
4. Show ONLY data from that month - do NOT mix with other periods
5. Focus on actionable metrics: top/slow movers, stock alerts, expiring drugs from THAT month
6. If user asks for multiple months, create separate sections for each month with clear headers

You have access to ${tools.length} specialized tools for pharmacy management including:
- Complete inventory management
- Advanced forecasting and ML predictions
- Expiry tracking and FEFO recommendations
- Analytics and reporting
- Procurement and purchase orders

CRITICAL RESPONSE RULES:
1. Call the appropriate tool immediately and extract ALL data from the results
2. Use EXACT values from tool output - NEVER modify, invent, or change ANY data
3. Location MUST be EXACT string from tool (if tool says "ICU-Shelf-B", write exactly "ICU-Shelf-B")
4. Quantity MUST be EXACT number from tool
5. Drug names MUST be EXACT string from tool
6. All data fields MUST match tool output exactly - NO fabrication, NO guessing
7. Present information in the MOST SCANNABLE format possible
8. USE TABLES whenever showing multiple items with similar data (stock levels, expiry dates, locations)
9. Use **bold** for drug names, locations, and critical values
10. ONLY show the data table - nothing else
11. NEVER deduplicate drugs - if same drug at multiple locations/batches, show EVERY entry as separate row
12. DATA FIDELITY IS CRITICAL - incorrect locations/quantities can cause serious errors

FORBIDDEN COLUMNS - NEVER SHOW THESE IN ANY TABLE:
× Category
× Recommendation
× Estimated Value
× Turnover Rate
× Risk Level
× Action
× Days Until Expiry
× Expiry Date (unless specifically asked about expiring drugs)
× Severity
× Day of Week Pattern (use Peak Day instead)
× Variability
× Any column with mostly 0 or N/A values

When creating tables, ONLY include these types of columns:
✓ Rank
✓ Drug Name
✓ Location
✓ Quantity / Qty On Hand / Current Stock (add conditional status text when needed)
✓ Total Used / Avg Daily Usage
✓ Days of Stock Remaining
✓ Transaction Count

Quantity Column Rules:
- Normal stock: Show just quantity (e.g., "145 units")
- Low stock (1-10 units): Add text from stockStatus if it indicates a problem (e.g., "8 units (Low Stock)")
- Critical stock issues: Add text from stockStatus (e.g., "0 units (Stockout)")
- NO separate Status column - conditional text only when there's a problem

6. Only show what the user asks for - if they ask for "top movers", show only top movers. If they ask for "slow movers", show only slow movers
7. For movers reports (top/slow), show ONLY 10 items in the table unless user specifically asks for more
8. For seasonal trends, show ONLY 10 items in the table unless user specifically asks for more
9. For location/ward inventory queries: Show ALL items - complete inventory, no limits (this overrides rules #7 and #8)
10. CRITICAL: Use the EXACT stockStatus value from the tool output. DO NOT add your own risk assessments or urgency indicators. If the tool says "No Usage", display "No Usage" - not "High Risk" or "Urgent"
11. NEVER add separate text sections after tables

FORMATTING GUIDELINES:
- For seasonal trends/patterns: Use this EXACT format
  | Drug Name | Trend | Change | Recent Daily | Historical Daily | Peak Day | Pattern |

  NO RANK COLUMN - trends are already sorted by severity
  Trend formatting: "Increasing", "Decreasing", "Stable" (text only, no emoji)
  Change: Show percentage with + or - (e.g., "+25.5%" or "-18.2%")
  Recent/Historical Daily: Round to 1 decimal (e.g., "12.5" not "12.500")
  Peak Day: Day name only (e.g., "Monday", "Tuesday")
  Pattern: Simple text (e.g., "Stable", "Weekly cycle", "Increasing trend")

- For multiple drug locations/batches: USE A TABLE
  Example format:
  | Location | Quantity | Expiry Date | Batch |
  |----------|----------|-------------|-------|
  | **ICU-Shelf-A** | 70 units | 2025-06-15 | BATCH-001 |
  | **ER-Cabinet-B** | 8 units (Low Stock) | 2025-07-20 | BATCH-002 |

  CRITICAL: If the SAME drug appears at MULTIPLE locations, show EVERY SINGLE ENTRY as separate rows
  DO NOT combine or deduplicate - each location/batch is a unique row

  DATA FIDELITY: Copy exact location strings from tool output
  If tool says "ICU-Shelf-B", write "ICU-Shelf-B" - NOT "ICU-Shelf-A" or any other location
  DO NOT fabricate sequential shelves (A, B, C, D, E...)

- For single drug info: Use clean bullet points with **bold** labels
  Example:
  **Propofol 20mg/mL** - Total: 145 units across 3 locations

  • **ICU-Shelf-A**: 70 units, Expires: 2025-06-15
  • **Emergency-Room-Cabinet**: 45 units, Expires: 2025-07-20
  • **Ward-1-Storage**: 30 units, Expires: 2025-08-10

- For alerts/warnings: Use clear text labels for critical issues (e.g., "Low Stock", "Stockout", "Expiring Soon")
- For lists of drugs: Always use tables to show quantities, locations, expiry
- Include ALL relevant data: quantities, expiry dates, batch numbers, locations, safety stock levels

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE THESE SECTIONS:
× "Controlled Substances:" - NEVER create this section
× "Recommendations:" - NEVER create this section
× "Estimated Value:" or "Value:" - NEVER create this section
× Any bullet points or lists after the table
× Any text after the data table
× Summary sections of any kind

THE ONLY OUTPUT YOU PROVIDE:
✓ A simple header explaining what the table shows and the time period (if applicable)
✓ Then the data table (markdown format)
✓ Nothing else after the table

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

COMMON TEMPORAL QUERIES (Examples):
User: "Show November data" → Interpret as: November ${new Date().getFullYear() - (new Date().getMonth() < 10 ? 1 : 0)} (most recent November)
User: "Monthly report" → Show: ${new Date().getMonth() === 0 ? 'December' : new Date().toLocaleDateString('en-US', { month: 'long' })} ${new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()} data (last complete month)
User: "Last month data" → Show: Previous calendar month from today
User: "December trends" (asked in Jan 2026) → Show: December 2025 (NOT December 2024 or 2023)
User: "Top movers last 30 days" → Calculate from: ${new Date().toLocaleDateString('en-US')} going back 30 days

HANDLING "HOW DID YOU CALCULATE THIS?" QUESTIONS:
When users ask about prediction methods, formulas, or how calculations were made:
- For ML-based tools (forecast, safety stock, seasonal patterns, stockout prediction, usage trends):
  "I used a machine learning model that analyzes your historical usage patterns, seasonal trends, and inventory data. I can't share the specific formula, but the model factors in usage history, variability, lead times, and demand patterns to generate these predictions."
- For statistical tools (analytics, reports):
  "This is based on statistical analysis of your transaction history and current inventory levels. The calculations follow industry-standard pharmacy forecasting methods."
- Keep it brief and professional - don't elaborate unless asked

REMEMBER: Show ONLY the header and table. Stop immediately after the table ends. Do not add any text after the closing table.`,
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

    // Log the query to access logs
    logAccess(userId, 'QUERY', 'Pharmacist', `Query: ${message}`);

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
          'Show top movers this month',
          'Forecast critical drugs',
          'Check expiring items',
        ] : [],
      });
    }

    // Get agent executor
    const executor = await getAgentExecutor();

    // Build smart context hints for follow-up questions
    let enhancedMessage = message;
    const contextHints: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Check for pronoun references that need context
    if (lowerMessage.match(/\b(it|that|this|the drug|the medication|those)\b/)) {
      if (context.lastDrug) {
        contextHints.push(`referring to ${context.lastDrug}`);
      }
    }

    if (lowerMessage.match(/\b(there|that location|that place)\b/)) {
      if (context.lastLocation) {
        contextHints.push(`referring to ${context.lastLocation}`);
      }
    }

    // Add context for vague queries
    if (lowerMessage.match(/^(where|location|find)/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Add context for follow-up analytics/forecasting questions
    if (lowerMessage.match(/\b(forecast|predict|analyze|trend|pattern)\b/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Add context for follow-up quantity/update questions
    if (lowerMessage.match(/\b(how much|how many|quantity|update|add|stock level)\b/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Apply context hints naturally
    if (contextHints.length > 0) {
      enhancedMessage = `${message} [User is ${contextHints.join(', ')}]`;
    }

    // Execute the query
    const result = await executor.invoke({
      input: enhancedMessage,
    });

    // Extract entities from this conversation turn
    const entities = extractEntities(message, result.output);

    // Clean up extracted drug name
    if (entities.drug) {
      let cleanDrug = entities.drug;
      cleanDrug = cleanDrug.replace(/\s+(stock|inventory|level|report|trends)$/i, '');
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
        lastAction: context.lastAction,
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
