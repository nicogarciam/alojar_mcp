import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { config } from '../../env.js';

export function registerCheckAvailabilityTool(server: McpServer) {
    server.registerTool(
        'check_availability',
        {
            title: 'Check Availability Tool',
            description:
                'Returns the full list of available accommodation units for a specific accommodation type. ' +
                'IMPORTANT: Always call check_availability_summary first to get the availability and de accommodation_type_id. ' +
                'Never call this tool without accommodation_type_id — it would return an oversized payload.',
            inputSchema: {
                date_from: z.string().describe('Check-in date (YYYY-MM-DD)'),
                date_to: z.string().describe('Check-out date (YYYY-MM-DD)'),
                pax: z.number().describe('Number of guests'),
                accommodation_type_id: z.number().describe(
                    'Accommodation type ID obtained from check_availability_summary. Required to scope the response to a single type.'
                ),
            },
        },
        async ({ date_from, date_to, pax, accommodation_type_id }, extra): Promise<CallToolResult> => {
            console.log(`Consultando disponibilidad para hotel_id: 2 desde ${date_from} hasta ${date_to} para ${pax} personas, tipo: ${accommodation_type_id}`);

            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: `Consultando disponibilidad para hotel_id: 2 desde ${date_from} hasta ${date_to} para ${pax} personas, tipo: ${accommodation_type_id}`
                    },
                    extra.sessionId
                );
            } catch (error) {
                console.error('Error sending notification:', error);
            }

            try {
                if (!date_from || !date_to || !pax) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: Faltan parámetros requeridos (date_from, date_to, pax)'
                            }
                        ],
                        isError: true
                    };
                }

                const queryParams = new URLSearchParams({
                    hotel_id: '2',
                    date_from,
                    date_to,
                    pax: pax.toString(),
                    accommodation_type_id: accommodation_type_id.toString(),
                });

                const url = `${config.baseUrl}/api/accommodations/availability?${queryParams}`;

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

                const apiResponse = await response.json();
                const formattedResponse = JSON.stringify(apiResponse, null, 2);

                return {
                    content: [
                        {
                            type: 'text',
                            text: formattedResponse
                        }
                    ]
                };

            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error al consultar disponibilidad: ${error instanceof Error ? error.message : 'Error desconocido'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    );
}

function formatAvailabilityResponse(response: any): string {
    // console.error('Formateando respuesta de disponibilidad:', response);
    let result = `## 📊 Resultados de Disponibilidad\n\n`;
    result += `**Alojamientos completamente disponibles:** ${response.availables_count}\n\n`;

    if (response.availables_count > 0) {
        result += `### 🏨 Alojamientos Disponibles:\n`;
        response.availables.forEach((acc: any) => {
            result += `- **${acc.name}** (Código: ${acc.code})\n`;
            result += `  Capacidad: ${acc.capacity} personas\n`;
            result += `  Descripción: ${acc.description}\n`;
            result += `  Piso: ${acc.floor}\n`;
            result += `  Tipo: ${acc.accommodation_type.name}\n`;
            result += `     Habitaciones: ${acc.accommodation_type.rooms}\n`;
            result += `     Distribución: camas dobles:${acc.accommodation_type.distribution.distribution_doubles}\n`;
            result += `                   camas simples:${acc.accommodation_type.distribution.distribution_singles}\n`;
            result += `                   cunas:${acc.accommodation_type.distribution.distribution_cribs}\n`;
            result += `\n`;

        });
    }

    if (response.options && response.options.length > 0) {
        result += `### ⚠️ Alojamientos con Disponibilidad Parcial:\n`;
        response.options.forEach((option: any) => {
            result += `- **${option.accommodation_name}** (Código: ${option.accommodation_code})\n`;
            result += `  Capacidad: ${option.accommodation_capacity} personas\n`;
            result += `  Períodos disponibles:\n`;
            option.available.forEach((period: any) => {
                result += `  📅 ${period.from} a ${period.to}\n`;
            });
            result += `\n`;
        });
    }

    return result;
}


function formatAvailabilityResponseJSONL(response: any): string {
    // console.error('Formateando respuesta de disponibilidad:', response);
    let result = `## 📊 Resultados de Disponibilidad\n\n`;


    return result;
}




