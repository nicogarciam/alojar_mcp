// services/availability.service.ts
import { config } from "../../env.js";
import { AuthConfig } from "./config.js";
import { AvailabilityRequest, AvailabilityResponse } from "./models/index.js";



/**
 * Servicio para consultar disponibilidad de alojamientos
 * Proporciona métodos para verificar disponibilidad usando la API
 */
export class AvailabilityService {
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

    /**
     * Consulta la disponibilidad de alojamientos para un hotel y período específico
     * @param request - Parámetros de la consulta de disponibilidad
     * @returns Promise con la respuesta de disponibilidad
     * @throws Error si la consulta falla o la respuesta no es exitosa
     */
    async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
        try {
            // Construir URL con parámetros de consulta
            const queryParams = new URLSearchParams({
                hotel_id: request.hotel_id.toString() || '2',
                opt: request.opt.toString() || '1',
                date_from: request.date_from,
                date_to: request.date_to,
                pax: request.pax.toString()
            });

            const url = `${this.baseUrl}/api/accommodations/availability?${queryParams}`;


            console.error(`Consultando disponibilidad: ${url}`);

            // Realizar la solicitud HTTP
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            // Parsear y retornar la respuesta
            const data: AvailabilityResponse = await response.json();
            //console.error('Respuesta de disponibilidad recibida:', data);
            return data;

        } catch (error) {
            console.error('Error en consulta de disponibilidad:', error);
            throw new Error(`No se pudo consultar la disponibilidad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }

    /**
     * Método simplificado para consulta rápida de disponibilidad
     * @param hotelId - ID del hotel
     * @param checkIn - Fecha de check-in (YYYY-MM-DD)
     * @param checkOut - Fecha de check-out (YYYY-MM-DD)
     * @param guests - Número de huéspedes
     * @param option - Opción de búsqueda (por defecto 1)
     * @returns Promise con la respuesta de disponibilidad
     */
    async quickAvailability(
        hotelId: number,
        checkIn: string,
        checkOut: string,
        guests: number,
        option: number = 1
    ): Promise<AvailabilityResponse> {
        const request: AvailabilityRequest = {
            hotel_id: hotelId,
            opt: option,
            date_from: checkIn,
            date_to: checkOut,
            pax: guests
        };

        console.log('Solicitud rápida de disponibilidad:', request);

        return this.checkAvailability(request);
    }

    /**
     * Verifica si hay alojamientos completamente disponibles (sin restricciones)
     * @param response - Respuesta de disponibilidad
     * @returns true si hay alojamientos completamente disponibles
     */
    hasFullAvailability(response: AvailabilityResponse): boolean {
        return response.availables_count > 0;
    }

    /**
     * Obtiene la lista de alojamientos con sus capacidades
     * @param response - Respuesta de disponibilidad
     * @returns Array con nombre y capacidad de cada alojamiento disponible
     */
    getAvailableAccommodations(response: AvailabilityResponse): Array<{ name: string, capacity: number }> {
        return response.availables.map(acc => ({
            name: acc.name,
            capacity: acc.capacity,
            code: acc.code,
            description: acc.description
        }));
    }
}