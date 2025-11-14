# Documentación de endpoint(s) relacionados con "booking"

Fuente: http://localhost/alojar/public/docs?api-docs.json

Generado: 2025-10-13T00:21:26.997Z


## Ruta: `/api/bookings`

### GET `/api/bookings`

**Resumen:** Listar reservas

**Tags:** Bookings

**Parámetros:**

- **states** (query) — string
- **date_from** (query) — string
- **date_to** (query) — string
- **hotel_id** (query) — integer
- **accommodations** (query) — string
- **filter_state** (query) — string

**Responses:**

- **200**: Lista de reservas

**operationId:** f801833e5c8dc9915f5a6f2da2c67db3

---

### POST `/api/bookings`

**Resumen:** Crear una nueva reserva

**Tags:** Bookings

**Request Body:**

- Content-Type: `application/json`

```json
{
  "id": 0,
  "hotel_id": 0,
  "guest_id": 0,
  "booking_state_id": 0,
  "payment_state_id": 0,
  "date_in": "2025-10-13",
  "date_out": "2025-10-13",
  "note": "string",
  "pax": 0,
  "pax_adult": 0,
  "pax_minor": 0,
  "accommodation_count": 0,
  "coupon_code": "string",
  "days_to_confirm": 0,
  "days_to_cancel": 0,
  "total_price": 0,
  "booking_price": 0,
  "additional_price": 0,
  "price_note": "string",
  "code": "string",
  "list_price": 0,
  "garage_price": 0,
  "garage_nro": 0,
  "garage_selected": true,
  "garage_licence_plate": "string",
  "customer_id": 0,
  "user": "string",
  "discount": "string",
  "days": [
    "2025-10-13"
  ],
  "booking_state": {},
  "created_at": "2025-10-13T00:35:45.652Z",
  "updated_at": "2025-10-13T00:35:45.652Z"
}
```

**Responses:**

- **200**: Reserva creada

**operationId:** 7cd9ca9f894ef7fcf05854cf54d534cb

---

## Ruta: `/api/bookings/code/{id}`

### GET `/api/bookings/code/{id}`

**Resumen:** Generar código de reserva

**Tags:** Bookings

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Código generado

**operationId:** fd765b6019a8c396a048ad0aff1a001c

---

## Ruta: `/api/bookings/validate-code-owner`

### POST `/api/bookings/validate-code-owner`

**Resumen:** Validar código y email de reserva

**Tags:** Bookings

**Request Body:**

- Content-Type: `application/json`

```json
{
  "properties": {
    "booking_code": {
      "type": "string"
    },
    "email": {
      "type": "string"
    }
  },
  "type": "object"
}
```

**Responses:**

- **200**: Validación de código y email

**operationId:** aa7216dbb345a71670b1bfed8e5ed7af

---

## Ruta: `/api/bookings/{id}`

### GET `/api/bookings/{id}`

**Resumen:** Obtener una reserva por ID

**Tags:** Bookings

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Reserva encontrada

- **404**: Reserva no encontrada

**operationId:** 1e306780287e46aa4f0bb48cdf981a41

---

### PUT `/api/bookings/{id}`

**Resumen:** Actualizar una reserva

**Tags:** Bookings

**Parámetros:**

- **id** (path) **required** — integer

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/Booking"
}
```

**Responses:**

- **200**: Reserva actualizada

- **404**: Reserva no encontrada

**operationId:** 21c817313afdaae836c6c933697bdf28

---

## Ruta: `/api/bookings/webcheckin/{bookingId}`

### PUT `/api/bookings/webcheckin/{bookingId}`

**Resumen:** Actualizar reserva desde web check-in

**Tags:** Bookings

**Parámetros:**

- **bookingId** (path) **required** — integer

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/Booking"
}
```

**Responses:**

- **200**: Reserva actualizada desde web check-in

**operationId:** ec697869aefcc598403e978fa79057a0

---

## Ruta: `/api/booking-guest-accommodations`

### GET `/api/booking-guest-accommodations`

**Resumen:** Listar asignaciones de huéspedes a habitaciones

**Tags:** BookingGuestAccommodation

**Responses:**

- **200**: Lista de asignaciones

**operationId:** 90160f0e06b40da0635320b8da53e1b3

---

### POST `/api/booking-guest-accommodations`

**Resumen:** Crear asignación de huésped a habitación

**Tags:** BookingGuestAccommodation

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/BookingGuestAccommodation"
}
```

**Responses:**

- **200**: Asignación creada

**operationId:** d490ad6f7bdb1dc79ce77bea347db77e

---

## Ruta: `/api/booking-guest-accommodations/update-room-accommodations`

### PUT `/api/booking-guest-accommodations/update-room-accommodations`

**Resumen:** Actualizar asignaciones de habitaciones

**Tags:** BookingGuestAccommodation

**Request Body:**

- Content-Type: `application/json`

```json
{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/BookingAccommodation"
  }
}
```

**Responses:**

- **200**: Asignaciones actualizadas

**operationId:** 9d53e48ec9e9fab161f6d761f12a36cd

---

## Ruta: `/api/booking-guest-accommodations/save-room-assignments`

### POST `/api/booking-guest-accommodations/save-room-assignments`

**Resumen:** Guardar asignaciones de habitaciones

**Tags:** BookingGuestAccommodation

**Request Body:**

- Content-Type: `application/json`

```json
{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/BookingGuestAccommodation"
  }
}
```

**Responses:**

- **200**: Asignaciones guardadas

**operationId:** 2f14359378a4c1147cce680cea08cf84

---

## Ruta: `/api/booking-guest-accommodations/{id}`

### GET `/api/booking-guest-accommodations/{id}`

**Resumen:** Obtener asignación por ID

**Tags:** BookingGuestAccommodation

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Asignación encontrada

**operationId:** 4a115a767b9811afdbfda42ceee39aaf

---

### PUT `/api/booking-guest-accommodations/{id}`

**Resumen:** Actualizar asignación de huésped a habitación

**Tags:** BookingGuestAccommodation

**Parámetros:**

- **id** (path) **required** — integer

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/BookingGuestAccommodation"
}
```

**Responses:**

- **200**: Asignación actualizada

**operationId:** d1dc471ab7459b461c894973a64fd4ea

---

### DELETE `/api/booking-guest-accommodations/{id}`

**Resumen:** Eliminar asignación de huésped a habitación

**Tags:** BookingGuestAccommodation

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Asignación eliminada

**operationId:** 2305edd55cedf08664fbd4e453a553fb

---

## Ruta: `/api/booking-states`

## GET `/api/booking-states`

**Resumen:** Listar estados de reserva

**Tags:** HotelBookingState

**Responses:**

- **200**: Lista de estados de reserva

**operationId:** c3f990cd6d050f6a9b6ce7a3fa168771

