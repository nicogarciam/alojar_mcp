import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';

export function registerUpdateAccommodationPriceTool(server: McpServer) {
    server.registerTool(
        'update_accommodation_price',
        {
            title: 'Update Accommodation Price',
            description: 'Actualiza un precio por ID',
            inputSchema: {
                id: z.number().describe('ID del precio'),
                data: z.record(z.any()).describe('Campos a actualizar')
            }
        },
        async ({ id, data }, extra): Promise<CallToolResult> => {
            const svc = new PriceService();
            try {
                const res = await svc.updatePrice(id, data);
                return { content: [{ type: 'text', text: `Precio actualizado: ${JSON.stringify(res, null, 2)}` }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Error actualizando precio: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
            }
        }
    );
}
