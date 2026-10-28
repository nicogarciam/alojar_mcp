import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { config } from '../../env.js';

interface TypeSummary {
    accommodation_type_id: number;
    type_name: string;
    total: number;
    available: number;
    unavailable: number;
}

interface AvailabilitySummaryResponse {
    date_from: string;
    date_to: string;
    pax: number;
    total_types: number;
    types_with_availability: number;
    summary: TypeSummary[];
}

export function registerCheckAvailabilitySummaryTool(server: McpServer) {
    server.registerTool(
        'check_availability_summary',
        {
            title: 'Check Availability Summary',
            description:
                'Returns a grouped summary of accommodation availability by type (e.g. Studio, 2-bedroom, etc.), ' +
                'showing total units, available units and unavailable units. ' +
                'Use this tool when the user asks for check availability.',
            inputSchema: {
                date_from: z.string().describe('Check-in date (YYYY-MM-DD)'),
                date_to: z.string().describe('Check-out date (YYYY-MM-DD)'),
                pax: z.number().describe('Number of guests'),
            },
        },
        async ({ date_from, date_to, pax }, extra): Promise<CallToolResult> => {
            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: `Consultando resumen de disponibilidad: hotel_id=2 ${date_from} -> ${date_to} pax=${pax}`,
                    },
                    extra.sessionId
                );
            } catch {
                // Non-fatal: continue even if logging fails
            }

            try {
                const params = new URLSearchParams({
                    hotel_id: '2',
                    date_from,
                    date_to,
                    pax: pax.toString(),
                });

                const url = `${config.baseUrl}/api/accommodations/availability_summary?${params}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${config.token}`,
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
                }

                const data: AvailabilitySummaryResponse = await response.json();

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error al consultar resumen de disponibilidad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );
}
