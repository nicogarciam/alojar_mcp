import { z } from 'zod';
import { PriceService } from '../../resources/alojar/priceService.js';
export function registerListAccommodationPricesTool(server) {
    server.registerTool('list_accommodation_prices', {
        title: 'List Accommodation Prices',
        description: 'Lista precios de alojamiento con filtros opcionales, podemos consultar por una lista de alojamientos pasando un array de IDs o códigos',
        // Schema tolerante: acepta números como strings y arrays como strings
        inputSchema: {
            hotel_id: z.union([z.number(), z.string()]).describe('ID del hotel'),
            date_from: z.string().describe('Fecha de inicio (YYYY-MM-DD)'),
            date_to: z.string().describe('Fecha de fin (YYYY-MM-DD)'),
            codes: z.union([z.array(z.string()), z.string()]).optional().describe('Lista de códigos de alojamiento o cadena separada por comas'),
            accommodations: z.union([z.array(z.union([z.string(), z.number()])), z.string()]).optional().describe('Lista de IDs de alojamientos o cadena separada por comas'),
            types: z.union([z.array(z.string()), z.string()]).optional().describe('Lista de tipos de alojamiento o cadena separada por comas'),
            page: z.union([z.number(), z.string()]).optional().describe('Número de página para paginación'),
            limit: z.union([z.number(), z.string()]).optional().describe('Número máximo de resultados a devolver')
        }
    }, async (inputRaw, extra) => {
        const svc = new PriceService();
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
        const normalizeArray = (v) => {
            if (v === undefined || v === null || v === '')
                return undefined;
            if (Array.isArray(v))
                return v.map((x) => String(x));
            // Si viene como JSON array en string, intentar parsear
            const s = String(v).trim();
            if (s.startsWith('[')) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed))
                        return parsed.map((x) => String(x));
                }
                catch { }
            }
            // split por comas
            return s.split(',').map(x => x.trim()).filter(x => x.length > 0);
        };
        const input = {
            hotel_id: normalizeNumber(raw.hotel_id),
            date_from: raw.date_from || undefined,
            date_to: raw.date_to || undefined,
            accommodations: normalizeArray(raw.accommodations),
            codes: normalizeArray(raw.codes),
            types: normalizeArray(raw.types),
            page: normalizeNumber(raw.page),
            limit: normalizeNumber(raw.limit)
        };
        // Si no hay parámetros útiles, responder con mensaje claro
        if (!input.hotel_id && !input.date_from && !input.date_to && !input.accommodations && !input.codes) {
            return {
                isError: true,
                content: [{ type: 'text', text: 'Error: No se proporcionaron filtros válidos. Al menos hotel_id o date_from/date_to o accommodations/codes deben estar presentes.' }]
            };
        }
        try {
            const res = await svc.listPrices(input);
            const count = Array.isArray(res) ? res.length : (res?.data?.length ?? undefined);
            const text = `Precios obtenidos. Items: ${count ?? 'n/a'}. Resumen: ${JSON.stringify(res).slice(0, 1000)}`;
            return { content: [{ type: 'text', text }] };
        }
        catch (err) {
            return { isError: true, content: [{ type: 'text', text: `Error listando precios: ${err instanceof Error ? err.message : 'Error desconocido'}` }] };
        }
    });
}
