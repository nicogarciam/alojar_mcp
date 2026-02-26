import { Client } from "@modelcontextprotocol/sdk/client/index";
import { ToolSchema } from "../types/chat.types";
import { MCPToolResult } from "../types/mcp.types";

export interface MCPClient {
    connect(): Promise<void>;
    refreshTools(): Promise<void>;
    getAvailableTools(): ToolSchema[];
    callTool(toolName: string, params: any, sessionId?: string): Promise<string>;
    isClientConnected(): boolean;
    getToolsForLLM(): Promise<any[]>;
    disconnect(): Promise<void>;
    /**
     * Intenta reconectar al MCP y obtener una nueva sesión.
     */
    reconnect(): Promise<void>;
    /**
     * Termina la sesión en el servidor MCP y limpia el estado local.
     */
    terminateSession(): Promise<void>;
    /**
     * Limpia el sessionId local sin efectuar llamadas al servidor.
     */
    clearSession(): void;
    healthCheck(): Promise<boolean>;
}