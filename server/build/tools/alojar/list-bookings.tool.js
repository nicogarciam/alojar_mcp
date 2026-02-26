import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';
export function registerListBookingsTool(server) {
    server.registerTool('list_bookings', {
        title: 'List Bookings Tool',
        description: 'Lista reservas con filtros opcionales',
        inputSchema: {
            hotel_id: z.number().optional(),
            date_from: z.string().optional(),
            date_to: z.string().optional(),
            pax: z.number().optional(),
            page: z.number().optional(),
            limit: z.number().optional()
        }
    }, async (input, extra) => {
        const svc = new BookingService();
        try {
            const res = await svc.listBookings(input);
            return { content: [{ type: 'text', text: `Resultados: ${JSON.stringify(res, null, 2)}` }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error listando reservas: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
