import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';

export function registerManageBookingTool(server: McpServer) {
    server.registerTool(
        'manage_booking',
        {
            title: 'Manage Booking Tool',
            description: 'Gestiona todas las operaciones CRUD para reservas (create, update, cancel, get, list).',
            inputSchema: {
                action: z.enum(['create', 'update', 'cancel', 'get', 'list']),
                booking_id: z.number().optional(),
                
                // --- CREATE / UPDATE Payload ---
                guest_id: z.number().optional(),
                guest: z.object({
                    id: z.number().optional(),
                    name: z.string().optional(),
                    email: z.string().optional(),
                    phone: z.string().optional(),
                    dni: z.string().optional(),
                    address: z.string().optional(),
                    city_id: z.number().optional(),
                    birthday: z.string().optional(),
                }).optional(),
                date_in: z.string().optional(),
                date_out: z.string().optional(),
                pax: z.number().optional(),
                pax_adult: z.number().optional(),
                pax_minor: z.number().optional(),
                accommodations: z.array(z.object({
                    id: z.number(),
                    distribution_doubles: z.number().optional(),
                    distribution_singles: z.number().optional(),
                    distribution_cribs: z.number().optional(),
                    price: z.number(),
                })).optional(),
                numberOfNights: z.number().optional(),
                booking_state_id: z.number().optional(),
                list_price: z.number().optional(),
                booking_price: z.number().optional(),
                total_price: z.number().optional(),
                additional_price: z.number().optional(),
                garage_price: z.number().optional(),
                garage_nro: z.number().optional(),
                garage_selected: z.boolean().optional(),
                
                // Generic update data payload
                data: z.record(z.any()).optional(),

                // --- LIST filters ---
                hotel_id: z.number().optional(),
                date_from: z.string().optional(),
                date_to: z.string().optional(),
                page: z.number().optional(),
                limit: z.number().optional()
            }
        },
        async (inputRaw, extra): Promise<CallToolResult> => {
            const svc = new BookingService();
            const input: Record<string, any> = { ...(inputRaw as any) };

            try {
                switch (input.action) {
                    case 'create': {
                        if (!input.date_in || !input.date_out) return { isError: true, content: [{ type: 'text', text: 'Error: Se requieren date_in y date_out' }] };
                        if (!input.accommodations || input.accommodations.length === 0) return { isError: true, content: [{ type: 'text', text: 'Error: Se requiere al menos un Alojamiento' }] };
                        if (!input.pax || input.pax <= 0) return { isError: true, content: [{ type: 'text', text: 'Error: Se requiere pax mayor a 0' }] };
                        
                        const numericKeys = ['guest_id', 'booking_state_id', 'pax', 'pax_adult', 'pax_minor', 'booking_price', 'total_price', 'additional_price', 'garage_price', 'garage_nro', 'numberOfNights', 'city_id'];
                        for (const k of numericKeys) {
                            if (k in input && typeof input[k] === 'string') {
                                const n = Number(input[k]);
                                if (!Number.isNaN(n)) input[k] = n;
                            }
                        }

                        if (!input.guest_id && !input.guest) {
                            return { isError: true, content: [{ type: 'text', text: 'Error: Falta guest_id o datos del guest.' }] };
                        }
                        
                        const res = await svc.createBooking(input);
                        return { content: [{ type: 'text', text: `Reserva creada: ${JSON.stringify(res, null, 2)}` }] };
                    }
                    case 'update': {
                        if (!input.booking_id) return { isError: true, content: [{ type: 'text', text: 'Error: Se requiere booking_id' }] };
                        const updateData = input.data || {};
                        const res = await svc.updateBooking(input.booking_id, updateData);
                        return { content: [{ type: 'text', text: `Reserva actualizada: ${JSON.stringify(res, null, 2)}` }] };
                    }
                    case 'cancel': {
                        if (!input.booking_id) return { isError: true, content: [{ type: 'text', text: 'Error: Se requiere booking_id' }] };
                        const res = await svc.cancelBooking(input.booking_id);
                        return { content: [{ type: 'text', text: `Reserva cancelada: ${JSON.stringify(res)}` }] };
                    }
                    case 'get': {
                        if (!input.booking_id) return { isError: true, content: [{ type: 'text', text: 'Error: Se requiere booking_id' }] };
                        const res = await svc.getBooking(input.booking_id);
                        return { content: [{ type: 'text', text: `Reserva: ${JSON.stringify(res, null, 2)}` }] };
                    }
                    case 'list': {
                        const res = await svc.listBookings(input as any);
                        return { content: [{ type: 'text', text: `Resultados: ${JSON.stringify(res, null, 2)}` }] };
                    }
                    default:
                        return { isError: true, content: [{ type: 'text', text: `Action inválida: ${input.action}` }] };
                }
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Error en ${input.action}: ${err instanceof Error ? err.message : 'Desconocido'}` }] };
            }
        }
    );
}
