// src/services/mcp.client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { MCPServerConfig, MCPToolResult, MCPError, ListToolsResult } from '../types/mcp.types.js';
import { ToolSchema } from '../types/chat.types.js';
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCPClient } from './mcpClient.js';
import { ExternalApi } from '@google/genai';
import { getSessionLogger } from '../services/session-logger.js';

/**
 * Cliente MCP para comunicarse con el servidor de disponibilidad
 */
export class AlojarMCPClient implements MCPClient {
    public client: Client;
    private transport: StreamableHTTPClientTransport | undefined = undefined;
    private isConnected: boolean = false;
    private availableTools: ToolSchema[] = [];
    private sessionId: string | undefined = undefined;
    private serverUrl = 'http://localhost:3001/mcp';

    constructor() {
        this.client = new Client(
            {
                name: 'chatbot-mcp-client',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );
    }
    getSessionId(): string | undefined {
        return this.sessionId;
    }

    /**
     * Fuerza la limpieza del sessionId local (por ejemplo cuando el servidor rechaza el sessionId)
     */
    clearSession(): void {
        console.warn('Limpiando sessionId local');
        this.sessionId = undefined;
    }

    /**
     * Intenta reconectar al MCP. Si hay una sesión previa, la cierra y crea una nueva.
     */
    async reconnect(): Promise<void> {
        console.error('Intentando reconectar al MCP...');
        try {
            if (this.isConnected) {
                await this.disconnect();
            }

            // Forzar nueva sesión si la actual está marcada como inválida
            await this.connect();
        } catch (err) {
            console.error('Reconexión fallida:', err);
            throw err;
        }
    }

    /**
     * Conecta al servidor MCP
     */
    async connect(): Promise<void> {

        console.error(`Connecting to ${this.serverUrl}...`);
        try {

            this.transport = new StreamableHTTPClientTransport(new URL(this.serverUrl!), {
                sessionId: this.sessionId
            });

            await this.client.connect(this.transport);
            this.sessionId = this.transport.sessionId;
            console.log('Transport created with session ID:', this.sessionId);
            console.log('Connected to MCP server');
            this.isConnected = true;
            await this.refreshTools();

        } catch (error) {
            console.error('❌ Error conectando al servidor MCP:', error);
            throw error;
        }
    }

    async refreshTools(): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Cliente MCP no conectado');
        }

        try {
            const result = await this.client.listTools();
            // Usar type assertion para el resultado
            const toolsResult = result as unknown as ListToolsResult;
            // Asegurarnos de que tools existe y es un array
            this.availableTools = (toolsResult.tools || []).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));

            console.error(`🔄 Actualizadas ${this.availableTools.length} herramientas del MCP`);
            this.availableTools.forEach(tool => {
                console.error(` - ${tool.name}: ${tool.description}`);
            });
        } catch (error) {
            console.error('Error actualizando herramientas MCP:', error);
            this.availableTools = [];
        }
    }

    /**
     * Obtiene las herramientas disponibles en formato para LLM
     */
    async getToolsForLLM(): Promise<any[]> {
        if (this.isConnected && this.availableTools.length === 0) {
            await this.refreshTools();
        }
        console.error(`🔄 Retornando ${this.availableTools.length} herramientas del MCP`);
        return this.availableTools.map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.inputSchema
            }
        }));
    }

    /**
     * Obtiene la lista de nombres de herramientas disponibles
     */
    getAvailableToolNames(): string[] {
        return this.availableTools.map(tool => tool.name);
    }

    getAvailableTools(): ToolSchema[] {
        return this.availableTools;
    }

    /**
     * Verifica si una herramienta específica está disponible
     */
    hasTool(toolName: string): boolean {
        return this.availableTools.some(tool => tool.name === toolName);
    }

    async callTool(toolName: string, params: any, sessionId: string = 'default'): Promise<string> {
        // Asegurar conexión antes de llamar
        const startTime = Date.now();
        await this.ensureConnected();

        if (!this.hasTool(toolName)) {
            throw new Error(`Herramienta no disponible: ${toolName}`);
        }

        const logger = getSessionLogger();

        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: params
            });

            // Usar type assertion para decirle a TypeScript la estructura esperada
            const toolResult = result as unknown as MCPToolResult;

            // Verificar que content existe y es un array
            if (toolResult.content && Array.isArray(toolResult.content) && toolResult.content.length > 0) {
                const firstContent = toolResult.content[0];

                // Verificar que el primer elemento es de tipo 'text' y tiene texto
                if (firstContent.type === 'text' && firstContent.text) {
                    // Log API response (desde la perspectiva del cliente MCP)
                    logger.log({
                        type: 'API_RESPONSE',
                        sessionId,
                        data: {
                            toolName,
                            status: 'success',
                            responseLength: firstContent.text.length
                        },
                        duration: Date.now() - startTime
                    });

                    return firstContent.text;
                }

                throw new Error(`Tipo de contenido MCP no soportado: ${firstContent.type}`);
            }

            throw new Error('Respuesta MCP inválida: content vacío o no definido');

        } catch (error) {
            console.error(`Error ejecutando tool MCP (${toolName}):`, error);

            // Log error en API call
            logger.log({
                type: 'API_CALL',
                sessionId,
                data: {
                    toolName,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Error desconocido'
                },
                duration: Date.now() - startTime
            });

            // Manejar errores específicos del MCP
            // Si el servidor responde que el session id es inválido, intentar reconectar una vez
            const msg = (error instanceof Error ? error.message : (error as any)?.error || String(error)) as string;
            if (msg && /invalid session id|bad request: invalid session id/i.test(msg)) {
                console.warn('Session ID inválido detectado. Limpiando session y reintentando once...');
                try {
                    this.clearSession();
                    await this.reconnect();

                    // Reintentar la llamada una vez
                    const retryResult = await this.client.callTool({
                        name: toolName,
                        arguments: params
                    });
                    const retryToolResult = retryResult as unknown as MCPToolResult;
                    if (retryToolResult.content && Array.isArray(retryToolResult.content) && retryToolResult.content.length > 0) {
                        const firstContent = retryToolResult.content[0];
                        if (firstContent.type === 'text' && firstContent.text) {
                            logger.log({
                                type: 'API_RESPONSE',
                                sessionId,
                                data: {
                                    toolName,
                                    status: 'success_after_reconnect',
                                    responseLength: firstContent.text.length
                                },
                                duration: Date.now() - startTime
                            });
                            return firstContent.text;
                        }
                        throw new Error(`Tipo de contenido MCP no soportado: ${firstContent.type}`);
                    }
                    throw new Error('Respuesta MCP inválida: content vacío o no definido (reintento)');
                } catch (reErr) {
                    console.error('Reintento tras invalid session id falló:', reErr);
                    throw reErr;
                }
            }

            if (this.isMCPError(error)) {
                throw new Error(`Error del servidor MCP: ${error.error} - ${error.message}`);
            }

            throw new Error(`Error ejecutando ${toolName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Intenta garantizar que el cliente esté conectado; reconecta si es necesario.
     */
    private async ensureConnected(): Promise<void> {
        if (this.isConnected) return;
        try {
            await this.connect();
        } catch (err) {
            console.error('ensureConnected: no se pudo conectar al MCP:', err);
            throw err;
        }
    }

    /**
     * Ejecuta la tool de consulta de disponibilidad
     */
    async checkAvailability(params: {
        hotel_id: number;
        date_from: string;
        date_to: string;
        pax: number;
    }, sessionId: string = 'default'): Promise<string> {
        return this.callTool('check_availability', params, sessionId);
    }

    /**
     * Type guard para verificar si es un error MCP
     */
    private isMCPError(error: any): error is MCPError {
        return error && typeof error.error === 'string';
    }

    /**
     * Desconecta del servidor MCP
     */
    async disconnect(): Promise<void> {
        if (this.transport) {
            await this.transport.close();
            this.isConnected = false;
            this.availableTools = [];
            console.error('🔌 Desconectado del servidor MCP');
        }
    }

    /**
     * Intenta terminar la sesión en el servidor y limpiar la sessionId local.
     */
    async terminateSession(): Promise<void> {
        if (!this.transport) return;
        try {
            // Algunos transports exponen terminateSession
            const anyTransport: any = this.transport as any;
            if (typeof anyTransport.terminateSession === 'function') {
                await anyTransport.terminateSession();
            }
        } catch (err) {
            console.error('Error al terminar la sesión en el servidor:', err);
        } finally {
            // Cerrar transport y limpiar estado local
            try {
                await this.transport.close();
            } catch (_) { }
            this.transport = undefined;
            this.clearSession();
            this.isConnected = false;
            this.availableTools = [];
            console.error('🔌 Sesión terminada y estado local limpiado');
        }
    }

    /**
     * Verifica si está conectado
     */
    isClientConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Health check del servidor MCP
     */
    async healthCheck(): Promise<boolean> {
        if (!this.isConnected) {
            return false;
        }

        try {
            await this.refreshTools();
            return this.availableTools.length > 0;
        } catch (error) {
            console.error('Health check MCP falló:', error);
            return false;
        }
    }

    getToolsInfo(): { count: number; tools: string[] } {
        return {
            count: this.availableTools.length,
            tools: this.availableTools.map(tool => tool.name)
        };
    }
}
