# Guía: Tool `create_booking`

## Descripción

La tool `create_booking` crea una nueva reserva en el sistema ALOJAR. Gestiona automáticamente:
- Validación de campos requeridos
- Cálculo automático de precios y número de noches
- Soporte para huéspedes existentes (`guest_id`) o nuevos (con datos en `guest`)
- Asignación automática del hotel (Hotel CasaBlanca Las Grutas)

## Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `date_in` | string | Fecha de check-in (ISO 8601: `2024-09-25T03:00:00.000Z`) |
| `date_out` | string | Fecha de check-out (ISO 8601: `2024-09-29T03:00:00.000Z`) |
| `pax` | number | Número total de huéspedes (> 0) |
| `accommodations` | array | Al menos una acomodación con `id` y `price` |

**Además, una de estas dos opciones:**
- `guest_id`: ID de un huésped existente
- `guest`: Objeto con datos del huésped (requiere al menos `name` y `email`)

## Campos Opcionales

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `pax_adult` | number | Número de adultos | `pax` |
| `pax_minor` | number | Número de menores | `0` |
| `numberOfNights` | number | Número de noches | Calculado automáticamente |
| `booking_state_id` | number | ID del estado de reserva | `1` |
| `booking_state` | object | Objeto con estado detallado | - |
| `list_price` | number | Precio de lista | Suma de precios de acomodaciones |
| `booking_price` | number | Precio de reserva | `list_price - discount` |
| `total_price` | number | Precio total | `booking_price + additional_price + garage_price` |
| `discount` | number | Descuento | `0` |
| `additional_price` | number | Cargos adicionales | `0` |
| `garage_price` | number | Precio de garaje | `0` |
| `garage_nro` | number | Número de garaje | - |
| `garage_selected` | boolean | ¿Garaje seleccionado? | `false` |
| `booking_discounts` | array | Array de descuentos | `[]` |
| `drawed` | boolean | ¿Ya pagado? | `false` |

## Estructura de Acomodación

```typescript
{
    id: number,                    // Requerido: ID de la acomodación
    distribution_doubles?: number, // Camas dobles
    distribution_singles?: number, // Camas simples
    distribution_cribs?: number,   // Cunas
    price: number                  // Requerido: Precio
}
```

## Estructura de Huésped

```typescript
{
    id?: number,           // ID (solo si existe)
    name: string,          // Requerido si es nuevo
    email: string,         // Requerido si es nuevo
    phone?: string,
    dni?: string,
    address?: string,
    city_id?: number,
    birthday?: string      // YYYY-MM-DD
}
```

## Estructura de Estado de Reserva

```typescript
{
    action?: string,              // ej: "deposit", "pending"
    name?: string,                // ej: "new", "confirmed"
    color?: string,               // ej: "#fcfb7c"
    hotel_booking_state_id?: number
}
```

## Ejemplos

### Ejemplo 1: Crear reserva con huésped existente

```json
{
    "guest_id": 1,
    "date_in": "2024-09-25T03:00:00.000Z",
    "date_out": "2024-09-29T03:00:00.000Z",
    "pax": 1,
    "accommodations": [
        {
            "id": 3,
            "distribution_doubles": 1,
            "distribution_singles": 2,
            "price": 430000
        }
    ],
    "booking_state": {
        "action": "deposit",
        "name": "new",
        "color": "#fcfb7c",
        "hotel_booking_state_id": 1
    }
}
```

**Respuesta exitosa:**
```
✅ Reserva creada correctamente

**ID de Reserva:** 12345
**Check-in:** 2024-09-25T03:00:00.000Z
**Check-out:** 2024-09-29T03:00:00.000Z
**Huéspedes:** 1
**Precio Total:** $430000
```

### Ejemplo 2: Crear reserva con huésped nuevo

```json
{
    "guest": {
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "phone": "2920111111",
        "dni": "30123456",
        "city_id": 1
    },
    "date_in": "2024-10-15T00:00:00.000Z",
    "date_out": "2024-10-18T00:00:00.000Z",
    "pax": 2,
    "pax_adult": 2,
    "pax_minor": 0,
    "accommodations": [
        {
            "id": 5,
            "distribution_doubles": 1,
            "price": 550000
        }
    ],
    "discount": 50000,
    "garage_selected": true,
    "garage_price": 30000,
    "booking_state": {
        "action": "confirmed",
        "name": "confirmed",
        "color": "#7cfc7c"
    }
}
```

**Cálculos automáticos:**
- `numberOfNights`: 3 (18 - 15)
- `list_price`: 550000
- `booking_price`: 500000 (550000 - 50000)
- `total_price`: 530000 (500000 + 0 + 30000)

### Ejemplo 3: Reserva múltiple

```json
{
    "guest_id": 2,
    "date_in": "2024-11-01T00:00:00.000Z",
    "date_out": "2024-11-05T00:00:00.000Z",
    "pax": 4,
    "pax_adult": 2,
    "pax_minor": 2,
    "accommodations": [
        {
            "id": 1,
            "distribution_doubles": 1,
            "price": 400000
        },
        {
            "id": 2,
            "distribution_singles": 2,
            "price": 300000
        }
    ],
    "additional_price": 50000,
    "garage_price": 0
}
```

**Cálculos:**
- `numberOfNights`: 4
- `list_price`: 700000 (400000 + 300000)
- `booking_price`: 700000
- `total_price`: 750000 (700000 + 50000)

## Validaciones

La tool realiza las siguientes validaciones:

1. ✅ `date_in` y `date_out` son obligatorios y en formato ISO 8601
2. ✅ Al menos una acomodación debe estar presente
3. ✅ `pax` debe ser mayor a 0
4. ✅ Si no hay `guest_id`, se requiere `guest` con `name` y `email`
5. ✅ Conversión automática de strings a números cuando es posible

## Errores Comunes

| Problema | Solución |
|----------|----------|
| "Error: Se requieren date_in y date_out" | Verificar formato ISO 8601 (ej: `2024-09-25T03:00:00.000Z`) |
| "Error: Se requiere al menos una acomodación" | Incluir array `accommodations` con al menos un objeto |
| "Error: Se requiere pax > 0" | Verificar que `pax` sea un número mayor a cero |
| "Error: No se proporciona guest_id. Se requiere información del huésped" | Proporcionar `guest_id` O incluir `guest` con `name` y `email` |

## Logging

La operación genera logs en los siguientes momentos:
- **Inicio**: "Iniciando creación de reserva | guest_id=... | check-in=... | accommodations=..."
- **Éxito**: "Reserva creada exitosamente con ID: XXXXX"
- **Error**: "Error creando reserva: [mensaje de error]"

Los logs se pueden consultar en el endpoint `/api/chat/logs/stream/:sessionId` en el dashboard.
