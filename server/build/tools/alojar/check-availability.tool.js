import { z } from 'zod';
import { AvailabilityService } from '../../resources/alojar/availabilityService.js';
export function registerCheckAvailabilityTool(server) {
    server.registerTool('check_availability', {
        title: 'Check Availability Tool',
        description: 'Consulta la disponibilidad de alojamientos para el Hotel CasaBlanca Las Grutas entre las fechas y para un número de personas específicos (pax)',
        inputSchema: {
            date_from: z.string().describe('Check-in date (YYYY-MM-DD)'),
            date_to: z.string().describe('Check-out date (YYYY-MM-DD)'),
            pax: z.number().describe('Number of guests')
        },
    }, async ({ date_from, date_to, pax }, extra) => {
        const availabilityService = new AvailabilityService();
        console.log('Consultando disponibilidad para hotel_id: 2 desde', date_from, 'hasta', date_to, 'para', pax, 'personas');
        try {
            await server.sendLoggingMessage({
                level: 'info',
                data: `Vamos a consultar disponibilidad para hotel_id: 2 desde ${date_from} hasta ${date_to} para ${pax} personas`
            }, extra.sessionId);
        }
        catch (error) {
            console.error('Error sending notification:', error);
        }
        try {
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
            const apiResponse = await availabilityService.quickAvailability(2, date_from, date_to, pax);
            //const formattedResponse = formatAvailabilityResponse(apiResponse);
            const formattedResponse = JSON.stringify(apiResponse, null, 2);
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
    });
}
function formatAvailabilityResponse(response) {
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
function formatAvailabilityResponseJSONL(response) {
    // console.error('Formateando respuesta de disponibilidad:', response);
    let result = `## 📊 Resultados de Disponibilidad\n\n`;
    return result;
}
