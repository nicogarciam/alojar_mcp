import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';
export function registerPriceGridTool(server) {
    server.registerTool('price_grid', {
        title: 'Price Grid Tool',
        description: 'Obtiene la grilla de precios para alojamientos (hotel_id, date_from, date_to requeridos)',
        inputSchema: {
            hotel_id: z.number().describe('ID del hotel'),
            date_from: z.string().describe('Fecha desde (YYYY-MM-DD)'),
            date_to: z.string().describe('Fecha hasta (YYYY-MM-DD)'),
            accommodations: z.array(z.union([z.string(), z.number()])).optional(),
            codes: z.array(z.string()).optional(),
            types: z.array(z.string()).optional()
        }
    }, async (input, extra) => {
        const svc = new PriceService();
        try {
            const res = await svc.priceGrid(input);
            return { content: [{ type: 'text', text: `Price grid obtenido: ${JSON.stringify(res).slice(0, 2000)}` }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error obteniendo price_grid: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
