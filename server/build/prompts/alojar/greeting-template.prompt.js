import { z } from 'zod';
export function registerGreetingTemplatePrompt(server) {
    server.registerPrompt('greeting-template', {
        title: 'Greeting Template', // Display name for UI
        description: 'A simple greeting prompt template',
        argsSchema: {
            name: z.string().describe('Name to include in greeting')
        }
    }, async ({ name }) => {
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
    });
}
