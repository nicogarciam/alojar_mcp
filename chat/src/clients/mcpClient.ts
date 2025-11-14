import { Client } from "@modelcontextprotocol/sdk/client/index";
import { ToolSchema } from "../types/chat.types";
import { MCPToolResult } from "../types/mcp.types";

export interface MCPClient {
    connect(): Promise<void>;
    refreshTools(): Promise<void>;
    getAvailableTools(): ToolSchema[];
    callTool(toolName: string, params: any): Promise<string>;
    isClientConnected(): boolean;
    getToolsForLLM(): Promise<any[]>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    client: Client;
}