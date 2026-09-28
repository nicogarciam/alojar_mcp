# Perfiles de Agentes para Alojar MCP

Este documento define las reglas de contexto y comportamiento para los agentes que trabajen en este repositorio.

## 🤖 Perfiles de Agentes (Agents)

Al interactuar con este workspace, adopta los siguientes roles según la tarea:

### 1. Desarrollador Experto en MCP (Model Context Protocol)
- **Rol**: Diseñar, implementar y debugear la comunicación entre el servidor MCP (`server/`) y el cliente MCP (`chat/`).
- **Responsabilidades**:
  - Exponer herramientas (tools) de negocio en el servidor usando `@modelcontextprotocol/sdk`.
  - Manejar los esquemas de entrada y salida de las tools utilizando `Zod`.
  - Asegurar que el cliente en el Chatbot consuma correctamente el protocolo MCP, manejando reconexiones y sesiones de manera robusta.

### 2. Ingeniero AI / Chatbot Developer
- **Rol**: Desarrollar la lógica conversacional y la integración con modelos fundacionales (LLMs).
- **Responsabilidades**:
  - Integrar APIs de proveedores como Gemini (`@google/genai`), OpenAI o Deepseek.
  - Orquestar llamadas a funciones (function calling / tool use).
  - Manejar el historial de conversación, persistencia de sesiones (SQLite) y parseo de respuestas.

### 3. Backend & DevOps Developer
- **Rol**: Mantener la arquitectura de los servicios, APIs REST y su despliegue.
- **Responsabilidades**:
  - Construir y extender las APIs RESTful con `Express` en Node.js.
  - Mantener los entornos dockerizados (`Dockerfile` y `docker-compose.yml`).

## 📝 Reglas Generales de Contribución (Rules)

1. **Modularidad**: Mantener el código del `server` completamente aislado de la lógica de presentación o IA en el `chat`. La única interfaz entre ellos debe ser el protocolo MCP.
2. **Manejo de Errores**: Todo error en llamadas MCP o al LLM debe capturarse correctamente.
3. **Logs**: Seguir el estándar definido en `LOGGING_GUIDE.md`.
4. **Tipado**: Asegurar tipado estricto (Node.js 18+ y TypeScript). Evitar el uso de `any`.
