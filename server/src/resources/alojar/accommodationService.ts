// services/availability.service.ts
import { config } from "../../env.js";
import { AuthConfig } from "./config.js";
import { AvailabilityRequest, AvailabilityResponse } from "./models/index.js";


export class AccommodationService {
    private baseUrl: string;
    private token: string;

    /**
     * Constructor del servicio de disponibilidad
     * @param config - Configuración con token y URL base
     */
    constructor(customConfig?: Partial<AuthConfig>) {
        this.baseUrl = customConfig?.baseUrl || config.baseUrl!;
        this.token = customConfig?.token || config.token!;

        // Validar que tenemos los valores requeridos
        if (!this.token || !this.baseUrl) {
            throw new Error('Faltan variables de entorno requeridas: ALOJAR_API_TOKEN y ALOJAR_API_BASE_URL');
        }
    }

    async getAccommodationDetail(id: number): Promise<any> {
        try {
            const url = `${this.baseUrl}/api/accommodations/${id}`;
            console.error(`Consultando detalle de alojamiento: ${url}`);

            // Realizar la solicitud HTTP
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`Error en la respuesta de la API: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error obteniendo detalle de alojamiento:', error);
            throw error;
        }
    }
}