import { config } from "../../env.js";
import { AuthConfig } from "./config.js";

/**
 * Servicio para gestionar usuarios (/api/users)
 */
export class UserService {
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
     * Lista usuarios con filtros opcionales (?q, ?skip, ?limit)
     */
    async listUsers(query: { q?: string; skip?: number; limit?: number } = {}): Promise<any> {
        const params = new URLSearchParams();
        if (query.q) params.append('q', query.q);
        if (typeof query.skip === 'number') params.append('skip', String(query.skip));
        if (typeof query.limit === 'number') params.append('limit', String(query.limit));

        const url = `${this.baseUrl}/api/users${params.toString() ? '?' + params.toString() : ''}`;
        return this.safeFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Crea un nuevo usuario.
     * El backend completará campos como id, created_at, updated_at.
     */
    async createUser(payload: {
        name: string;
        email: string;
        role?: string;
        first_login?: boolean;
        logins?: number;
        google_id?: string;
        picture?: string;
        cash_account_id?: number;
    }): Promise<any> {
        const url = `${this.baseUrl}/api/users`;
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

