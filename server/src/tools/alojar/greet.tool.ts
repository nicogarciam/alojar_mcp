import { CallToolResult, PrimitiveSchemaDefinition } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';

export function registerGreetingTool(server: McpServer) {
    server.tool(
        'greet',
        {
            title: 'Greeting Tool', // Display name for UI
            description: 'A simple greeting tool',
            inputSchema: {
                name: z.string().describe('Name to greet')
            }
        },
        async ({ name }): Promise<CallToolResult> => {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Hello, ${name}!`
                    }
                ]
            };
        }
    );
}

