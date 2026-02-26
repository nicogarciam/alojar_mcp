// src/agents/availability.agent.ts
import { MCPClient } from '../clients/mcpClient.js';
import { LLMService } from '../services/llm.service.js';
import { MyMCPClient } from '../services/my-mcp.client.js';
import { LLMMessage, ToolCall, MessageRole } from '../types/chat.types.js';
import { systemPromptReserva } from './system_prompts.js';
import { getSessionLogger } from '../services/session-logger.js';

/**
 * Agente especializado en consultas de disponibilidad de alojamientos
 * Compatible con múltiples proveedores LLM (OpenAI, DeepSeek, etc.)
 */
export class AvailabilityAgent {
    private conversationHistory: Map<string, LLMMessage[]> = new Map();

    constructor(
        private llmService: LLMService,
        private mcpClient: MCPClient
    ) { }

    /**
     * Procesa un mensaje del usuario y genera una respuesta
     */
    async processMessage(
        userMessage: string,
        sessionId: string = 'default'
    ): Promise<{ response: string; toolsUsed: string[]; error?: string }> {
        try {
            const logger = getSessionLogger();
            const startTime = Date.now();

            // Log entrada del usuario
            logger.log({
                type: 'USER_MESSAGE',
                sessionId,
                data: {
                    message: userMessage,
                    timestamp: new Date().toISOString()
                }
            });

            // Verificar que el cliente MCP esté conectado
            if (!this.mcpClient.isClientConnected()) {
                throw new Error('Servicio de disponibilidad no disponible. Por favor, intente más tarde.');
            }

            // Obtener o inicializar el historial de conversación
            const history = this.getConversationHistory(sessionId);

            // Agregar mensaje del usuario al historial
            const userMessageObj: LLMMessage = {
                role: 'user',
                content: userMessage
            };
            history.push(userMessageObj);

            // Mensaje del sistema que define el comportamiento del agente
            const systemPrompt = this.getSystemPrompt();
            const messages = history;


            // Obtener herramientas dinámicamente del MCP
            const tools = await this.llmService.getToolsAvailables();
            // Generar respuesta del LLM
            const llmResponse = await this.llmService.generateResponse(messages, tools, 'auto', systemPrompt);
            console.error('LLM Response:', JSON.stringify(llmResponse, null, 2));

            // Log respuesta del LLM
            logger.log({
                type: 'LLM_RESPONSE',
                sessionId,
                data: {
                    response: llmResponse.response,
                    toolCalls: llmResponse.toolCalls?.map(tc => ({
                        name: tc.function.name,
                        args: tc.function.arguments
                    })) || [],
                    model: this.llmService.getProviderInfo().model
                }
            });

            const toolsUsed: string[] = [];

            // Procesar tool calls si existen y el proveedor las soporta
            if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
                console.error('LLM hizo tool calls:', llmResponse.toolCalls.map(tc => tc.function.name));
                const result = await this.processToolCalls(llmResponse, history, systemPrompt, sessionId);
                this.conversationHistory.set(sessionId, result.history);
                return result.response;
            }

            // Si no hay tool calls, usar respuesta directa
            const assistantMessage: LLMMessage = {
                role: 'assistant',
                content: llmResponse.response
            };
            history.push(assistantMessage);

            this.conversationHistory.set(sessionId, history);

            logger.log({
                type: 'SESSION_END',
                sessionId,
                data: { success: true },
                duration: Date.now() - startTime
            });

            return {
                response: llmResponse.response,
                toolsUsed
            };

        } catch (error) {
            console.error('Error en AvailabilityAgent:', error);

            const logger = getSessionLogger();
            logger.log({
                type: 'ERROR',
                sessionId,
                data: {
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    stack: error instanceof Error ? error.stack : undefined
                }
            });

            // Respuesta de error genérica
            const errorResponse = `Lo siento, hubo un error procesando tu solicitud. Por favor, intenta nuevamente. Error: ${error instanceof Error ? error.message : 'Error desconocido'}`;

            return {
                response: errorResponse,
                toolsUsed: [],
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }

    private async processToolCalls(
        llmResponse: { response: string; toolCalls?: ToolCall[] },
        history: LLMMessage[],
        systemMessage: LLMMessage,
        sessionId: string = 'default'
    ): Promise<{ response: { response: string; toolsUsed: string[]; error?: string }; history: LLMMessage[] }> {
        const logger = getSessionLogger();
        const toolsUsed: string[] = [];

        for (const toolCall of llmResponse.toolCalls!) {
            const toolStartTime = Date.now();

            try {
                // Log llamada a tool
                logger.log({
                    type: 'TOOL_CALL',
                    sessionId,
                    data: {
                        toolName: toolCall.function.name,
                        arguments: JSON.parse(toolCall.function.arguments)
                    }
                });

                const args = JSON.parse(toolCall.function.arguments);
                // Validar parámetros antes de llamar al MCP
                this.validateToolCall(toolCall.function.name, args);

                // Normalizar campos numéricos antes de llamar al MCP (ej: hotel_id, pax)
                const normalizedArgs = ensureNumericFields(args);

                // Ejecutar la tool usando el MCP client (SDK espera un objeto { name, arguments })
                const toolResult = await this.mcpClient.callTool(
                    toolCall.function.name,
                    normalizedArgs,
                    sessionId
                );

                // Log resultado de tool
                logger.log({
                    type: 'TOOL_RESULT',
                    sessionId,
                    data: {
                        toolName: toolCall.function.name,
                        result: toolResult.substring(0, 500) // Limitar a 500 chars para no saturar logs
                    },
                    duration: Date.now() - toolStartTime
                });

                toolsUsed.push(toolCall.function.name);

                // Agregar respuesta del assistant al historial
                if (llmResponse.response) {
                    const assistantMessage: LLMMessage = {
                        role: 'assistant',
                        content: llmResponse.response
                    };
                    history.push(assistantMessage);
                }

                // Agregar resultado de la tool al historial con rol 'tool'
                const toolMessage: LLMMessage = {
                    role: 'tool',
                    content: toolResult,
                    tool_call_id: toolCall.id
                };
                history.push(toolMessage);

                // Generar respuesta final con los resultados
                const finalMessages = [systemMessage, ...history];
                const tools = await this.llmService.getToolsAvailables();
                const finalResponse = await this.llmService.generateResponse(finalMessages, tools, 'none', systemMessage);
                //console.error('Respuesta final del LLM después de tool call:', finalResponse.response);

                // Agregar respuesta final al historial
                const finalAssistantMessage: LLMMessage = {
                    role: 'assistant',
                    content: finalResponse.response
                };
                history.push(finalAssistantMessage);

                return {
                    response: {
                        response: finalResponse.response,
                        toolsUsed
                    },
                    history
                };

            } catch (error) {
                console.error(`Error ejecutando tool ${toolCall.function.name}:`, error);

                // Manejar error de tool call
                return await this.handleToolCallError(error, toolCall, llmResponse, history, systemMessage);
            }
        }

        // Si no se procesó ninguna tool, retornar respuesta original
        const assistantMessage: LLMMessage = {
            role: 'assistant',
            content: llmResponse.response
        };
        history.push(assistantMessage);

        return {
            response: {
                response: llmResponse.response,
                toolsUsed
            },
            history
        };
    }


    private validateToolCall(toolName: string, params: any): void {
        // Validación específica para check_availability
        if (toolName === 'check_availability') {
            this.validateAvailabilityParams(params);
        }

        // Podemos agregar validaciones para otras tools aquí
    }

    public async getAvailableTools(sessionId: string): Promise<string[]> {
        const tools = await this.mcpClient.getToolsForLLM();
        return tools;
    }


    /**
   * Valida los parámetros de disponibilidad
   */
    private validateAvailabilityParams(params: any): void {
        const { hotel_id, date_from, date_to, pax } = params;

        if (!date_from || !this.isValidDate(date_from)) {
            throw new Error('Fecha de check-in inválida. Formato esperado: YYYY-MM-DD');
        }

        if (!date_to || !this.isValidDate(date_to)) {
            throw new Error('Fecha de check-out inválida. Formato esperado: YYYY-MM-DD');
        }

        if (!pax || isNaN(Number(pax)) || Number(pax) <= 0) {
            throw new Error('Número de personas inválido');
        }

        const checkIn = new Date(date_from);
        const checkOut = new Date(date_to);

        if (checkOut <= checkIn) {
            throw new Error('La fecha de check-out debe ser posterior a la fecha de check-in');
        }
    }

    /**
     * Maneja errores en tool calls
     */
    private async handleToolCallError(
        error: any,
        toolCall: ToolCall,
        llmResponse: { response: string; toolCalls?: ToolCall[] },
        history: LLMMessage[],
        systemMessage: LLMMessage
    ): Promise<{ response: { response: string; toolsUsed: string[]; error?: string }; history: LLMMessage[] }> {

        // Agregar mensaje de error como tool response
        const errorToolMessage: LLMMessage = {
            role: 'tool',
            content: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`,
            tool_call_id: toolCall.id
        };
        history.push(errorToolMessage);

        // Generar respuesta de error
        const errorMessages = [systemMessage, ...history];
        const errorResponse = await this.llmService.generateResponse(errorMessages);

        const errorAssistantMessage: LLMMessage = {
            role: 'assistant',
            content: errorResponse.response
        };
        history.push(errorAssistantMessage);

        return {
            response: {
                response: errorResponse.response,
                toolsUsed: ['check_availability_error'],
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            history
        };
    }

    /**
     * Obtiene el prompt del sistema según el proveedor
     */
    private getSystemPrompt(): LLMMessage {
        const providerInfo = this.llmService.getProviderInfo();

        let systemPrompt = 'La fecha de hoy es: ' + new Date().toISOString().split('T')[0] + ' y son las ' + new Date().toISOString().split('T')[1].split('.')[0] + '\n. ';
        console.error('systemPrompt Info:', systemPrompt);
        systemPrompt += systemPromptReserva;
        systemPrompt += `
    
    Si hay algún error técnico, informa al usuario de manera clara y sugiere que intente más tarde.\n
    Sé amable, profesional y proporciona información precisa.`;

        return {
            role: 'system',
            content: systemPrompt
        };
    }

    /**
     * Valida el formato de fecha YYYY-MM-DD
     */
    private isValidDate(dateString: string): boolean {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;

        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    /**
     * Obtiene el historial de conversación para una sesión
     */
    private getConversationHistory(sessionId: string): LLMMessage[] {
        return this.conversationHistory.get(sessionId) || [];
    }

    /**
     * Limpia el historial de una sesión
     */
    clearHistory(sessionId: string = 'default'): void {
        this.conversationHistory.delete(sessionId);
    }

    /**
     * Obtiene el historial completo
     */
    getFullHistory(sessionId: string): LLMMessage[] {
        return this.getConversationHistory(sessionId);
    }

    /**
     * Obtiene estadísticas de la sesión
     */
    getSessionStats(sessionId: string): { messageCount: number; toolUsage: number } {
        const history = this.getConversationHistory(sessionId);
        const toolUsage = history.filter(msg => msg.role === 'tool').length;

        return {
            messageCount: history.length,
            toolUsage
        };
    }

    /**
     * Verifica la salud del servicio MCP
     */
    async healthCheck(): Promise<boolean> {
        return this.mcpClient.healthCheck();
    }

    /**
     * Obtiene información del proveedor LLM
     */
    getLLMProviderInfo() {
        return this.llmService.getProviderInfo();
    }
}

// Pequeña función utilitaria para asegurar campos numéricos
function ensureNumericFields(obj: Record<string, any>, keys: string[] = ['hotel_id', 'pax']) {
    if (!obj || typeof obj !== 'object') return obj;
    const out = { ...obj };
    for (const k of keys) {
        if (k in out) {
            const v = out[k];
            if (typeof v === 'string') {
                const n = Number(v);
                if (!Number.isNaN(n)) out[k] = n;
            }
        }
    }
    return out;
}