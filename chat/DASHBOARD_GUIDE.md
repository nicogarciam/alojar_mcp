# Dashboard de Sesiones - Guía de Uso

## Descripción

El dashboard proporciona una interfaz en tiempo real para monitorear y depurar sesiones de chat. Muestra un listado de todas las sesiones con su estado (activa/cerrada) y permite visualizar los eventos en tiempo real.

## Acceso

Abre tu navegador en:
```
http://localhost:3000/dashboard.html
```

## Características

### 1. Panel de Sesiones (Izquierda)
- **Listado de sesiones**: Muestra todas las sesiones activas y cerradas
- **Estado de sesión**: Indica si la sesión está `● Active` (verde) o `● Closed` (rojo)
- **Contador de eventos**: Muestra el número de eventos registrados en cada sesión
- **Auto-actualización**: Se actualiza automáticamente cada 5 segundos
- **Clic para seleccionar**: Haz clic en una sesión para cargar sus eventos

### 2. Controles (Centro-Superior)
- **Input de Session ID**: Ingresa el ID de sesión que deseas monitorear (por defecto: `default`)
- **🔄 Refresh**: Actualiza manualmente el listado de sesiones
- **▶ Stream**: Comienza a escuchar eventos en tiempo real (SSE) para la sesión actual
- **⏹ Stop**: Detiene la transmisión de eventos
- **📥 Load**: Carga los eventos previos de la sesión (no reinicia en tiempo real)

### 3. Área de Eventos (Centro-Principal)
- **Tipo de evento**: Muestra el tipo (USER_MESSAGE, LLM_RESPONSE, TOOL_CALL, TOOL_RESULT, ERROR, SESSION_END, etc.)
- **Timestamp**: Hora exacta del evento
- **Datos del evento**: JSON formateado con los detalles completos

## Flujo de Uso Típico

1. **Abre el dashboard**: Navega a `http://localhost:3000/dashboard.html`
2. **Observa las sesiones**: El panel izquierdo se actualiza cada 5 segundos
3. **Selecciona una sesión**: Haz clic en una sesión del listado o ingresa su ID manualmente
4. **Elige tu modo de visualización**:
   - **Modo histórico**: Haz clic en **📥 Load** para ver todos los eventos pasados
   - **Modo en tiempo real**: Haz clic en **▶ Stream** para ver nuevos eventos conforme suceden
5. **Inspecciona eventos**: Los eventos aparecen en orden inverso (más recientes primero)

## Estados de Sesión

- **● Active** (verde): La sesión está en curso, puede recibir nuevos eventos
- **● Closed** (rojo): La sesión ha terminado (se registró un evento SESSION_END)

## Ejemplo de Flujo

1. Usuario envía mensaje en el chatbot
2. Se registra evento `USER_MESSAGE` en dashboard
3. LLM procesa el mensaje → evento `LLM_RESPONSE`
4. Se ejecutan herramientas → eventos `TOOL_CALL` y `TOOL_RESULT`
5. Chatbot responde al usuario

## Endpoint API

Si deseas consultar las sesiones programáticamente:

```bash
# Obtener listado de sesiones
GET /api/chat/sessions

# Respuesta:
{
  "status": "ok",
  "sessionCount": 3,
  "sessions": [
    {
      "sessionId": "default",
      "status": "active",
      "eventCount": 15,
      "lastActivity": "2025-11-17T10:30:45.123Z"
    },
    {
      "sessionId": "user-123",
      "status": "closed",
      "eventCount": 8,
      "lastActivity": "2025-11-17T10:25:30.456Z"
    }
  ]
}
```

## Notas

- Los eventos se mantienen en memoria durante la sesión del servidor
- Los logs también se persisten a archivos JSONL en la carpeta `logs/`
- Opcionalmente, puedes habilitar persistencia a SQLite (requiere `npm install better-sqlite3`)
- Los eventos se agrupan por `sessionId` para facilitar el seguimiento

## Solución de Problemas

- **Dashboard en blanco**: Verifica que el servidor esté corriendo y accesible en `localhost:3000`
- **No aparecen sesiones**: Envía un mensaje en el chatbot para crear una sesión y sus eventos
- **No se actualizan eventos**: Haz clic en **🔄 Refresh** para forzar una actualización manual
- **SSE no funciona**: Algunos proxies pueden bloquear Server-Sent Events; intenta cargar con **📥 Load** en su lugar
