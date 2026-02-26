import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';
export function registerCreateBookingTool(server) {
    server.registerTool('create_booking', {
        title: 'Crear Reserva',
        description: 'Crea una nueva reserva en el sistema ALOJAR. Si no se proporciona guest_id, se debe incluir la información del huésped para crear uno nuevo.',
        inputSchema: {
            guest_id: z.number().optional().describe('ID del huésped existente'),
            guest: z.object({
                id: z.number().optional(),
                name: z.string().optional(),
                email: z.string().optional(),
                phone: z.string().optional(),
                dni: z.string().optional(),
                address: z.string().optional(),
                city_id: z.number().optional(),
                birthday: z.string().optional(),
            }).optional().describe('Datos del huésped (requerido si no hay guest_id)'),
            date_in: z.string().describe('Fecha check-in (ISO 8601: 2024-09-25T03:00:00.000Z)'),
            date_out: z.string().describe('Fecha check-out (ISO 8601: 2024-09-29T03:00:00.000Z)'),
            pax: z.number().describe('Número total de huéspedes'),
            pax_adult: z.number().optional().describe('Número de adultos'),
            pax_minor: z.number().optional().describe('Número de menores'),
            accommodations: z.array(z.object({
                id: z.number(),
                distribution_doubles: z.number().optional(),
                distribution_singles: z.number().optional(),
                distribution_cribs: z.number().optional(),
                price: z.number(),
            })).describe('Array de acomodaciones'),
            numberOfNights: z.number().optional().describe('Número de noches'),
            booking_state_id: z.number().optional().describe('ID del estado (default: 1)'),
            list_price: z.number().optional().describe('Precio de lista'),
            booking_price: z.number().optional().describe('Precio de reserva'),
            total_price: z.number().optional().describe('Precio total'),
            additional_price: z.number().optional().describe('Precio adicional'),
            garage_price: z.number().optional().describe('Precio de garaje'),
            garage_nro: z.number().optional().describe('Número de garaje'),
            garage_selected: z.boolean().optional().describe('¿Garaje seleccionado?'),
        },
    }, async (inputRaw, extra) => {
        const svc = new BookingService();
        const input = { ...inputRaw };
        // Log de la operación
        try {
            await server.sendLoggingMessage({
                level: 'info',
                data: `Iniciando creación de reserva | guest_id=${input.guest_id || 'nuevo'} | check-in=${input.date_in} | accommodations=${input.accommodations?.length || 0}`
            }, extra.sessionId);
        }
        catch (e) { /* no bloquear si falla logging */ }
        try {
            // Validación básica de campos requeridos
            if (!input.date_in || !input.date_out) {
                return {
                    isError: true,
                    content: [{
                            type: 'text',
                            text: '❌ Error: Se requieren date_in y date_out en formato ISO 8601 (ej: 2024-09-25T03:00:00.000Z)'
                        }]
                };
            }
            if (!input.accommodations || !Array.isArray(input.accommodations) || input.accommodations.length === 0) {
                return {
                    isError: true,
                    content: [{
                            type: 'text',
                            text: '❌ Error: Se requiere al menos un Alojamiento'
                        }]
                };
            }
            if (!input.pax || input.pax <= 0) {
                return {
                    isError: true,
                    content: [{
                            type: 'text',
                            text: '❌ Error: Se requiere pax (número de huéspedes) mayor a 0'
                        }]
                };
            }
            // Normalizaciones numéricas
            const numericKeys = ['guest_id', 'booking_state_id', 'pax', 'pax_adult', 'pax_minor', 'booking_price', 'total_price', 'additional_price', 'garage_price', 'garage_nro', 'numberOfNights', 'city_id'];
            for (const k of numericKeys) {
                if (k in input && typeof input[k] === 'string') {
                    const n = Number(input[k]);
                    if (!Number.isNaN(n))
                        input[k] = n;
                }
            }
            // Manejo de guest_id vs guest data
            let guestId = input.guest_id;
            if (!guestId) {
                // Si no hay guest_id, validar que venga la info del huésped
                const guestData = input.guest;
                if (!guestData || !guestData.name || !guestData.email) {
                    return {
                        isError: true,
                        content: [{
                                type: 'text',
                                text: '❌ Error: No se proporciona guest_id. Se requiere información del huésped: name, email (mínimo). Alternativamente, proporcione un guest_id válido.'
                            }]
                    };
                }
                // TODO: Aquí se podría llamar a un servicio para crear el guest si no existe
                // Por ahora, se asume que el guest viene en el payload
            }
            // Asegurar defaults
            input.hotel_id = 2; // Hotel CasaBlanca Las Grutas
            input.booking_state_id = input.booking_state_id || 1; // Estado por defecto
            input.pax_adult = input.pax_adult || input.pax;
            input.pax_minor = input.pax_minor || 0;
            input.additional_price = input.additional_price || 0;
            input.booking_discounts = input.booking_discounts || [];
            // Calcular precios si es necesario
            if (!input.booking_price || !input.total_price) {
                input.list_price = input.list_price;
                input.booking_price = input.booking_price;
                input.total_price = input.total_price;
            }
            // Construir el payload final
            const payload = {
                hotel_id: input.hotel_id,
                date_in: input.date_in,
                date_out: input.date_out,
                pax: input.pax,
                pax_adult: input.pax_adult,
                pax_minor: input.pax_minor,
                accommodations: input.accommodations,
                numberOfNights: input.numberOfNights,
                accommodation_count: input.accommodation_count,
                booking_state_id: input.booking_state_id,
                list_price: input.list_price,
                booking_price: input.booking_price,
                total_price: input.total_price,
                discount: input.discount,
                additional_price: input.additional_price,
                garage_price: input.garage_price,
                garage_nro: input.garage_nro,
                garage_selected: input.garage_selected,
                booking_discounts: input.booking_discounts,
                drawed: input.drawed,
            };
            // Incluir guest_id si existe, si no incluir guest data
            if (input.guest_id) {
                payload.guest_id = input.guest_id;
            }
            else if (input.guest) {
                payload.guest = input.guest;
            }
            // Incluir booking_state si existe
            if (input.booking_state) {
                payload.booking_state = input.booking_state;
            }
            // Realizar la llamada a la API
            const res = await svc.createBooking(payload);
            // Extraer el ID de la respuesta
            const bookingId = res?.id || res?.booking_id || res?.data?.id || res?.result?.id;
            if (bookingId) {
                await server.sendLoggingMessage({
                    level: 'info',
                    data: `Reserva creada exitosamente con ID: ${bookingId}`
                }, extra.sessionId);
                return {
                    content: [{
                            type: 'text',
                            text: `✅ Reserva creada correctamente\n\n**ID de Reserva:** ${bookingId}\n**Check-in:** ${input.date_in}\n**Check-out:** ${input.date_out}\n**Huéspedes:** ${input.pax}\n**Precio Total:** $${input.total_price}`
                        }]
                };
            }
            else {
                // Respuesta parcial (sin ID claro, pero posiblemente exitosa)
                return {
                    content: [{
                            type: 'text',
                            text: `✅ Reserva procesada\n\nRespuesta del servidor:\n\`\`\`json\n${JSON.stringify(res, null, 2).slice(0, 1500)}\n\`\`\``
                        }]
                };
            }
        }
        catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            await server.sendLoggingMessage({
                level: 'error',
                data: `Error creando reserva: ${errorMsg}`
            }, extra.sessionId).catch(() => { });
            return {
                isError: true,
                content: [{
                        type: 'text',
                        text: `❌ Error creando reserva: ${errorMsg}`
                    }]
            };
        }
    });
}
