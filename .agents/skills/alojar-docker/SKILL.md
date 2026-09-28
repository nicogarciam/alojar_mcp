---
name: alojar-docker
description: Instrucciones y mejores prácticas para manejar la infraestructura dockerizada del proyecto Alojar MCP.
---

# Infraestructura y Despliegue con Docker

Este skill se enfoca en la orquestación de servicios en el ecosistema Alojar MCP.

## Componentes Dockerizados
1. **Chatbot** (`chat/Dockerfile`): Expuesto en el puerto 3000.
2. **Servidor MCP** (`server/Dockerfile`): Expuesto en el puerto 3001.

## Guía de Uso
- Para levantar el entorno de desarrollo con logs unificados, usa `docker-compose up --build`.
- Para la comunicación entre contenedores, asegúrate de que el chatbot apunte al nombre del servicio Docker (ej. `http://server:3001/mcp`) en la variable de entorno `MCP_SERVER_URL` definida en `docker-compose.yml`.
- Usa las imágenes base ligeras (ej. `node:18-alpine`) para minimizar tiempos de build.
- Ambos contenedores están configurados para correr `npm run build` seguido de `npm start`.
