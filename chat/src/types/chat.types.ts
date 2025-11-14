// src/types/chat.types.ts
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface ChatRequest {
    message: string;
    sessionId?: string;
    history?: ChatMessage[];
}

export interface ChatResponse {
    response: string;
    sessionId: string;
    messageId: string;
    timestamp: Date;
    toolsUsed?: string[];
}

export interface AvailabilityRequest {
    hotel_id: number;
    date_from: string;
    date_to: string;
    pax: number;
}

export interface MCPServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LLMMessage {
    role: MessageRole;
    content: string;
    name?: string; // Para function calls
    tool_call_id?: string; // Para tool calls
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface ToolSchema {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: Record<string, any>;
        required?: string[];
    };
}