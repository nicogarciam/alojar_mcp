import { config } from "../../env.js";
import { AuthConfig } from "./config.js";

/**
 * Servicio para gestionar clientes (/customers)
 */
export class CustomerService {
    private baseUrl: string;
    private token: string;

    constructor(customConfig?: Partial<AuthConfig>) {
        this.baseUrl = customConfig?.baseUrl || config.baseUrl!;
        this.token = customConfig?.token || config.token!;

        if (!this.token || !this.baseUrl) {
            throw new Error('Faltan variables de entorno requeridas: ALOJAR_API_TOKEN y ALOJAR_API_BASE_URL');
        }
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
     * Lista todos los clientes.
     * @param query - { q?: string }
     */
    async listCustomers(query: { q?: string } = {}): Promise<any> {
        const params = new URLSearchParams();
        if (query.q) params.append('q', query.q);
        const url = `${this.baseUrl}/api/customers${params.toString() ? '?' + params.toString() : ''}`;
        return this.safeFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Crea un nuevo cliente.
     * El backend completará campos como id, created_at, updated_at, deleted_at.
     */
    async createCustomer(payload: {
        name: string;
        cuil?: string;
        contact_name?: string;
        email: string;
        phone?: string;
        address?: string;
        token?: string;
        password?: string;
        city_id?: number;
        photo?: string;
    }): Promise<any> {
        const url = `${this.baseUrl}/api/customers`;
        return this.safeFetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    }
}

