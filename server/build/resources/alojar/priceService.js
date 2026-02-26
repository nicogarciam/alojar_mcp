import { config } from "../../env.js";
/**
 * Servicio para gestionar precios de alojamiento (accommodation_prices)
 * Métodos: listPrices, createPrice, getPrice, updatePrice, deletePrice, priceGrid
 */
export class PriceService {
    baseUrl;
    token;
    constructor(customConfig) {
        this.baseUrl = customConfig?.baseUrl || config.baseUrl;
        this.token = customConfig?.token || config.token;
        if (!this.token || !this.baseUrl) {
            throw new Error('Faltan variables de entorno requeridas: ALOJAR_API_TOKEN y ALOJAR_API_BASE_URL');
        }
    }
    ensureNumber(v) {
        if (typeof v === 'number')
            return v;
        const n = Number(v);
        return Number.isNaN(n) ? v : n;
    }
    async safeFetch(url, opts = {}) {
        const res = await fetch(url, opts);
        const text = await res.text().catch(() => '');
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? '- ' + text : ''} `);
        }
        try {
            return JSON.parse(text || '{}');
        }
        catch {
            return text;
        }
    }
    /**
     * Listar precios con filtros opcionales (query params)
     */
    async listPrices(query = {}) {
        const params = new URLSearchParams();
        for (const k of Object.keys(query)) {
            const v = query[k];
            if (v === undefined || v === null)
                continue;
            // soportar arrays -> coma-separados
            if (Array.isArray(v))
                params.append(k, v.join(','));
            else
                params.append(k, String(v));
        }
        const url = `${this.baseUrl}/api/accommodations/price_grid${params.toString() ? '?' + params.toString() : ''}`;
        console.error('listPrices URL:', url);
        return this.safeFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Accept': 'application/json'
            }
        });
    }
    /**
     * Crear precio (POST /api/accommodation_prices)
     */
    async createPrice(payload) {
        // Normalizar números si vienen como strings
        const numericKeys = ['id', 'hotel_id', 'price', 'list_price', 'garage_price', 'garage_nro'];
        for (const k of numericKeys) {
            if (k in payload)
                payload[k] = this.ensureNumber(payload[k]);
        }
        const url = `${this.baseUrl} /api/accommodation_prices`;
        return this.safeFetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }
    /**
     * Obtener precio por ID (GET /api/accommodation_prices/{id})
     */
    async getPrice(id) {
        const nid = this.ensureNumber(id);
        const url = `${this.baseUrl}/api/accommodation_prices/${nid}`;
        return this.safeFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Accept': 'application/json'
            }
        });
    }
    /**
     * Actualizar precio por ID (PUT /api/accommodation_prices/{id})
     */
    async updatePrice(id, data) {
        const nid = this.ensureNumber(id);
        const url = `${this.baseUrl}/api/accommodation_prices/${nid}`;
        return this.safeFetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }
    /**
     * Eliminar precio por ID (DELETE /api/accommodation_prices/{id})
     */
    async deletePrice(id) {
        const nid = this.ensureNumber(id);
        const url = `${this.baseUrl}/api/accommodation_prices/${nid}`;
        return this.safeFetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Accept': 'application/json'
            }
        });
    }
    /**
     * Obtener price grid (GET /api/accommodation_prices/price_grid)
     * Params: hotel_id (required), date_from, date_to (required), accommodations[], codes[], types[]
     */
    async priceGrid(params) {
        if (!params || !params.hotel_id || !params.date_from || !params.date_to) {
            throw new Error('hotel_id, date_from y date_to son requeridos para priceGrid');
        }
        const qs = new URLSearchParams();
        qs.append('hotel_id', String(params.hotel_id));
        qs.append('date_from', params.date_from);
        qs.append('date_to', params.date_to);
        if (params.accommodations && params.accommodations.length)
            qs.append('accommodations', params.accommodations.join(','));
        if (params.codes && params.codes.length)
            qs.append('codes', params.codes.join(','));
        if (params.types && params.types.length)
            qs.append('types', params.types.join(','));
        const url = `${this.baseUrl}/api/accommodation_prices/price_grid?${qs.toString()}`;
        console.error('priceGrid URL:', url);
        return this.safeFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token} `,
                'Accept': 'application/json'
            }
        });
    }
}
