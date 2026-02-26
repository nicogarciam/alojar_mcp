import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';
export function registerCancelBookingTool(server) {
    server.registerTool('cancel_booking', {
        title: 'Cancel Booking Tool',
        description: 'Cancela (elimina) una reserva por su ID',
        inputSchema: {
            booking_id: z.number().describe('ID de la reserva')
        }
    }, async ({ booking_id }, extra) => {
        const svc = new BookingService();
        try {
            const res = await svc.cancelBooking(booking_id);
            return { content: [{ type: 'text', text: `Reserva cancelada: ${JSON.stringify(res)}` }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error cancelando reserva: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
