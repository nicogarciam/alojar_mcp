import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';

export function registerDeleteAccommodationPriceTool(server: McpServer) {
    server.registerTool(
        'delete_accommodation_price',
        {
            title: 'Delete Accommodation Price',
            description: 'Elimina un precio por su ID',
            inputSchema: {
                id: z.number().describe('ID del precio')
            }
        },
        async ({ id }, extra): Promise<CallToolResult> => {
            const svc = new PriceService();
            try {
                const res = await svc.deletePrice(id);
                return { content: [{ type: 'text', text: `Precio eliminado. Respuesta: ${JSON.stringify(res).slice(0, 500)}` }] };
            } catch (err) {
                return { isError: true, content: [{ type: 'text', text: `Error eliminando precio: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
            }
        }
    );
}
