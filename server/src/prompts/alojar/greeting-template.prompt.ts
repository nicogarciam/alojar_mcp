import { GetPromptResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';

export function registerGreetingTemplatePrompt(server: McpServer) {
    server.registerPrompt(
        'greeting-template',
        {
            title: 'Greeting Template', // Display name for UI
            description: 'A simple greeting prompt template',
            argsSchema: {
                name: z.string().describe('Name to include in greeting')
            }
        },
        async ({ name }): Promise<GetPromptResult> => {
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Please greet ${name} in a friendly manner.`
                        }
                    }
                ]
            };
        }
    );
}

