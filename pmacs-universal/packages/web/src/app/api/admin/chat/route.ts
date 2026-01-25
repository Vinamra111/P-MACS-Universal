import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { BufferMemory } from 'langchain/memory';
import { CSVDatabaseAdapter, createAllTools, getToolsByPermission, UserRole } from '@pmacs/core';
import { requireAdminAuth, isAuthError, AuthenticatedUser } from '@/lib/admin-auth';
import { AdminChatMessageSchema, validateRequest } from '@/lib/validation/admin-schemas';
import { checkRateLimit, getRequestIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { logAccess } from '@/lib/access-logger';
import path from 'path';

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
  lastUser?: string; // Track last mentioned user (for admin operations)
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
// INTENT DETECTION (Admin-focused)
// ============================================================

function detectIntent(message: string): 'admin_query' | 'out_of_scope' | 'greeting' {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  const greetingPatterns = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
    /^(how are you|what's up|wassup)\b/i,
  ];
  if (greetingPatterns.some(pattern => pattern.test(lowerMessage))) {
    return 'greeting';
  }

  // Admin/pharmacy keywords (includes all pharmacist keywords + admin-specific)
  const adminKeywords = [
    'stock', 'inventory', 'drug', 'medication', 'forecast', 'report',
    'user', 'access', 'permission', 'role', 'blacklist', 'activate',
    'manage', 'admin', 'system', 'audit', 'log', 'activity',
    'analytics', 'trend', 'pattern', 'insight', 'overview',
    'where is', 'how much', 'show me', 'list', 'get', 'check',
  ];

  const hasAdminKeyword = adminKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  // Context-dependent queries (follow-ups)
  const contextPatterns = [
    /\b(it|that|this|those|these|them|him|her)\b/i,
    /\b(where|when|how much|how many)\b/i,
  ];
  const hasContextReference = contextPatterns.some(pattern => pattern.test(lowerMessage));

  if (hasAdminKeyword || hasContextReference) {
    return 'admin_query';
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
      response: "Please enter a message. I can help you:\n• Manage user access\n• Analyze system-wide trends\n• Generate comprehensive reports\n• Monitor system activity",
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
  const repeatingChars = /(.)\1{5,}/.test(trimmed);

  if ((!hasVowels && trimmed.length > 5) || repeatingChars) {
    return {
      shouldProceed: false,
      response: "I didn't understand that. Try asking:\n• 'Show all users'\n• 'System-wide analytics'\n• 'Check user activity'\n• 'Generate monthly report'",
    };
  }

  // 4. Intent-based routing
  const intent = detectIntent(message);

  if (intent === 'greeting') {
    return {
      shouldProceed: false,
      response: `Hello! I'm your system administration assistant. I can help you:\n• Manage user access and permissions\n• Analyze system-wide inventory trends\n• Generate comprehensive reports\n• Monitor user activity and audit logs\n• Perform all pharmacy operations\n\nWhat would you like to do?`,
    };
  }

  if (intent === 'out_of_scope') {
    return {
      shouldProceed: false,
      response: "I can only help with system administration questions. Try asking about user management, system analytics, or inventory operations.",
    };
  }

  // 5. Ambiguous queries without context
  const ambiguousPatterns = [
    /^(check|show|find|get|tell me|list)$/i,
    /^(users|report|data|analytics)$/i,
    /^(it|that|this)$/i,
  ];

  if (ambiguousPatterns.some(pattern => pattern.test(trimmed)) && context.messageCount === 0) {
    return {
      shouldProceed: false,
      response: "I need more information. For example:\n• 'Show all active users'\n• 'System-wide top movers'\n• 'Check user activity logs'\n• 'Monthly analytics report'",
    };
  }

  // All checks passed
  return { shouldProceed: true };
}

// ============================================================
// SUGGESTED FOLLOW-UP QUESTIONS (Admin-focused)
// ============================================================

function generateSuggestions(
  userQuery: string,
  botResponse: string,
  context: ConversationContext
): string[] {
  const suggestions: string[] = [];
  const lowerQuery = userQuery.toLowerCase();
  const lowerResponse = botResponse.toLowerCase();

  // Admin-specific context
  if (context.lastUser) {
    const userName = context.lastUser;

    if (!lowerQuery.includes('activity')) {
      suggestions.push(`Check ${userName}'s activity`);
    }

    if (!lowerQuery.includes('permission') && suggestions.length < 3) {
      suggestions.push(`Update ${userName}'s permissions`);
    }
  }

  // Drug/analytics context (same as pharmacist)
  if (context.lastDrug && suggestions.length < 2) {
    suggestions.push(`Forecast ${context.lastDrug} demand`);
    suggestions.push(`Analyze ${context.lastDrug} system-wide`);
  }

  // Query-type based suggestions
  if (suggestions.length < 2) {
    if (lowerQuery.includes('user') || lowerResponse.includes('user')) {
      suggestions.push('Show user activity logs');
      suggestions.push('List blacklisted users');
    } else if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
      suggestions.push('System-wide inventory summary');
      suggestions.push('Monthly performance metrics');
    } else {
      suggestions.push('Show all users');
      suggestions.push('System-wide top movers');
    }
  }

  // General admin suggestions
  if (suggestions.length < 2) {
    const generalSuggestions = [
      'Show system overview',
      'List active users',
      'Monthly analytics report',
      'Check critical alerts',
    ];

    for (const suggestion of generalSuggestions) {
      if (suggestions.length >= 3) break;
      if (!suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }
    }
  }

  return [...new Set(suggestions)].slice(0, 3);
}

// ============================================================
// EXTRACT ENTITIES FROM QUERY AND RESPONSE
// ============================================================

function extractEntities(query: string, response: string): {
  drug?: string;
  location?: string;
  user?: string;
  action?: string;
} {
  const result: { drug?: string; location?: string; user?: string; action?: string } = {};

  // Drug name extraction (same as pharmacist)
  const boldDrugPattern = /\*\*([A-Z][a-zA-Z\s]+(?:Sulfate|Hydrochloride|mg\/mL|mcg|mg)?)\*\*/g;
  const boldMatches = [...response.matchAll(boldDrugPattern)];

  if (boldMatches.length > 0) {
    let drugName = boldMatches[0][1].trim();
    const excludeWords = ['User', 'System', 'Report', 'Analytics', 'Management'];
    drugName = drugName.replace(/\s+(Management|Report)$/i, '');

    if (!excludeWords.some(word => drugName.includes(word))) {
      result.drug = drugName;
    }
  }

  // User extraction (admin-specific)
  const userPattern = /\b([A-Z]\d{3})\b/g; // Matches P001, N001, M001
  const userMatches = response.match(userPattern) || query.match(userPattern);
  if (userMatches && userMatches.length > 0) {
    result.user = userMatches[0];
  }

  // Location extraction
  const locationPattern = /\b(Ward[- ]?\d+|ICU|Emergency|Pharmacy|Vault)\b/gi;
  const locationMatches = response.match(locationPattern) || query.match(locationPattern);
  if (locationMatches && locationMatches.length > 0) {
    result.location = locationMatches[0];
  }

  // Action extraction
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('manage') || lowerQuery.includes('update user')) {
    result.action = 'user_management';
  } else if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
    result.action = 'forecast';
  } else if (lowerQuery.includes('report') || lowerQuery.includes('analytics')) {
    result.action = 'report';
  }

  return result;
}

// Cache agent executors per user
const agentExecutors = new Map<string, AgentExecutor>();

async function getAgentExecutor(currentUser: AuthenticatedUser) {
  // Check cache for this specific user
  const cacheKey = currentUser.empId;
  if (agentExecutors.has(cacheKey)) {
    return agentExecutors.get(cacheKey)!;
  }

  // Create tools - using getToolsByPermission for master-level access
  const allTools = createAllTools({
    db,
    userRole: currentUser.role as UserRole,
    userId: currentUser.empId,
  });

  const tools = getToolsByPermission(allTools, 'Master');

  // Initialize LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Create agent prompt
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are P-MACS System Administrator, providing comprehensive system management capabilities.

CRITICAL: CONVERSATION MEMORY
- You can remember previous messages in this conversation
- When users say "it", "that", "this user", "the one I mentioned", refer to the conversation history
- If a user asks a follow-up question, use context from previous messages
- If you need clarification, ask specific questions

Current User: ${currentUser.name} (${currentUser.role})

CONTEXT RESOLUTION:
- If user says "it", "that", "this" - check conversation history for last mentioned drug/user/location
- If ambiguous, ask: "Which user/drug do you mean - X or Y?"
- If completely unclear, ask specific question: "Which user/report are you asking about?"

You have access to ALL ${tools.length} system tools including:
- Complete inventory management
- Advanced forecasting and analytics
- User access management
- System-wide reports and insights
- Procurement and financial analysis

CRITICAL RESPONSE RULES:
1. Call the appropriate tool immediately and extract ALL data
2. Present information in SCANNABLE tables
3. Use **bold** for important values
4. Include system-level insights when relevant

FORMATTING GUIDELINES:
- For user management: Show user list with roles and permissions
  | User | Role | Status | Last Active |

- For system reports: Show comprehensive data with key metrics
  | Metric | Value | Status | Trend |

- For analytics: Include tables with actionable insights
  | Drug Name | Usage | Stock | Forecast | Recommendation |

HEADER FORMAT:
- "**User Management - [Action]**" for user operations
- "**System-wide [Report Type]**" for system reports
- "**Analytics - [Metric]**" for analytics

Provide comprehensive, actionable insights for system administration. Focus on data integrity, user activity, and system optimization.`,
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

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: false,
    maxIterations: 5,
  });

  // Cache this executor for this user
  agentExecutors.set(cacheKey, executor);

  return executor;
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdminAuth(request);
  if (isAuthError(authResult)) {
    return authResult; // Return 401/403 error
  }
  const { user: currentUser } = authResult;

  // Rate limiting - prevent abuse
  const identifier = getRequestIdentifier(request, currentUser.empId);
  const { limited, remaining } = checkRateLimit(identifier, RATE_LIMITS.ADMIN_CHAT);
  if (limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.', remaining: 0 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = validateRequest(AdminChatMessageSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.details.errors },
        { status: 400 }
      );
    }

    const { message } = validation.data as { message: string };

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Log the query to access logs
    logAccess(currentUser.empId, 'QUERY', 'Master', `Query: ${message}`);

    // Get or create conversation context
    const context = getOrCreateConversationContext(currentUser.empId);
    context.messageCount++;

    // EDGE CASE HANDLING
    const edgeCheck = handleEdgeCases(message, context);
    if (!edgeCheck.shouldProceed) {
      return NextResponse.json({
        response: edgeCheck.response!,
        success: true,
        suggestions: context.messageCount === 1 ? [
          'Show all users',
          'System-wide analytics',
          'Monthly performance report',
        ] : [],
      });
    }

    // Get or create agent executor for this authenticated user
    const executor = await getAgentExecutor(currentUser);

    // Build smart context hints for follow-up questions
    let enhancedMessage = message;
    const contextHints: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Check for pronoun references that need context
    if (lowerMessage.match(/\b(it|that|this|the drug|the user|them|him|her)\b/)) {
      if (context.lastUser) {
        contextHints.push(`referring to user ${context.lastUser}`);
      } else if (context.lastDrug) {
        contextHints.push(`referring to ${context.lastDrug}`);
      }
    }

    if (lowerMessage.match(/\b(there|that location)\b/)) {
      if (context.lastLocation) {
        contextHints.push(`referring to ${context.lastLocation}`);
      }
    }

    // Add context for follow-up user management questions
    if (lowerMessage.match(/\b(activity|permissions|access|blacklist|activate)\b/)) {
      if (context.lastUser && !lowerMessage.includes(context.lastUser.toLowerCase())) {
        contextHints.push(`asking about user ${context.lastUser}`);
      }
    }

    // Add context for analytics/forecasting questions
    if (lowerMessage.match(/\b(forecast|predict|analyze|trend|pattern)\b/)) {
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

    // Clean up extracted entities
    if (entities.drug) {
      let cleanDrug = entities.drug;
      cleanDrug = cleanDrug.replace(/\s+(stock|inventory|report)$/i, '');
      context.lastDrug = cleanDrug.trim();
    }

    if (entities.location) {
      context.lastLocation = entities.location;
    }

    if (entities.user) {
      context.lastUser = entities.user;
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
        lastUser: context.lastUser,
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
