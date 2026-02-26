import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';
export function registerGetAccommodationPriceTool(server) {
    server.registerTool('get_accommodation_price', {
        title: 'Get Accommodation Price',
        description: 'Obtiene un precio por su ID',
        inputSchema: {
            id: z.number().describe('ID del precio')
        }
    }, async ({ id }, extra) => {
        const svc = new PriceService();
        try {
            const res = await svc.getPrice(id);
            return { content: [{ type: 'text', text: `Precio: ${JSON.stringify(res, null, 2)}` }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error obteniendo precio: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
