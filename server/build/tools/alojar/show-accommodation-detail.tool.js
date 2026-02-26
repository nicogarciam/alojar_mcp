import { z } from 'zod';
import { AccommodationService } from '../../resources/alojar/accommodationService.js';
export function registerShowAccommodationDetailTool(server) {
    server.registerTool('show_accommodation_detail', {
        title: 'Show Accommodation Detail',
        description: 'Muestra detalles de alojamiento con filtros opcionales, sedebe consultar por id del alojamiento.',
        inputSchema: {
            id: z.union([z.number(), z.string()]).describe('ID del Alojamiento a consultar'),
        }
    }, async (inputRaw, extra) => {
        const svc = new AccommodationService();
        const raw = inputRaw;
        // Normalización defensiva
        const normalizeNumber = (v) => {
            if (v === undefined || v === null || v === '')
                return undefined;
            if (typeof v === 'number')
                return v;
            const n = Number(String(v).trim());
            return Number.isNaN(n) ? undefined : n;
        };
        const input = {
            id: normalizeNumber(raw.id),
        };
        // Si no hay parámetros útiles, responder con mensaje claro
        if (!input.id) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'Error: No se proporsiono el ID del alojamiento a consultar.' }]
            };
        }
        try {
            const res = await svc.getAccommodationDetail(input.id);
            const text = `Detalle de alojamiento obtenido: ${JSON.stringify(res).slice(0, 1000)}`;
            return { content: [{ type: 'text', text }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error obteniendo detalle de alojamiento: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
