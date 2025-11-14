// types/availability.types.ts

/**
 * Parámetros para la consulta de disponibilidad
 */
export interface AvailabilityRequest {
    hotel_id: number;      // ID del hotel a consultar
    opt: number;           // Opción de búsqueda (1 = disponibilidad básica)
    date_from: string;     // Fecha de check-in (formato: YYYY-MM-DD)
    date_to: string;       // Fecha de check-out (formato: YYYY-MM-DD)
    pax: number;          // Número de personas (huéspedes)
}

/**
 * Respuesta completa de disponibilidad
 */
export interface AvailabilityResponse {
    availables_count: number;    // Cantidad total de alojamientos disponibles
    availables: Accommodation[]; // Lista de alojamientos completamente disponibles
    options: AccommodationOption[]; // Lista de alojamientos con disponibilidad parcial
}

/**
 * Información de un alojamiento disponible
 */
export interface Accommodation {
    id: number;                   // ID único del alojamiento
    code: string;                 // Código interno del alojamiento
    name: string;                 // Nombre descriptivo del alojamiento
    description: string;          // Descripción detallada
    capacity_desc: string;        // Descripción de capacidad en texto
    capacity: number;             // Capacidad máxima de personas
    hotel_id: number;             // ID del hotel al que pertenece
    accommodation_type_id: number; // ID del tipo de alojamiento
    accommodation_state_id: number; // ID del estado del alojamiento
    created_at: string;           // Fecha de creación
    updated_at: string;           // Fecha de última actualización
    floor: number;                // Piso donde se encuentra
    deleted_at: string | null;    // Fecha de eliminación (si aplica)
    accommodation_prices: any[];  // Array de precios (puede definirse más específico)
    accommodation_type: AccommodationType; // Información del tipo de alojamiento
}

/**
 * Tipo de alojamiento con su distribución
 */
export interface AccommodationType {
    id: number;                   // ID del tipo de alojamiento
    name: string;                 // Nombre del tipo (ej: "Depto x6")
    color: string | null;         // Color asociado (para UI)
    created_at: string;           // Fecha de creación
    updated_at: string;           // Fecha de última actualización
    deleted_at: string | null;    // Fecha de eliminación
    hotel_id: number;             // ID del hotel
    max_capacity: number;         // Capacidad máxima
    capacity_desc: string;        // Descripción detallada de capacidad
    accommodation_distribution_id: number; // ID de distribución
    rooms: string;                // Tipo de habitaciones
    distribution: Distribution;   // Información de distribución de camas
}

/**
 * Distribución de camas en el alojamiento
 */
export interface Distribution {
    id: number;                   // ID de distribución
    name: string;                 // Nombre de la distribución
    distribution_doubles: number; // Cantidad de camas dobles/matrimoniales
    distribution_cribs: number;   // Cantidad de cunas
    distribution_singles: number; // Cantidad de camas simples
    accommodation_type_id: number; // ID del tipo de alojamiento
    deleted_at: string | null;    // Fecha de eliminación
    accommodation_type: null;     // Referencia al tipo (generalmente null)
}

/**
 * Opción de alojamiento con disponibilidad parcial
 */
export interface AccommodationOption {
    accommodation_id: number;     // ID del alojamiento
    accommodation_code: string;   // Código del alojamiento
    accommodation_name: string;   // Nombre del alojamiento
    accommodation_capacity: number; // Capacidad del alojamiento
    bookings: Booking[];          // Reservas existentes en el período
    available: AvailablePeriod[]; // Períodos disponibles dentro del rango
}

/**
 * Información de reservas existentes
 */
export interface Booking {
    booking_id: number;          // ID de la reserva
    date_in: string;             // Fecha de check-in de la reserva
    date_out: string;            // Fecha de check-out de la reserva
}

/**
 * Período disponible dentro del rango consultado
 */
export interface AvailablePeriod {
    from: string;                // Fecha inicial del período disponible
    to: string;                  // Fecha final del período disponible
}