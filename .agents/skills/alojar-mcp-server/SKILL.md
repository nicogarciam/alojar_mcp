---
name: alojar-mcp-server
description: Guía y directrices tecnológicas para desarrollar y extender el servidor MCP de alojamientos.
---

# Desarrollo del Servidor MCP

Este skill se enfoca en cómo contribuir y modificar el directorio `server/`.

## Stack y Tecnologías Core
- **Model Context Protocol (MCP)**: Utiliza `@modelcontextprotocol/sdk`. El transporte por defecto es HTTP con Server-Sent Events (SSE) a través de `StreamableHTTPServerTransport`.
- **Node.js (18+) y TypeScript**: Mantener un tipado estricto.
- **Zod**: Toda validación de los esquemas de entrada de las MCP Tools debe hacerse utilizando `Zod` (ej: `z.object({...})`).
- **Express**: Framework utilizado para levantar la API REST que expone los endpoints HTTP y SSE.

## Pasos para agregar una nueva Tool
1. Define los esquemas de entrada utilizando Zod.
2. Registra la nueva herramienta dentro de la configuración del servidor en `server/src/servers/`.
3. Maneja los errores de negocio mapeándolos a códigos de error estándar (JSON-RPC) para que el cliente (chat) no se caiga de forma inesperada.

## Logs
Revisa siempre la guía principal de loggeo para seguir las prácticas acordadas del repositorio.
