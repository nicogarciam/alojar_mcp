
# Alojar MCP Server

Servidor MCP (Model Context Protocol) para la gestión integral de alojamientos, reservas y precios. Este proyecto implementa un servidor que expone herramientas para consultar disponibilidad, gestionar reservas, administrar precios y más, todo a través del protocolo MCP.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [API y Herramientas](#-api-y-herramientas)
- [Servicios](#-servicios)
- [Desarrollo](#-desarrollo)
- [Scripts Disponibles](#-scripts-disponibles)
- [Tecnologías](#-tecnologías)

## 🎯 Descripción

**Alojar MCP Server** es un servidor que implementa el protocolo MCP (Model Context Protocol) para integrarse con LLMs y otros clientes que soporten este estándar. El servidor proporciona acceso programático a un sistema de gestión de alojamientos, permitiendo:

- Consultar disponibilidad de alojamientos en tiempo real
- Crear, listar, actualizar y cancelar reservas
- Gestionar precios de alojamientos
- Obtener grillas de precios por fechas
- Recopilar información de usuarios/huéspedes

## ✨ Características

### Funcionalidades Principales

- **Consulta de Disponibilidad**: Verifica la disponibilidad de alojamientos por hotel, fechas y número de personas
- **Gestión de Reservas**: CRUD completo de reservas (crear, leer, actualizar, cancelar)
- **Gestión de Precios**: Administración de precios de alojamientos con soporte para grillas de precios
- **Streaming SSE**: Soporte para Server-Sent Events para notificaciones en tiempo real
- **Multi-sesión**: Manejo de múltiples sesiones concurrentes con IDs únicos
- **OAuth Opcional**: Soporte para autenticación OAuth (--oauth, --oauth-strict)
- **CORS Habilitado**: Permite peticiones desde cualquier origen (configurable)

### Protocolo MCP

- Implementación completa del protocolo MCP
- Registro de herramientas (tools)
- Registro de recursos (resources)
- Registro de prompts
- Soporte para transporte HTTP streaming (StreamableHTTPServerTransport)
- Soporte para transporte Stdio (StdioServerTransport)

## 🏗 Arquitectura

El proyecto está estructurado en las siguientes capas:

```
server/
├── src/
│   ├── main.ts                    # Punto de entrada - Servidor Express con MCP
│   ├── server.ts                  # Servidor demo básico
│   ├── env.ts                     # Configuración de variables de entorno
│   ├── servers/
│   │   ├── alojar.server.ts       # Servidor MCP Stdio
│   │   └── alojar-stream.server.ts # Servidor MCP Streaming HTTP
│   ├── tools/
│   │   └── alojar/                # Herramientas MCP
│   │       ├── check-availability.tool.ts
│   │       ├── create-booking.tool.ts
│   │       ├── get-booking.tool.ts
│   │       ├── list-bookings.tool.ts
│   │       ├── update-booking.tool.ts
│   │       ├── cancel-booking.tool.ts
│   │       ├── list-accommodation-prices.tool.ts
│   │       ├── create-accommodation-price.tool.ts
│   │       ├── get-accommodation-price.tool.ts
│   │       ├── update-accommodation-price.tool.ts
│   │       ├── delete-accommodation-price.tool.ts
│   │       ├── price-grid.tool.ts
│   │       ├── collect-user-info.tool.ts
│   │       ├── greet.tool.ts
│   │       └── register-all-tools.ts
│   ├── resources/
│   │   └── alojar/                # Servicios de negocio
│   │       ├── availabilityService.ts
│   │       ├── bookingService.ts
│   │       ├── priceService.ts
│   │       ├── config.ts
│   │       └── models/
│   └── prompts/
│       └── alojar/
│           └── greeting-template.prompt.ts
├── dist/                          # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

### Componentes Principales

#### 1. **main.ts** - Servidor Express con MCP Streaming
- Servidor Express en el puerto 3001 (configurable)
- Manejo de sesiones con UUID únicos
- Endpoints: POST /mcp, GET /mcp, DELETE /mcp
- Soporte para SSE (Server-Sent Events)
- Gestión de transportes por sesión

#### 2. **Servicios (Resources)**

**AvailabilityService** (`availabilityService.ts`)
- `checkAvailability()`: Consulta disponibilidad completa
- `quickAvailability()`: Consulta simplificada
- `hasFullAvailability()`: Verifica disponibilidad total
- `getAvailableAccommodations()`: Lista alojamientos disponibles

**BookingService** (`bookingService.ts`)
- `createBooking()`: Crear nueva reserva
- `getBooking()`: Obtener reserva por ID
- `listBookings()`: Listar reservas con filtros
- `updateBooking()`: Actualizar reserva
- `cancelBooking()`: Cancelar/eliminar reserva

**PriceService** (`priceService.ts`)
- `listPrices()`: Listar precios con filtros
- `createPrice()`: Crear precio de alojamiento
- `getPrice()`: Obtener precio por ID
- `updatePrice()`: Actualizar precio
- `deletePrice()`: Eliminar precio
- `priceGrid()`: Obtener grilla de precios por fechas

#### 3. **Herramientas MCP (Tools)**

Cada herramienta expone una funcionalidad específica a través del protocolo MCP:

- **check-availability**: Consultar disponibilidad de alojamientos
- **create-booking**: Crear una nueva reserva
- **get-booking**: Obtener detalles de una reserva
- **list-bookings**: Listar todas las reservas
- **update-booking**: Actualizar una reserva existente
- **cancel-booking**: Cancelar una reserva
- **list-accommodation-prices**: Listar precios de alojamientos
- **create-accommodation-price**: Crear precio de alojamiento
- **get-accommodation-price**: Obtener precio específico
- **update-accommodation-price**: Actualizar precio
- **delete-accommodation-price**: Eliminar precio
- **price-grid**: Obtener grilla de precios
- **collect-user-info**: Recopilar información del usuario
- **greet**: Saludar al usuario

## 🚀 Instalación

### Requisitos Previos

- Node.js >= 18.0.0
- npm >= 8.0.0
- Acceso a la API de Alojar (token y URL base)

### Pasos de Instalación

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd alojar_mcp/server
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Compilar TypeScript**:
```bash
npm run build
```

## ⚙ Configuración

### Variables de Entorno

Crear un archivo `.env` en la raíz del directorio `server/`:

```env
# Configuración de la API de Alojar
ALOJAR_API_TOKEN=tu_token_aqui
ALOJAR_API_BASE_URL=https://tu-servidor.com/alojar/public

# Configuración del servidor MCP
MCP_PORT=3001
MCP_AUTH_PORT=3002
NODE_ENV=development
```

### Descripción de Variables

- `ALOJAR_API_TOKEN`: Token Bearer para autenticación con la API de Alojar
- `ALOJAR_API_BASE_URL`: URL base de la API de Alojar
- `MCP_PORT`: Puerto donde escuchará el servidor MCP (por defecto: 3001)
- `MCP_AUTH_PORT`: Puerto para autenticación OAuth (por defecto: 3002)
- `NODE_ENV`: Entorno de ejecución (development/production/test)

### Configuración en Cursor/Claude Desktop

Para usar este servidor con Cursor o Claude Desktop, añadir a `mcp.json`:

```json
{
  "mcpServers": {
    "alojar": {
      "command": "node",
      "args": ["path/to/alojar_mcp/server/dist/main.js"],
      "env": {
        "ALOJAR_API_TOKEN": "tu_token_aqui",
        "ALOJAR_API_BASE_URL": "https://tu-servidor.com/alojar/public"
      }
    }
  }
}
```

## 📖 Uso

### Iniciar el Servidor

**Modo Desarrollo** (con auto-reload):
```bash
npm run dev
```

**Modo Producción**:
```bash
npm run build
npm start
```

**Con Docker**:
```bash
npm run docker:build
npm run docker:run
```

### Modo OAuth (Opcional)

```bash
node dist/main.js --oauth          # OAuth habilitado pero no obligatorio
node dist/main.js --oauth-strict   # OAuth obligatorio
```

### Probar el Servidor

Usar el inspector de MCP:
```bash
npx @modelcontextprotocol/inspector
```

O con debugging habilitado (PowerShell):
```powershell
$env:DEBUG="*"; npx @modelcontextprotocol/inspector
```

### Endpoints HTTP

Una vez iniciado, el servidor expone:

- **POST /mcp**: Inicialización y peticiones MCP
- **GET /mcp**: Stream SSE para notificaciones
- **DELETE /mcp**: Terminar sesión

Headers requeridos:
- `Content-Type: application/json`
- `mcp-session-id: <session-id>` (después de inicialización)

## 🛠 API y Herramientas

### Ejemplo de Uso: Consultar Disponibilidad

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "check_availability",
    "arguments": {
      "hotel_id": 2,
      "date_from": "2025-01-15",
      "date_to": "2025-01-20",
      "pax": 4
    }
  },
  "id": 1
}
```

### Ejemplo de Uso: Crear Reserva

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "create_booking",
    "arguments": {
      "hotel_id": 2,
      "guest_id": 123,
      "date_from": "2025-01-15",
      "date_to": "2025-01-20",
      "pax": 4,
      "pax_adult": 2,
      "pax_minor": 2,
      "accommodation_code": "APT-101",
      "total_price": 5000
    }
  },
  "id": 2
}
```

### Ejemplo de Uso: Obtener Grilla de Precios

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "price_grid",
    "arguments": {
      "hotel_id": 2,
      "date_from": "2025-01-01",
      "date_to": "2025-01-31",
      "accommodations": ["1", "2", "3"]
    }
  },
  "id": 3
}
```

## 🧪 Servicios

### AvailabilityService

Consulta la disponibilidad de alojamientos:

```typescript
const availabilityService = new AvailabilityService({
  token: 'YOUR_TOKEN',
  baseUrl: 'https://api.example.com'
});

const result = await availabilityService.quickAvailability(
  2,                    // hotel_id
  '2025-01-15',        // check-in
  '2025-01-20',        // check-out
  4                    // número de personas
);
```

### BookingService

Gestión completa de reservas:

```typescript
const bookingService = new BookingService({
  token: 'YOUR_TOKEN',
  baseUrl: 'https://api.example.com'
});

// Crear reserva
const booking = await bookingService.createBooking({
  hotel_id: 2,
  guest_id: 123,
  date_from: '2025-01-15',
  date_to: '2025-01-20',
  pax: 4
});

// Listar reservas
const bookings = await bookingService.listBookings({
  hotel_id: 2,
  date_from: '2025-01-01'
});

// Actualizar reserva
await bookingService.updateBooking(booking.id, {
  pax: 5
});

// Cancelar reserva
await bookingService.cancelBooking(booking.id);
```

### PriceService

Gestión de precios y grillas:

```typescript
const priceService = new PriceService({
  token: 'YOUR_TOKEN',
  baseUrl: 'https://api.example.com'
});

// Obtener grilla de precios
const grid = await priceService.priceGrid({
  hotel_id: 2,
  date_from: '2025-01-01',
  date_to: '2025-01-31',
  accommodations: [1, 2, 3]
});

// Crear precio
await priceService.createPrice({
  hotel_id: 2,
  accommodation_id: 1,
  date_from: '2025-01-15',
  date_to: '2025-01-20',
  price: 1000,
  list_price: 1200
});
```

## 💻 Desarrollo

### Estructura del Código

- **TypeScript**: Todo el código está escrito en TypeScript
- **ESM**: Usa módulos ES6 (type: "module" en package.json)
- **Zod**: Validación de esquemas con Zod
- **Express**: Framework web para endpoints HTTP
- **MCP SDK**: SDK oficial de Model Context Protocol

### Añadir una Nueva Herramienta

1. Crear archivo en `src/tools/alojar/mi-herramienta.tool.ts`
2. Exportar función `registerMiHerramientaTool(server: McpServer)`
3. Registrar en `src/servers/alojar-stream.server.ts`:

```typescript
import { registerMiHerramientaTool } from '../tools/alojar/mi-herramienta.tool.js';

// En getServer()
registerMiHerramientaTool(server);
```

### Añadir un Nuevo Servicio

1. Crear archivo en `src/resources/alojar/miServicio.ts`
2. Implementar clase con constructor que reciba `AuthConfig`
3. Añadir métodos que usen `fetch()` con autenticación Bearer
4. Usar en las herramientas según sea necesario

## 📜 Scripts Disponibles

```bash
npm run build              # Compilar TypeScript a JavaScript
npm run dev                # Modo desarrollo con auto-reload
npm start                  # Iniciar servidor (requiere build previo)
npm run build:frontend     # Compilar con config frontend
npm run docker:build       # Construir imagen Docker
npm run docker:run         # Ejecutar contenedor Docker
```

## 🔧 Tecnologías

### Dependencias Principales

- **@modelcontextprotocol/sdk** (^1.19.1): SDK oficial de MCP
- **express** (^5.0.1): Framework web
- **dotenv** (^17.2.3): Gestión de variables de entorno
- **zod** (^3.23.8): Validación de esquemas
- **cors** (^2.8.5): Middleware CORS
- **typescript** (^5.5.4): Lenguaje de programación

### Dependencias de Desarrollo

- **tsx** (^4.16.5): Ejecución TypeScript con watch
- **eslint** (^9.8.0): Linter de código
- **prettier** (3.6.2): Formateador de código
- **jest** (^29.7.0): Framework de testing

## 📝 Notas de Configuración

### Información de API (Ejemplo)

```
API Key: 9322ccce-0d68-4e69-a5c8-3d8829878f0a
Secret Key: B9D80DA22B857EB2CF1EEE9E4129CFD6
Nombre de la clave: mi_mcp
Permisos: Consultar
```

**⚠️ IMPORTANTE**: Estos valores son de ejemplo. Reemplázalos con tus credenciales reales en el archivo `.env`.

### Debug del Inspector MCP

```bash
# Bash/Linux/Mac
DEBUG="*" npx @modelcontextprotocol/inspector

# PowerShell
$env:DEBUG="*"; npx @modelcontextprotocol/inspector

# CMD
set DEBUG=* && npx @modelcontextprotocol/inspector
```

