import { CallToolResult, PrimitiveSchemaDefinition } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';

export function registerCollectUserInfoTool(server: McpServer) {
    server.tool(
        'collect-user-info',
        'A tool that collects user information through elicitation',
        {
            infoType: z.enum(['contact', 'preferences', 'feedback']).describe('Type of information to collect')
        },
        async ({ infoType }): Promise<CallToolResult> => {
            let message: string;
            let requestedSchema: {
                type: 'object';
                properties: Record<string, PrimitiveSchemaDefinition>;
                required?: string[];
            };

            switch (infoType) {
                case 'contact':
                    message = 'Please provide your contact information';
                    requestedSchema = {
                        type: 'object',
                        properties: {
                            name: {
                                type: 'string',
                                title: 'Full Name',
                                description: 'Your full name'
                            },
                            email: {
                                type: 'string',
                                title: 'Email Address',
                                description: 'Your email address',
                                format: 'email'
                            },
                            phone: {
                                type: 'string',
                                title: 'Phone Number',
                                description: 'Your phone number (optional)'
                            }
                        },
                        required: ['name', 'email']
                    };
                    break;
                case 'preferences':
                    message = 'Please set your preferences';
                    requestedSchema = {
                        type: 'object',
                        properties: {
                            theme: {
                                type: 'string',
                                title: 'Theme',
                                description: 'Choose your preferred theme',
                                enum: ['light', 'dark', 'auto'],
                                enumNames: ['Light', 'Dark', 'Auto']
                            },
                            notifications: {
                                type: 'boolean',
                                title: 'Enable Notifications',
                                description: 'Would you like to receive notifications?',
                                default: true
                            },
                            frequency: {
                                type: 'string',
                                title: 'Notification Frequency',
                                description: 'How often would you like notifications?',
                                enum: ['daily', 'weekly', 'monthly'],
                                enumNames: ['Daily', 'Weekly', 'Monthly']
                            }
                        },
                        required: ['theme']
                    };
                    break;
                case 'feedback':
                    message = 'Please provide your feedback';
                    requestedSchema = {
                        type: 'object',
                        properties: {
                            rating: {
                                type: 'integer',
                                title: 'Rating',
                                description: 'Rate your experience (1-5)',
                                minimum: 1,
                                maximum: 5
                            },
                            comments: {
                                type: 'string',
                                title: 'Comments',
                                description: 'Additional comments (optional)',
                                maxLength: 500
                            },
                            recommend: {
                                type: 'boolean',
                                title: 'Would you recommend this?',
                                description: 'Would you recommend this to others?'
                            }
                        },
                        required: ['rating', 'recommend']
                    };
                    break;
                default:
                    throw new Error(`Unknown info type: ${infoType}`);
            }

            try {
                // Use the underlying server instance to elicit input from the client
                const result = await server.server.elicitInput({
                    message,
                    requestedSchema
                });

                if (result.action === 'accept') {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Thank you! Collected ${infoType} information: ${JSON.stringify(result.content, null, 2)}`
                            }
                        ]
                    };
                } else if (result.action === 'decline') {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `No information was collected. User declined ${infoType} information request.`
                            }
                        ]
                    };
                } else {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Information collection was cancelled by the user.`
                            }
                        ]
                    };
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error collecting ${infoType} information: ${error}`
                        }
                    ]
                };
            }
        }
    );




}

