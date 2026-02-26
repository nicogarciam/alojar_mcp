import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';
export function registerCreateAccommodationPriceTool(server) {
    server.registerTool('create_accommodation_price', {
        title: 'Create Accommodation Price',
        description: 'Crea un nuevo precio de alojamiento (POST /api/accommodation_prices)',
        inputSchema: {
            // uso passthrough para permitir el esquema completo del componente
            id: z.number().optional(),
            hotel_id: z.number().optional(),
            // campos de precio habituales
            price: z.number().optional(),
            list_price: z.number().optional(),
            garage_price: z.number().optional(),
            garage_nro: z.number().optional(),
            code: z.string().optional(),
            // otros campos pueden pasarse
        }
    }, async (inputRaw, extra) => {
        const svc = new PriceService();
        const input = inputRaw;
        try {
            const res = await svc.createPrice(input);
            const id = res?.id || res?.data?.id;
            const text = id ? `Precio creado. ID: ${id}` : `Creado. Respuesta: ${JSON.stringify(res).slice(0, 1000)}`;
            return { content: [{ type: 'text', text }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error creando precio: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
