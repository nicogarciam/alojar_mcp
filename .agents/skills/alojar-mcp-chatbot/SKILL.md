---
name: alojar-mcp-chatbot
description: Guía y directrices tecnológicas para desarrollar y extender el cliente Chatbot y su API.
---

# Desarrollo del Chatbot AI

Este skill se enfoca en cómo contribuir y modificar el directorio `chat/`.

## Stack y Tecnologías Core
- **Node.js y TypeScript**.
- **Cliente MCP**: Uso de `@modelcontextprotocol/sdk` (específicamente `StreamableHTTPClientTransport`) para consumir las herramientas expuestas por `server/`.
- **LLM Integrations**: Interacción con LLMs usando frameworks como `@google/genai`. Habilidad de inyectar las MCP Tools como `functions` en el LLM.
- **Persistencia**: Uso de `better-sqlite3` para almacenar historial de conversaciones y métricas. 
- **Express**: Expone la API REST (`POST /api/chat`) consumida por el frontend estático alojado en `public/`.

## Mejores Prácticas
1. **Llamado de Tools (Function Calling)**: Al interactuar con el LLM, parsear correctamente la respuesta, llamar a la Tool en el cliente MCP, y devolver los resultados al LLM en el formato que espera el proveedor.
2. **Resiliencia**: Si el cliente MCP se desconecta, intentar reconectar silenciosamente antes de fallarle al usuario final.
3. **Seguridad**: Asegurar el manejo seguro de llaves API (`.env`).
4. **Formateo**: Parsear la respuesta Markdown a HTML si se envía al frontend estático, o mantenerlo limpio en la API.
