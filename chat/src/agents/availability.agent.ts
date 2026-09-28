// src/agents/availability.agent.ts
import { MCPClient } from '../clients/mcpClient.js';
import { LLMService } from '../services/llm.service.js';
import { LLMMessage, ToolCall, MessageRole, AgentEvent } from '../types/chat.types.js';
import { systemPromptReserva } from './system_prompts.js';
import { getSessionLogger } from '../services/session-logger.js';

/** Maximum agentic loop iterations to prevent infinite loops */
const MAX_AGENTIC_ITERATIONS = 8;

/**
 * Strips <think>...</think> reasoning tags and trims response text.
 */
function cleanResponseText(text: string | null | undefined): string {
    if (!text) return '';
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * General-purpose hotel assistant agent.
 * Handles: availability queries, booking management, and price management.
 * Uses a real agentic loop: keeps processing tool calls until the LLM
 * produces a final text response or the iteration limit is reached.
 */
export class AvailabilityAgent {
    private conversationHistory: Map<string, LLMMessage[]> = new Map();

    constructor(
        private llmService: LLMService,
        private mcpClient: MCPClient
    ) { }

    /**
     * Processes a user message through the agentic loop and returns the final response.
     */
    async processMessage(
        userMessage: string,
        sessionId: string = 'default',
        onEvent?: (event: AgentEvent) => void
    ): Promise<{ response: string; toolsUsed: string[]; intermediateMessages?: string[]; error?: string }> {
        const logger = getSessionLogger();
        const startTime = Date.now();

        logger.log({
            type: 'USER_MESSAGE',
            sessionId,
            data: { message: userMessage, timestamp: new Date().toISOString() }
        });

        try {
            if (!this.mcpClient.isClientConnected()) {
                throw new Error('Servicio no disponible. Por favor, intentá más tarde.');
            }

            const history = this.getConversationHistory(sessionId);
            history.push({ role: 'user', content: userMessage });

            const systemMessage = this.buildSystemMessage();
            const toolsUsed: string[] = [];
            const intermediateMessages: string[] = [];

            // Lista de herramientas administrativas que el chatbot no necesita
            const ADMIN_TOOLS = [
                'create_accommodation_price', 
                'update_accommodation_price', 
                'delete_accommodation_price',
                'create_user',
                'list_users'
            ];

            // ─── Agentic loop ────────────────────────────────────────────────
            for (let iteration = 0; iteration < MAX_AGENTIC_ITERATIONS; iteration++) {
                const tools = await this.llmService.getToolsAvailables(ADMIN_TOOLS);
                // On iterations after the first we allow tool calls freely;
                // on the last iteration we force a text-only response.
                const toolChoice = iteration === MAX_AGENTIC_ITERATIONS - 1 ? 'none' : 'auto';

                const llmStartTime = Date.now();
                const llmResponse = await this.llmService.generateResponse(
                    history,
                    tools,
                    toolChoice,
                    systemMessage
                );
                const llmDuration = Date.now() - llmStartTime;

                logger.log({
                    type: 'LLM_RESPONSE',
                    sessionId,
                    data: {
                        iteration,
                        model: this.llmService.getProviderInfo().model,
                        provider: this.llmService.getProviderInfo().provider,
                        duration_ms: llmDuration,
                        tokens: llmResponse.usage ? {
                            prompt_tokens: llmResponse.usage.promptTokens,
                            completion_tokens: llmResponse.usage.completionTokens,
                            total_tokens: llmResponse.usage.totalTokens
                        } : undefined,
                        response: llmResponse.response,
                        toolCallCount: llmResponse.toolCalls?.length ?? 0
                    },
                    duration: llmDuration
                });

                // No tool calls → final text response
                if (!llmResponse.toolCalls || llmResponse.toolCalls.length === 0) {
                    const cleanedFinal = cleanResponseText(llmResponse.response) || llmResponse.response;
                    const finalText = cleanedFinal;
                    history.push({ role: 'assistant', content: finalText });
                    this.conversationHistory.set(sessionId, history);

                    logger.log({
                        type: 'SESSION_END',
                        sessionId,
                        data: { success: true, iterations: iteration + 1 },
                        duration: Date.now() - startTime
                    });

                    return { response: finalText, toolsUsed, intermediateMessages };
                }

                // If the LLM returned intermediate text before invoking tool(s), notify client
                const intermediateText = cleanResponseText(llmResponse.response);
                if (intermediateText) {
                    intermediateMessages.push(intermediateText);
                    onEvent?.({
                        type: 'intermediate_message',
                        content: intermediateText
                    });
                }

                // Add the assistant turn with tool calls to history
                history.push({
                    role: 'assistant',
                    content: llmResponse.response || null,
                    tool_calls: llmResponse.toolCalls
                });

                // Execute every tool call in this turn
                for (const toolCall of llmResponse.toolCalls) {
                    onEvent?.({
                        type: 'tool_start',
                        toolName: toolCall.function.name
                    });

                    const toolResult = await this.executeToolCall(toolCall, sessionId, toolsUsed);

                    history.push({
                        role: 'tool',
                        content: toolResult,
                        tool_call_id: toolCall.id
                    });
                }
                // Loop again with updated history ─────────────────────────────
            }

            // Fallback: force a final response if the loop limit was reached
            const fallbackStartTime = Date.now();
            const fallbackResponse = await this.llmService.generateResponse(history, [], 'none', systemMessage);
            const fallbackDuration = Date.now() - fallbackStartTime;

            logger.log({
                type: 'LLM_RESPONSE',
                sessionId,
                data: {
                    iteration: MAX_AGENTIC_ITERATIONS,
                    model: this.llmService.getProviderInfo().model,
                    provider: this.llmService.getProviderInfo().provider,
                    duration_ms: fallbackDuration,
                    tokens: fallbackResponse.usage ? {
                        prompt_tokens: fallbackResponse.usage.promptTokens,
                        completion_tokens: fallbackResponse.usage.completionTokens,
                        total_tokens: fallbackResponse.usage.totalTokens
                    } : undefined,
                    response: fallbackResponse.response,
                    toolCallCount: 0,
                    isFallback: true
                },
                duration: fallbackDuration
            });

            const cleanedFallback = cleanResponseText(fallbackResponse.response) || fallbackResponse.response;
            const finalText = cleanedFallback;
            history.push({ role: 'assistant', content: finalText });
            this.conversationHistory.set(sessionId, history);

            return { response: finalText, toolsUsed, intermediateMessages };

        } catch (error) {
            console.error('Error en AvailabilityAgent:', error);

            logger.log({
                type: 'ERROR',
                sessionId,
                data: {
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });

            return {
                response: `Lo siento, hubo un error procesando tu solicitud. Por favor, intentá nuevamente. (${error instanceof Error ? error.message : 'Error desconocido'})`,
                toolsUsed: [],
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    private getApiEndpointForTool(toolName: string, args: any): { endpoint: string, method: string } {
        switch (toolName) {
            case 'check_availability':
                return { endpoint: `/api/accommodations/availability?hotel_id=${args.hotel_id}&date_from=${args.date_from}&date_to=${args.date_to}&pax=${args.pax}`, method: 'GET' };
            case 'manage_booking':
                if (args.action === 'create') return { endpoint: `/api/bookings`, method: 'POST' };
                if (args.action === 'update') return { endpoint: `/api/bookings/${args.booking_id}`, method: 'PUT' };
                if (args.action === 'cancel') return { endpoint: `/api/bookings/${args.booking_id}/cancel`, method: 'POST' };
                if (args.action === 'get') return { endpoint: `/api/bookings/${args.booking_id}`, method: 'GET' };
                if (args.action === 'list') return { endpoint: `/api/bookings`, method: 'GET' };
                return { endpoint: `/api/bookings (action: ${args.action})`, method: 'UNKNOWN' };
            case 'show_accommodation_detail':
                return { endpoint: `/api/accommodations/${args.accommodation_id}`, method: 'GET' };
            case 'create_customer':
                return { endpoint: `/api/guests`, method: 'POST' };
            case 'search_customers':
                return { endpoint: `/api/guests/search?query=${args.query}`, method: 'GET' };
            case 'list_accommodation_prices':
                return { endpoint: `/api/prices/accommodations`, method: 'GET' };
            default:
                return { endpoint: `API Interna / Función pura`, method: 'SYSTEM' };
        }
    }

    /**
     * Executes a single tool call, handles errors, and returns the result string.
     */
    private async executeToolCall(
        toolCall: ToolCall,
        sessionId: string,
        toolsUsed: string[]
    ): Promise<string> {
        const logger = getSessionLogger();
        const toolName = toolCall.function.name;
        const toolStartTime = Date.now();

        let args: Record<string, any>;
        try {
            args = JSON.parse(toolCall.function.arguments);
        } catch {
            const errMsg = `Error: argumentos JSON inválidos para la herramienta ${toolName}`;
            logger.log({ type: 'TOOL_CALL', sessionId, data: { toolName, error: errMsg } });
            return errMsg;
        }

        const apiInfo = this.getApiEndpointForTool(toolName, args);

        logger.log({
            type: 'TOOL_CALL',
            sessionId,
            data: { 
                toolName, 
                api_endpoint: apiInfo.endpoint,
                api_method: apiInfo.method,
                arguments: args 
            }
        });

        // Normalize numeric fields that might arrive as strings
        const normalizedArgs = ensureNumericFields(args);

        try {
            const result = await this.mcpClient.callTool(toolName, normalizedArgs, sessionId);
            toolsUsed.push(toolName);

            let parsedResult = result;
            try {
                parsedResult = JSON.parse(result);
            } catch (e) {
                // If not JSON, leave as string
            }

            logger.log({
                type: 'TOOL_RESULT',
                sessionId,
                data: { toolName, status: 'success', result: parsedResult },
                duration: Date.now() - toolStartTime
            });

            return result;

        } catch (error) {
            const errMsg = `Error ejecutando ${toolName}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
            console.error(errMsg);

            logger.log({
                type: 'TOOL_RESULT',
                sessionId,
                data: { toolName, status: 'error', error: errMsg },
                duration: Date.now() - toolStartTime
            });

            // Return the error as content so the LLM can react accordingly
            return errMsg;
        }
    }

    /**
     * Builds the system message with the current date and the main prompt.
     */
    private buildSystemMessage(): LLMMessage {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        const content = `La fecha de hoy es: ${dateStr} y son las ${timeStr} (hora de Argentina).\n\n${systemPromptReserva}`;

        return { role: 'system', content };
    }

    // ─── History management ───────────────────────────────────────────────────

    private getConversationHistory(sessionId: string): LLMMessage[] {
        return this.conversationHistory.get(sessionId) ?? [];
    }

    clearHistory(sessionId: string = 'default'): void {
        this.conversationHistory.delete(sessionId);
    }

    getFullHistory(sessionId: string): LLMMessage[] {
        return this.getConversationHistory(sessionId);
    }

    getSessionStats(sessionId: string): { messageCount: number; toolUsage: number } {
        const history = this.getConversationHistory(sessionId);
        return {
            messageCount: history.length,
            toolUsage: history.filter(msg => msg.role === 'tool').length
        };
    }

    // ─── Public helpers ───────────────────────────────────────────────────────

    async getAvailableTools(_sessionId: string): Promise<string[]> {
        return this.mcpClient.getToolsForLLM();
    }

    async healthCheck(): Promise<boolean> {
        return this.mcpClient.healthCheck();
    }

    getLLMProviderInfo() {
        return this.llmService.getProviderInfo();
    }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Coerces common numeric fields that may arrive as strings from the LLM.
 */
function ensureNumericFields(
    obj: Record<string, any>,
    keys: string[] = [
        'hotel_id', 'pax', 'pax_adult', 'pax_minor',
        'booking_id', 'id', 'guest_id', 'customer_id',
        'price', 'total_price', 'booking_price', 'list_price',
        'garage_price', 'garage_nro', 'booking_state_id',
        'numberOfNights', 'page', 'limit'
    ]
): Record<string, any> {
    if (!obj || typeof obj !== 'object') return obj;
    const out = { ...obj };
    for (const k of keys) {
        if (k in out && typeof out[k] === 'string') {
            const n = Number(out[k]);
            if (!Number.isNaN(n)) out[k] = n;
        }
    }
    return out;
}