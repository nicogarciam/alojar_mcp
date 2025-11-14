// services/booking.service.ts
import { config } from "../../env.js";
import { AuthConfig } from "./config.js";



/**
 * Servicio para gestionar reservas (bookings)
 * Implementa createBooking (POST /api/bookings) y utilidades mínimas.
 */
export class BookingService {
    private baseUrl: string;
    private token: string;

    constructor(customConfig?: Partial<AuthConfig>) {
        this.baseUrl = customConfig?.baseUrl || config.baseUrl!;
        this.token = customConfig?.token || config.token!;

        if (!this.token || !this.baseUrl) {
            throw new Error('Faltan variables de entorno requeridas: ALOJAR_API_TOKEN y ALOJAR_API_BASE_URL');
        }
    }

    private ensureNumber(v: any) {
        if (typeof v === 'number') return v;
        const n = Number(v);
        return Number.isNaN(n) ? v : n;
    }

    private async safeFetch(url: string, opts: RequestInit = {}) {
        const res = await fetch(url, opts);
        const text = await res.text().catch(() => '');
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText} ${text ? '- ' + text : ''}`);
        }
        try {
            return JSON.parse(text || '{}');
        } catch {
            return text;
        }
    }

    /**
     * Crear una nueva reserva.
     * Acepta el body tal como aparece en booking.md. Convierte campos numéricos que vengan como string.
     */
    async createBooking(payload: Record<string, any>): Promise<any> {
        try {
            // Normalizar campos numéricos comunes
            const numericKeys = ['id', 'hotel_id', 'guest_id', 'booking_state_id', 'payment_state_id', 'pax', 'pax_adult', 'pax_minor', 'accommodation_count', 'days_to_confirm', 'days_to_cancel', 'total_price', 'booking_price', 'additional_price', 'list_price', 'garage_price', 'garage_nro', 'customer_id'];
            for (const k of numericKeys) {
                if (k in payload) payload[k] = this.ensureNumber(payload[k]);
            }

            const url = `${this.baseUrl}/api/bookings`;
            const result = await this.safeFetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return result;
        } catch (err) {
            console.error('Error createBooking:', err);
            throw err;
        }
    }

    /**
     * Obtiene una reserva por su ID
     * @param bookingId - id numérico o string convertible a número
     */
    async getBooking(bookingId: number | string): Promise<any> {
        try {
            const id = this.ensureNumber(bookingId);
            const url = `${this.baseUrl}/api/bookings/${id}`;
            return await this.safeFetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (err) {
            console.error('Error getBooking:', err);
            throw err;
        }
    }

    /**
     * Lista reservas con filtros opcionales
     * @param query - { hotel_id?, date_from?, date_to?, pax?, page?, limit? }
     */
    async listBookings(query: Record<string, any> = {}): Promise<any> {
        try {
            const params = new URLSearchParams();
            for (const k of Object.keys(query)) {
                if (query[k] === undefined || query[k] === null) continue;
                params.append(k, String(query[k]));
            }
            const url = `${this.baseUrl}/api/bookings${params.toString() ? '?' + params.toString() : ''}`;
            return await this.safeFetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (err) {
            console.error('Error listBookings:', err);
            throw err;
        }
    }

    /**
     * Actualiza una reserva por ID (PUT/PATCH según API)
     * @param bookingId
     * @param data
     */
    async updateBooking(bookingId: number | string, data: Record<string, any>): Promise<any> {
        try {
            const id = this.ensureNumber(bookingId);
            const url = `${this.baseUrl}/api/bookings/${id}`;
            return await this.safeFetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (err) {
            console.error('Error updateBooking:', err);
            throw err;
        }
    }

    /**
     * Cancela (elimina) una reserva por ID
     * @param bookingId
     */
    async cancelBooking(bookingId: number | string): Promise<any> {
        try {
            const id = this.ensureNumber(bookingId);
            const url = `${this.baseUrl}/api/bookings/${id}`;
            return await this.safeFetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (err) {
            console.error('Error cancelBooking:', err);
            throw err;
        }
    }
}