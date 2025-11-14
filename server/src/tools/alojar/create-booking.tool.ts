import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';

export function registerCreateBookingTool(server: McpServer) {
    server.registerTool(
        'create_booking',
        {
            title: 'Create Booking Tool',
            description: 'Crea una nueva reserva en el servicio ALOJAR (payload según booking.md)',
            // Schema adaptado del request body mostrado en booking.md.
            inputSchema: {
                id: z.number().optional(),
                hotel_id: z.number().describe('ID del hotel').optional(),
                guest_id: z.number().optional(),
                booking_state_id: z.number().optional(),
                payment_state_id: z.number().optional(),
                date_in: z.string().describe('Check-in (YYYY-MM-DD)'),
                date_out: z.string().describe('Check-out (YYYY-MM-DD)'),
                note: z.string().optional(),
                pax: z.number().describe('Número total de huéspedes').optional(),
                pax_adult: z.number().optional(),
                pax_minor: z.number().optional(),
                accommodation_count: z.number().optional(),
                coupon_code: z.string().optional(),
                days_to_confirm: z.number().optional(),
                days_to_cancel: z.number().optional(),
                total_price: z.number().optional(),
                booking_price: z.number().optional(),
                additional_price: z.number().optional(),
                price_note: z.string().optional(),
                code: z.string().optional(),
                list_price: z.number().optional(),
                garage_price: z.number().optional(),
                garage_nro: z.number().optional(),
                garage_selected: z.boolean().optional(),
                garage_licence_plate: z.string().optional(),
                customer_id: z.number().optional(),
                user: z.string().optional(),
                discount: z.string().optional(),
                days: z.array(z.string()).optional(),
                booking_state: z.record(z.any()).optional(),
                created_at: z.string().optional(),
                updated_at: z.string().optional()
            } // pasar solo el shape, no el schema completo
        },
        async (inputRaw, extra): Promise<CallToolResult> => {
            const svc = new BookingService();

            // server.sendLoggingMessage es opcional: intentar notificar
            try {
                await server.sendLoggingMessage({ level: 'info', data: `Crear reserva: hotel_id=${(inputRaw as any).hotel_id} date_in=${(inputRaw as any).date_in}` }, extra.sessionId);
            } catch (e) { /* no bloquear si falla logging */ }

            try {
                // Validar y normalizar input via Zod
                const parsed = (z as any).object // placeholder para TS inference
                // Usamos safe parse con el schema definido arriba
                // (re-construct schema to call safeParse)
            } catch (e) {
                // fallback - no debería ocurrir aquí
            }

            // Validación/normalización manual ligera (por si viene como strings)
            const input: Record<string, any> = { ...(inputRaw as any) };
            const numericKeys = ['id', 'hotel_id', 'guest_id', 'booking_state_id', 'payment_state_id', 'pax', 'pax_adult', 'pax_minor', 'accommodation_count', 'days_to_confirm', 'days_to_cancel', 'total_price', 'booking_price', 'additional_price', 'list_price', 'garage_price', 'garage_nro', 'customer_id'];
            for (const k of numericKeys) {
                if (k in input && typeof input[k] === 'string') {
                    const n = Number(input[k]);
                    if (!Number.isNaN(n)) input[k] = n;
                }
            }

            // Requerir al menos hotel_id, date_in, date_out (ajusta según tus reglas)
            if (!input.hotel_id || !input.date_in || !input.date_out) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: 'Error: faltan campos requeridos. Se requiere hotel_id, date_in y date_out.' }]
                };
            }

            try {
                const res = await svc.createBooking(input);
                const id = res?.id || res?.booking_id || res?.data?.id || res?.result?.id;
                const text = id
                    ? `Reserva creada correctamente. ID: ${id}`
                    : `Reserva creada. Respuesta: ${JSON.stringify(res).slice(0, 1000)}`;
                return { content: [{ type: 'text', text }] };
            } catch (err) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Error creando reserva: ${err instanceof Error ? err.message : 'Error desconocido'}` }]
                };
            }
        }
    );
}
