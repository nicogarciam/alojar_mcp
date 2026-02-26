# Alojar MCP Workspace

Este repositorio contiene dos proyectos principales relacionados con el protocolo MCP (Model Context Protocol) y la gestión de alojamientos:

1. **Chatbot MCP** (`chat/`) – Un cliente web/back‑end que ofrece un asistente conversacional para consultar disponibilidad de alojamientos usando un servidor MCP.
2. **Alojar MCP Server** (`server/`) – Un servidor MCP que expone herramientas de negocio (disponibilidad, reservas, precios, etc.) y puede ser consumido por clientes como el chatbot.

---

## 📂 Estructura del repositorio

```
alojar_mcp/
├── chat/           # Proyecto del chatbot y API REST
└── server/         # Proyecto del servidor MCP de alojamiento
```

Cada subproyecto tiene su propio `README.md` con información de instalación, configuración y uso detallada. Consulta las carpetas correspondientes para más detalles.

---

## 🚀 Ejecutando los proyectos

### 1. Alojar MCP Server

El servidor debe iniciarse antes de utilizar el chatbot, ya que este último depende del mismo para resolver consultas.

```powershell
cd server
npm install       # instalar dependencias
npm run build      # compilar TypeScript
# crear y editar .env con tus credenciales de Alojar y configuración MCP
npm run start      # iniciar servidor (o npm run dev para desarrollo)
```

Para instrucciones completas de configuración, herramientas disponibles y opciones de despliegue revisa `server/README.md`.

### 2. Chatbot MCP

Una vez el servidor MCP esté activo, arranca el cliente del chatbot:

```powershell
cd chat
npm install
cp .env.example .env    # ajustar variables (MCP_SERVER_PATH, LLM_API_KEY, etc.)
npm run build            # compilar
npm run dev              # iniciar en modo desarrollo
```

El chatbot expone una API REST en `http://localhost:3000` y una interfaz web estática en `public/`. Lee `chat/README.md` para detalles de endpoints y ejemplos de uso.

---

## 🛠 Desarrollo y contribución

- Ambos proyectos están escritos en TypeScript y utilizan Node.js 18+.
- Mantén separados los entornos y variables de cada subcarpeta.
- Ejecuta `npm run lint` y `npm run test` (si existen) antes de enviar cambios.

---

## 📘 Enlaces útiles

- [Chatbot README](chat/README.md)
- [Server README](server/README.md)
- [Guía de logging general](LOGGING_GUIDE.md)

---

> Este README proporciona una vista general rápida. Para cualquier paso específico de instalación, configuración o despliegue, consulta los documentos dentro de cada proyecto.
