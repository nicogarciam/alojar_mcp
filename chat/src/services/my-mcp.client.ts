// src/services/mcp.client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPServerConfig, MCPToolResult, MCPError, ListToolsResult } from '../types/mcp.types.js';
import { ToolSchema } from '../types/chat.types.js';
import { MCPClient } from '../clients/mcpClient.js';

/**
 * Cliente MCP para comunicarse con el servidor de disponibilidad
 */
export class MyMCPClient implements MCPClient {
    private client: Client;
    private transport: StdioClientTransport | null = null;
    private isConnected: boolean = false;
    private availableTools: ToolSchema[] = [];

    constructor(private config: MCPServerConfig) {
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

    /**
     * Conecta al servidor MCP
     */
    async connect(): Promise<void> {
        try {
            this.transport = new StdioClientTransport({
                command: this.config.command,
                args: this.config.args,
                env: this.config.env
            });

            await this.client.connect(this.transport);
            this.isConnected = true;
            console.error('✅ Conectado al servidor MCP de disponibilidad');
            await this.refreshTools();
            console.error(`🛠️  Herramientas disponibles: ${this.availableTools.map(t => t.name).join(', ')}`);

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

    /**
     * Verifica si una herramienta específica está disponible
     */
    hasTool(toolName: string): boolean {
        return this.availableTools.some(tool => tool.name === toolName);
    }

    async callTool(toolName: string, params: any): Promise<string> {
        if (!this.isConnected) {
            throw new Error('Cliente MCP no conectado');
        }

        if (!this.hasTool(toolName)) {
            throw new Error(`Herramienta no disponible: ${toolName}`);
        }

        try {
            const result = await this.client.callTool({
                name: toolName,
                arguments: params
            });

            // Usar type assertion para decirle a TypeScript la estructura esperada
            const toolResult = result as unknown as MCPToolResult;
            console.error(`Resultado raw callTool ${toolName}:`, JSON.stringify(toolResult, null, 2));

            // Verificar que content existe y es un array
            if (toolResult.content && Array.isArray(toolResult.content) && toolResult.content.length > 0) {
                const firstContent = toolResult.content[0];

                // Verificar que el primer elemento es de tipo 'text' y tiene texto
                if (firstContent.type === 'text' && firstContent.text) {
                    return firstContent.text;
                }

                throw new Error(`Tipo de contenido MCP no soportado: ${firstContent.type}`);
            }

            throw new Error('Respuesta MCP inválida: content vacío o no definido');

        } catch (error) {
            console.error(`Error ejecutando tool MCP (${toolName}):`, error);

            // Manejar errores específicos del MCP
            if (this.isMCPError(error)) {
                throw new Error(`Error del servidor MCP: ${error.error} - ${error.message}`);
            }

            throw new Error(`Error ejecutando ${toolName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    getAvailableTools(): ToolSchema[] {
        return this.availableTools;
    }


    /**
     * Ejecuta la tool de consulta de disponibilidad
     */
    async checkAvailability(params: {
        hotel_id: number;
        date_from: string;
        date_to: string;
        pax: number;
    }): Promise<string> {
        return this.callTool('check_availability', params);
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
     * Reconecta al servidor MCP
     */
    async reconnect(): Promise<void> {
        await this.disconnect();
        await this.connect();
    }

    /**
     * Termina una sesión (compatible con MCPClient interface)
     */
    async terminateSession(): Promise<void> {
        await this.disconnect();
    }

    /**
     * Limpia la sesión actual
     */
    async clearSession(): Promise<void> {
        this.availableTools = [];
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