# Documentación de endpoint(s) relacionados con "accommodation-prices"

Fuente: http://localhost/alojar/public/docs?api-docs.json

Generado: 2025-10-13T13:10:45.650Z

## Ruta: `/api/accommodation_prices`

### GET `/api/accommodation_prices`

**Resumen:** Listar precios de alojamiento

**Tags:** AccommodationPrice

**Responses:**

- **200**: Lista de precios

**operationId:** 7fe1dcf0ab07fbf96e209d17228b59ae

---

### POST `/api/accommodation_prices`

**Resumen:** Crear precio de alojamiento

**Tags:** AccommodationPrice

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/AccommodationPrice"
}
```

**Responses:**

- **200**: Precio creado

**operationId:** 859dbdcb905d7f1b4a047810053796eb

---

## Ruta: `/api/accommodation_prices/price_grid`

### GET `/api/accommodation_prices/price_grid`

**Resumen:** Listar precios de alojamiento

**Tags:** AccommodationPrice

**Parámetros:**

- **hotel_id** (query) **required** — integer
- **accommodations** (query) — array
- **codes** (query) — array
- **types** (query) — array
- **date_from** (query) **required** — string
- **date_to** (query) **required** — string

**Responses:**

- **200**: Lista de precios

**operationId:** b79b6cd3167d116d53c6638f52cc9a36

---

## Ruta: `/api/accommodation_prices/{id}`

### GET `/api/accommodation_prices/{id}`

**Resumen:** Obtener precio de alojamiento por ID

**Tags:** AccommodationPrice

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Precio encontrado

**operationId:** 53c85b020f60eeac7d4c8d19c1a97618

---

### PUT `/api/accommodation_prices/{id}`

**Resumen:** Actualizar precio de alojamiento

**Tags:** AccommodationPrice

**Parámetros:**

- **id** (path) **required** — integer

**Request Body:**

- Content-Type: `application/json`

```json
{
  "$ref": "#/components/schemas/AccommodationPrice"
}
```

**Responses:**

- **200**: Precio actualizado

**operationId:** 01d4ef5900d40aeea3fc795de8d4f9e7

---

### DELETE `/api/accommodation_prices/{id}`

**Resumen:** Eliminar precio de alojamiento

**Tags:** AccommodationPrice

**Parámetros:**

- **id** (path) **required** — integer

**Responses:**

- **200**: Precio eliminado

**operationId:** df10c96ef6592e82cfc5bd43d506d440

---

