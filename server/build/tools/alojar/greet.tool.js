import { z } from 'zod';
export function registerGreetingTool(server) {
    server.tool('greet', {
        title: 'Greeting Tool', // Display name for UI
        description: 'A simple greeting tool',
        inputSchema: {
            name: z.string().describe('Name to greet')
        }
    }, async ({ name }) => {
        return {
            content: [
                {
                    type: 'text',
                    text: `Hello, ${name}!`
                }
            ]
        };
    });
}
