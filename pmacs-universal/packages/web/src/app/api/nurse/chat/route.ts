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
    /^(how are you|what\'s up|wassup)\b/i,
  ];
  if (greetingPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'greeting';
  }

  // Pharmacy-related keywords (nurse-focused)
  const pharmacyKeywords = [
    'stock', 'inventory', 'drug', 'medication', 'medicine', 'med',
    'expir', 'expiry', 'location', 'ward', 'quantity', 'icu', 'emergency',
    'shelf', 'cabinet', 'storage', 'available', 'have', 'find',
    'paracetamol', 'morphine', 'fentanyl', 'propofol', 'insulin',
    'where is', 'how much', 'how many', 'what drugs', 'which meds',
    'show me', 'find', 'search', 'check', 'list', 'get', 'do we have',
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
      response: "Please enter a message. I can help you:\n• Find drug locations\n• Check ward inventory\n• Show expiring medications",
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
      response: "I didn't understand that. Try asking:\n• 'Where is Morphine?'\n• 'What\'s in ICU?'\n• 'Show expiring drugs'",
    };
  }

  // 4. Intent-based routing
  const intent = detectIntent(message);

  if (intent === 'greeting') {
    return {
      shouldProceed: false,
      response: `Hello! I'm your ward inventory assistant. I can help you:\n• Find drug locations and quantities\n• Check ward/ICU inventory\n• Show expiring medications\n• Get FEFO (First Expire, First Out) order\n\nWhat would you like to know?`,
    };
  }

  if (intent === 'out_of_scope') {
    return {
      shouldProceed: false,
      response: "I can only help with ward inventory questions. Try asking about drug locations, ward stock, or expiring medications.",
    };
  }

  // 5. Ambiguous queries without context
  const ambiguousPatterns = [
    /^(check|show|find|get|tell me|where|what|how much|how many)$/i,
    /^(stock|inventory|items|drugs|medications|meds)$/i,
    /^(it|that|this|those|these)$/i,
  ];

  if (ambiguousPatterns.some(pattern => pattern.test(trimmed)) && context.messageCount === 0) {
    return {
      shouldProceed: false,
      response: "I need more information. For example:\n• 'Where is Morphine?'\n• 'What\'s in Ward-2?'\n• 'Show drugs expiring in 30 days'",
    };
  }

  // All checks passed
  return { shouldProceed: true };
}

// ============================================================
// SUGGESTED FOLLOW-UP QUESTIONS (Nurse-focused)
// ============================================================

function generateSuggestions(
  userQuery: string,
  botResponse: string,
  context: ConversationContext
): string[] {
  const suggestions: string[] = [];
  const lowerQuery = userQuery.toLowerCase();

  // Smart suggestion generation based on context

  // If we just looked up a drug, suggest related actions
  if (context.lastDrug) {
    const drugName = context.lastDrug;

    // Don't repeat the same type of question
    if (!lowerQuery.includes('where') && !lowerQuery.includes('locat')) {
      suggestions.push(`Where else is ${drugName}?`);
    }

    if (!lowerQuery.includes('expir') && !lowerQuery.includes('when')) {
      suggestions.push(`When does ${drugName} expire?`);
    }

    if (suggestions.length < 3) {
      suggestions.push(`Check ${drugName} in ICU`);
    }
  }

  // If we just looked at a location, suggest location-based queries
  if (context.lastLocation && suggestions.length < 3) {
    const location = context.lastLocation;

    if (!lowerQuery.includes('expir')) {
      suggestions.push(`Show expiring items in ${location}`);
    }

    if (suggestions.length < 3) {
      suggestions.push(`What else is in ${location}?`);
    }
  }

  // Query-type based suggestions (when no specific drug/location context)
  if (suggestions.length < 2) {
    if (lowerQuery.includes('expir')) {
      suggestions.push('Show critical expiring drugs');
      suggestions.push('What expires in 7 days?');
    } else if (lowerQuery.includes('ward') || lowerQuery.includes('icu')) {
      suggestions.push('Check for low stock items');
      suggestions.push('Show expiring drugs');
    } else {
      suggestions.push('What\'s in ICU?');
      suggestions.push('Show expiring medications');
    }
  }

  // General high-value suggestions if we still don't have enough
  if (suggestions.length < 2) {
    const generalSuggestions = [
      'Show drugs expiring soon',
      'Check Ward-1 inventory',
      'Where is Morphine?',
      'What\'s low stock in ICU?',
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
  const boldDrugPattern = /\*\*([A-Z][a-zA-Z\s]+(?:Sulfate|Hydrochloride|mg\/mL|mcg|mg)?)\*\*/g;
  const boldMatches = [...response.matchAll(boldDrugPattern)];

  if (boldMatches.length > 0) {
    let drugName = boldMatches[0][1].trim();

    // Filter out non-drug bold text
    const excludeWords = ['Inventory', 'Availability', 'Stock', 'Check', 'Expiring', 'Drugs',
                          'Ward', 'ICU', 'Emergency', 'Pharmacy', 'Critical', 'Shortage'];

    drugName = drugName.replace(/\s+(Inventory|Stock|Level|Availability)$/i, '');

    if (!excludeWords.some(word => drugName.includes(word))) {
      result.drug = drugName;
    }
  }

  // Location extraction
  const locationPattern = /\b(Ward[- ]?\d+|ICU|Emergency[- ]?Room|ER|Shelf[- ]?[A-Z0-9]|Cabinet[- ]?[A-Z0-9]|Storage)\b/gi;
  const locationMatches = response.match(locationPattern) || query.match(locationPattern);

  if (locationMatches && locationMatches.length > 0) {
    result.location = locationMatches[0];
  }

  // Action extraction
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('where')) {
    result.action = 'locate';
  } else if (lowerQuery.includes('check') || lowerQuery.includes('show')) {
    result.action = 'check';
  } else if (lowerQuery.includes('find')) {
    result.action = 'find';
  }

  return result;
}

// Cache the agent executor
let agentExecutor: AgentExecutor | null = null;

async function getAgentExecutor() {
  if (agentExecutor) return agentExecutor;

  // Get current user (nurse)
  const currentUser = await db.getUserById('N001');

  if (!currentUser) {
    throw new Error('User not found');
  }

  // Create tools - using getToolsByPermission for nurse-level access
  const allTools = createAllTools({
    db,
    userRole: currentUser.role,
    userId: currentUser.empId,
  });

  const tools = getToolsByPermission(allTools, 'Nurse');

  // Initialize LLM with streaming for faster perceived response
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
    streaming: true, // Enable streaming for faster responses
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create agent prompt - Gold Standard Nurse Implementation
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are P-MACS Assistant, a ward inventory assistant helping nurses access drug information INSTANTLY.

⚠️ CRITICAL SAFETY RULE ⚠️
COPY TOOL OUTPUT EXACTLY - DO NOT reorganize or create alphabetical patterns!
If tool returns 12 drugs at "ICU-Shelf-A" and 9 at "ICU-Shelf-B", show ONLY those two locations.
DO NOT invent "ICU-Shelf-C, D, E, F, G, H, I, J" - they don't exist and will send nurses to wrong shelves!

CRITICAL: CONVERSATION MEMORY
- You can remember previous messages in this conversation
- When users say "it", "that", "this drug", "the one I mentioned", refer to the conversation history
- If a user asks a follow-up question, use context from previous messages
- If you need clarification, ask specific questions

Current User: ${currentUser.name} (${currentUser.role})

You have access to ${tools.length} essential tools for ward operations:
- Drug availability lookup (location, quantity, expiry)
- Ward-specific stock checks
- Expiring medication alerts
- FEFO (First Expire, First Out) recommendations

CONTEXT RESOLUTION:
- If user says "it", "that", "this" - check conversation history for last mentioned drug/location
- If ambiguous, ask: "Which drug do you mean - X or Y?"
- If completely unclear, ask specific question: "Which drug are you asking about?"

WARNING - PERMISSION BOUNDARIES (CRITICAL - ENFORCE STRICTLY):
As a NURSE role, you do NOT have access to:
 Forecasting and demand prediction
 Inventory updates or modifications
 Safety stock calculations
 Purchase orders and procurement
 ML predictions and analytics
 Transaction history
 Usage statistics and trends
 Batch reports or detailed analytics

INSTANT DENIAL FOR RESTRICTED REQUESTS:
If asked about forecasting, predictions, ordering, updates, analytics, or any restricted feature:
"[ACCESS DENIED] I don't have access to [feature] as a nurse. This requires Pharmacist or Administrator privileges.

**Next Step:** Contact the pharmacy department for assistance."

DO NOT attempt to use tools you don't have access to. Respond immediately with denial.

CRITICAL RESPONSE RULES (NURSE-OPTIMIZED):
1. Call the appropriate tool immediately and extract ALL data
2. Copy tool output VERBATIM - literally copy-paste each field value
3. DO NOT organize, alphabetize, or "clean up" location names
4. DO NOT create sequential patterns (Shelf-A, B, C, D... is FORBIDDEN)
5. If tool shows: "ICU-Shelf-A", "ICU-Shelf-B", "ICU-Shelf-A", "ICU-Shelf-B" (repeated)
   YOU MUST WRITE: "ICU-Shelf-A", "ICU-Shelf-B", "ICU-Shelf-A", "ICU-Shelf-B" (keep repetitions!)
6. DO NOT invent shelves C, D, E, F, G, H, I, J - these DO NOT EXIST
7. Each row = one tool result item - copy ALL fields from that item EXACTLY
8. Present information in the MOST SCANNABLE format possible
9. USE TABLES for any list of drugs (even just 2-3 items)
10. Use **bold** for drug names, locations, and critical warnings
11. ONLY show the data - no explanations, no summaries, no extra text
12. LIFE-CRITICAL: Wrong location = wrong shelf = patient gets wrong drug = DEATH

FORBIDDEN COLUMNS - NEVER SHOW THESE IN NURSE TABLES:
× Category
× Drug ID or SKU codes
× Batch numbers (unless specifically asked)
× Cost or value information
× Turnover rates
× Statistical metrics
× Recommendation sections
× Any column nurses don't clinically need

REQUIRED COLUMNS FOR NURSE TABLES:
✓ Drug Name (always **bold**)
✓ Location (specific ward/shelf location)
✓ Quantity (with units: "units", "vials", "tablets")
✓ Expiry Date (YYYY-MM-DD format)
✓ Days Until Expiry (for expiring drugs only)

FORMATTING SPECIFICATIONS:

1. DRUG AVAILABILITY LOOKUP (single drug, multiple locations):
   Use this EXACT format:
   | Location | Quantity | Expiry Date |
   |----------|----------|-------------|
   | **ICU-Cabinet-A** | 45 units | 2025-06-15 |
   | **ER-Shelf-2** | 8 units (Low Stock) | 2025-05-20 |
   | **Ward-3-Storage** | 0 units (Out of Stock) | — |

   Quantity column rules:
   - Normal stock (> 10 units): Show just quantity (e.g., "45 units")
   - Low stock (1-10 units): Add text "(Low Stock)" after quantity
   - Out of stock (0 units): Add text "(Out of Stock)" after quantity
   - Expiring soon (< 30 days): Add text "(Expiring Soon)" if not already showing another status
   - NO emoji, NO status column - conditional text only when there's a problem

2. WARD/LOCATION STOCK CHECK (multiple drugs, one or more locations):

   a) For SPECIFIC single location (e.g., "ICU-Shelf-A", "Ward-2-Cabinet"):
   | Drug Name | Quantity | Expiry Date |
   |-----------|----------|-------------|
   | **Morphine 10mg** | 15 vials | 2025-08-10 |
   | **Fentanyl 50mcg** | 8 vials (Low Stock) | 2025-07-05 |

   b) For DEPARTMENT/WARD (e.g., "ICU", "Ward 2", "ER") - includes ALL sub-locations:
   | Drug Name | Location | Quantity | Expiry Date |
   |-----------|----------|----------|-------------|
   | **Morphine 10mg** | **ICU-Shelf-A** | 15 vials | 2025-08-10 |
   | **Morphine 10mg** | **ICU-Cabinet-B** | 8 vials (Low Stock) | 2025-07-05 |
   | **Propofol 1%** | **ICU-Shelf-A** | 23 vials | 2025-06-15 |

   CRITICAL: If the SAME drug appears at MULTIPLE locations, show EVERY SINGLE ENTRY
   Example: If Ciprofloxacin is at ICU-Shelf-A AND ICU-Shelf-B, show BOTH rows
   DO NOT combine or deduplicate - each location is a separate row

   DATA FIDELITY EXAMPLE:
   If tool returns drug at ICU-Shelf-B with quantity 65:
   You MUST write: | **Ciprofloxacin 500mg** | **ICU-Shelf-B** | 65 units | ...
   DO NOT write: | **Ciprofloxacin 500mg** | **ICU-Shelf-A** | ... (WRONG LOCATION!)
   DO NOT invent sequential shelves (A, B, C, D...) - use EXACT location from tool

   Show ONLY items in stock (qty > 0). If location has no stock, show:
   "**No drugs currently in [Location]** - Contact pharmacy for restocking"

3. EXPIRING DRUGS (next 30/60/90 days):
   Use this EXACT format:
   | Drug Name | Location | Quantity | Expiry Date | Days Until Expiry |
   |-----------|----------|----------|-------------|-------------------|
   | **Insulin Glargine** | **Ward-2-Fridge** | 12 vials | 2025-02-15 | 23 days |
   | **Propofol 1%** | **ICU-Cabinet-B** | 8 vials | 2025-02-20 | 28 days |

   Priority order: Soonest expiry first
   Show ONLY drugs with qty > 0

4. CRITICAL SHORTAGE (when drug is out everywhere):
   "**[Drug Name] - Critical Shortage**

   Out of stock at all locations
   Contact pharmacy for availability"

HEADER FORMAT RULES:
- Keep headers brief and clinical
- Include location or time period when relevant
- Always use **bold** for headers

Examples:
- "**Morphine Availability**"
- "**ICU Stock Check**"
- "**Expiring Drugs - Next 30 Days**"
- "**Ward 3 Inventory**"
- "**[Drug Name] - All Locations**"

ABSOLUTELY FORBIDDEN - DO NOT INCLUDE THESE SECTIONS:
× "Recommendations:" or "Suggested Actions:"
× "Notes:" or "Additional Information:"
× Any text after the data table
× Summary paragraphs
× Explanations of the data
× Clinical advice or dosing information (outside scope)

THE ONLY OUTPUT YOU PROVIDE:
✓ A brief clinical header (one line)
✓ The data table (markdown format)
✓ NOTHING else after the table

EXCEPTION - Critical alerts only:
If drug is completely out of stock everywhere, show alert AFTER the table:
"→ Contact pharmacy - [Drug] unavailable at all locations"

HANDLING COMMON QUESTIONS:

"Where is [drug]?" →
Table showing all locations with quantity, expiry, status

"Do we have [drug]?" →
If yes: Table with locations
If no: "× **[Drug] is currently out of stock at all locations**
       → Contact pharmacy for availability"

"What\'s expiring soon?" →
Table of drugs expiring in next 30 days (default) or specified period

"What\'s in [location]?" →
IMPORTANT: If location is a department/ward (ICU, ER, Ward-1, Ward-2, etc.), use that as locationFilter to get ALL sub-locations
Example: "ICU inventory" means ALL locations starting with "ICU" (ICU-Shelf, ICU-Cabinet, ICU-Storage, etc.)
Example: "Ward 2" means ALL locations starting with "Ward-2" (Ward-2-Storage, Ward-2-Shelf, etc.)
Use list_ward_stock tool with locationFilter parameter
CRITICAL: Show ALL items returned by the tool - complete inventory, no limits
JUST DISPLAY THE DATA - no processing, no analysis, raw table output only
Table of all drugs in those locations with Drug Name, Location, Quantity, Expiry Date

"Is [drug] expired?" →
Check expiry date and show:
- If expired: "! **EXPIRED** - Do not use. Expiry: [date]. Contact pharmacy for replacement."
- If expiring soon: "⚠ **Expiring in [X] days** - Use soon or replace."
- If good: "✓ **Valid until [date]** - Safe to use."

RESTRICTED REQUESTS - Immediate denial:
"Forecast [drug]" → Denial message
"How much [drug] do we use?" → Denial message
"Update quantity" → Denial message
"Order more [drug]" → Denial message
"Show usage trends" → Denial message

CRITICAL: Show data FAST. Nurses are busy. No fluff, no extras, just the facts in a clean table.`,
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
    maxIterations: 3, // Reduced to prevent hanging
    returnIntermediateSteps: false,
  });

  return agentExecutor;
}

export async function POST(request: NextRequest) {
  try {
    const { message, userId = 'N001' } = await request.json();

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
    logAccess(userId, 'QUERY', 'Nurse', `Query: ${message}`);

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
          'Where is Morphine?',
          'Check ICU inventory',
          'Show expiring drugs',
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
    if (lowerMessage.match(/\b(how much|how many|quantity|when|expire|expiry)\b/)) {
      if (context.lastDrug && !lowerMessage.includes(context.lastDrug.toLowerCase())) {
        contextHints.push(`asking about ${context.lastDrug}`);
      }
    }

    // Apply context hints naturally
    if (contextHints.length > 0) {
      enhancedMessage = `${message} [User is ${contextHints.join(', ')}]`;
    }

    // Execute query with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 30000)
    );

    const result = await Promise.race([
      executor.invoke({
        input: enhancedMessage,
      }),
      timeoutPromise
    ]) as { output: string };

    // Extract entities from this conversation turn
    const entities = extractEntities(message, result.output);

    // Clean up extracted drug name
    if (entities.drug) {
      let cleanDrug = entities.drug;
      cleanDrug = cleanDrug.replace(/\s+(stock|inventory|level|availability)$/i, '');
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
