import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { AvailabilityService } from '../resources/alojar/availabilityService.js';
export class AlojarServer {
    server;
    availabilityService;
    constructor() {
        console.error('[Setup] Initializing Alojar MCP server...');
        this.server = new Server({
            name: 'alojar-mcp-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        // Configurar el servicio de disponibilidad
        this.availabilityService = new AvailabilityService({
            token: process.env.ALOJAR_API_TOKEN || '',
            baseUrl: process.env.ALOJAR_API_BASE_URL || 'http://localhost/alojar/public'
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[Error]', error);
        /* process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        }); */
    }
    setupToolHandlers() {
        // Listar herramientas disponibles
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'check_availability',
                    description: 'Consulta la disponibilidad de alojamientos para un hotel, fechas y número de personas específicos',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            hotel_id: {
                                type: 'number',
                                description: 'ID del hotel a consultar'
                            },
                            date_from: {
                                type: 'string',
                                description: 'Fecha de check-in (formato: YYYY-MM-DD)'
                            },
                            date_to: {
                                type: 'string',
                                description: 'Fecha de check-out (formato: YYYY-MM-DD)'
                            },
                            pax: {
                                type: 'number',
                                description: 'Número de personas (huéspedes)'
                            }
                        },
                        required: ['hotel_id', 'date_from', 'date_to', 'pax']
                    }
                }
            ]
        }));
        // Manejador para consultar disponibilidad
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name === 'check_availability') {
                try {
                    const { hotel_id, date_from, date_to, pax } = request.params.arguments;
                    // Validar parámetros
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
                    const apiResponse = await this.availabilityService.quickAvailability(2, date_from, date_to, pax);
                    const formattedResponse = this.formatAvailabilityResponse(apiResponse);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: formattedResponse
                            }
                        ]
                    };
                }
                catch (error) {
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
            throw new Error(`Herramienta no encontrada: ${request.params.name}`);
        });
    }
    /**
     * Formatea la respuesta de disponibilidad para el MCP
     */
    formatAvailabilityResponse(response) {
        // console.error('Formateando respuesta de disponibilidad:', response);
        let result = `## 📊 Resultados de Disponibilidad\n\n`;
        result += `**Alojamientos completamente disponibles:** ${response.availables_count}\n\n`;
        if (response.availables_count > 0) {
            result += `### 🏨 Alojamientos Disponibles:\n`;
            response.availables.forEach((acc) => {
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
            response.options.forEach((option) => {
                result += `- **${option.accommodation_name}** (Código: ${option.accommodation_code})\n`;
                result += `  Capacidad: ${option.accommodation_capacity} personas\n`;
                result += `  Períodos disponibles:\n`;
                option.available.forEach((period) => {
                    result += `  📅 ${period.from} a ${period.to}\n`;
                });
                result += `\n`;
            });
        }
        return result;
    }
    /**
     * Configura el manejo de errores
     */
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Server Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('ALOJAR MCP server running on stdio');
    }
}
