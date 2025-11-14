import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { BookingService } from '../../resources/alojar/bookingService.js';

export function registerUpdateBookingTool(server: McpServer) {
    server.registerTool(
        'update_booking',
        {
            title: 'Update Booking Tool',
            description: 'Actualiza los datos de una reserva por ID',
            inputSchema: {
                booking_id: z.number().describe('ID de la reserva'),
                data: z.record(z.any()).describe('Campos a actualizar')
            }
        },
        async ({ booking_id, data }, extra): Promise<CallToolResult> => {
            const svc = new BookingService();
            try {
                const res = await svc.updateBooking(booking_id, data);
                return { content: [{ type: 'text', text: `Reserva actualizada: ${JSON.stringify(res, null, 2)}` }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Error actualizando reserva: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
            }
        }
    );
}
