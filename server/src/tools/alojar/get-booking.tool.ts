import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';

export function registerGetBookingTool(server: McpServer) {
    server.registerTool(
        'get_booking',
        {
            title: 'Get Booking Tool',
            description: 'Obtiene una reserva por su ID',
            inputSchema: {
                booking_id: z.number().describe('ID de la reserva')
            }
        },
        async ({ booking_id }, extra): Promise<CallToolResult> => {
            const svc = new BookingService();
            try {
                const res = await svc.getBooking(booking_id);
                return { content: [{ type: 'text', text: `Reserva: ${JSON.stringify(res, null, 2)}` }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Error obteniendo reserva: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
            }
        }
    );
}
