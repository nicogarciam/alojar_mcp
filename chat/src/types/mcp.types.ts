export interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
}

export interface MCPError {
    error: string;
    message?: string;
}

export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
    serverUrl?: string;
}

// Tipos para las herramientas MCP según el SDK
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}

export interface ListToolsResult {
    tools: MCPTool[];
}
