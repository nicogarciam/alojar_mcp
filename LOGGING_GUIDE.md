# Guía de Logging de Sesiones de Chat

## Overview

Sistema completo y flexible de logging asincrónico para sesiones de chat. Captura:
- ✅ Mensajes del usuario
- ✅ Respuestas del LLM
- ✅ Llamadas a herramientas (tools)
- ✅ Resultados de herramientas
- ✅ Llamadas a APIs externas y sus respuestas
- ✅ Errores durante la sesión
- ✅ Duración de operaciones

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│ Chat Server (puerto 3000)                           │
│ ┌────────────────────────────────────────────────┐  │
│ │ AvailabilityAgent                              │  │
│ │ - Logs: USER_MESSAGE, LLM_RESPONSE, ERROR     │  │
│ └────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────┐  │
│ │ AlojarMCPClient                                │  │
│ │ - Logs: TOOL_CALL, TOOL_RESULT, API_RESPONSE │  │
│ └────────────────────────────────────────────────┘  │
│         ↓ (async queue, no-blocking)               │
│ ┌────────────────────────────────────────────────┐  │
│ │ SessionLogger (cola + flush async)            │  │
│ │ - Persistencia a archivo (JSONL)              │  │
│ │ - Directorio: ./logs                          │  │
│ └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Características

### 1. **No-Bloqueante**
- `logger.log()` devuelve inmediatamente (O(1) en cola)
- Flush asincrónico en background (intervalo: 5s por defecto)
- Sin impact en latencia de chat

### 2. **Flexible**
- Configuración por variables de entorno
- Soporte para múltiples backends (archivo, BD - extensible)
- Formato JSONL (una línea = un evento)

### 3. **Rastreable**
- Cada evento contiene: timestamp, type, sessionId, data, duration
- Correlación fácil por sessionId
- Información de duración para debugging de performance

## Configuración

Edita `.env` o pasa variables de entorno:

```env
# Directorio para guardar logs (default: ./logs)
LOGS_DIR=./logs

# Intervalo de flush en milisegundos (default: 5000)
LOG_FLUSH_INTERVAL=5000

# Log a consola durante desarrollo (default: false)
LOG_VERBOSE=true
```

## Tipos de Eventos Capturados

### USER_MESSAGE
```json
{
  "type": "USER_MESSAGE",
  "sessionId": "session-123",
  "data": {
    "message": "¿Disponibilidad en Hotel XYZ?",
    "timestamp": "2025-11-14T10:30:00Z"
  }
}
```

### LLM_RESPONSE
```json
{
  "type": "LLM_RESPONSE",
  "sessionId": "session-123",
  "data": {
    "response": "Consultaré la disponibilidad...",
    "toolCalls": [
      {
        "name": "check_availability",
        "args": {"hotel_id": 1, "date_from": "2025-11-20", ...}
      }
    ],
    "model": "gemini-2.5-flash"
  }
}
```

### TOOL_CALL
```json
{
  "type": "TOOL_CALL",
  "sessionId": "session-123",
  "data": {
    "toolName": "check_availability",
    "arguments": {
      "hotel_id": 1,
      "date_from": "2025-11-20",
      "date_to": "2025-11-22",
      "pax": 2
    }
  }
}
```

### TOOL_RESULT
```json
{
  "type": "TOOL_RESULT",
  "sessionId": "session-123",
  "data": {
    "toolName": "check_availability",
    "result": "JSON de disponibilidad..."
  },
  "duration": 234  // ms
}
```

### API_RESPONSE
```json
{
  "type": "API_RESPONSE",
  "sessionId": "session-123",
  "data": {
    "toolName": "check_availability",
    "status": "success",
    "responseLength": 1024
  },
  "duration": 234  // ms
}
```

### ERROR
```json
{
  "type": "ERROR",
  "sessionId": "session-123",
  "data": {
    "error": "Descripción del error",
    "stack": "stack trace..."
  }
}
```

## Uso

### 1. **Archivo de Log**

Los logs se guardan en archivos JSONL:
```
logs/
├── session_session-123_2025-11-14.jsonl
├── session_session-456_2025-11-14.jsonl
└── session_default_2025-11-14.jsonl
```

Cada línea es un evento JSON.

**Leer un archivo de log (comando PowerShell):**
```powershell
Get-Content .\logs\session_session-123_2025-11-14.jsonl | ConvertFrom-Json | Format-Table
```

**O en Python:**
```python
import json
with open('logs/session_session-123_2025-11-14.jsonl', 'r') as f:
    for line in f:
        event = json.loads(line)
        print(f"[{event['type']}] {event['data']}")
```

### 2. **Endpoints de API**

#### Obtener logs de una sesión
```bash
GET /api/chat/logs/:sessionId
```

Respuesta:
```json
{
  "sessionId": "session-123",
  "logCount": 42,
  "logs": [
    { "type": "USER_MESSAGE", ... },
    { "type": "LLM_RESPONSE", ... },
    ...
  ]
}
```

#### Obtener estado del logger
```bash
GET /api/chat/logger/status
```

Respuesta:
```json
{
  "status": "ok",
  "logger": {
    "queueSize": 5,
    "activeSessions": 3,
    "isProcessing": false
  }
}
```

### 3. **Flush Manual**

En código TypeScript:
```typescript
import { getSessionLogger } from './services/session-logger.js';

const logger = getSessionLogger();

// ... operaciones ...

// Flush manual (esperar a que se guarden todos los logs)
await logger.flush();
```

## Performance

### Benchmarks (aproximados)

| Operación | Tiempo |
|-----------|--------|
| `logger.log()` | <1ms (O(1) - agrega a cola) |
| Flush 1000 eventos | ~50-100ms (I/O a disco) |
| Lectura de logs (endpoint) | ~10-50ms (según tamaño) |

### Overhead en Chat
- **Por mensaje:** <0.5ms (solo agregar a cola)
- **Sin impacto en latencia** del usuario

## Casos de Uso

### 1. **Debugging**
```bash
# Ver todo lo que pasó en una sesión
curl http://localhost:3000/api/chat/logs/my-session | jq '.'

# Filtrar solo errores
curl http://localhost:3000/api/chat/logs/my-session | jq '.logs | map(select(.type == "ERROR"))'
```

### 2. **Auditoria**
- Rastrear cada acción de usuario y respuesta de herramientas
- Comprobar qué APIs fueron llamadas y con qué parámetros
- Verificar tiempos de respuesta

### 3. **Analytics**
```python
import json
from pathlib import Path
from collections import defaultdict

logs_dir = Path('logs')
stats = defaultdict(int)
total_duration = defaultdict(list)

for log_file in logs_dir.glob('*.jsonl'):
    with open(log_file) as f:
        for line in f:
            event = json.loads(line)
            event_type = event['type']
            stats[event_type] += 1
            
            if 'duration' in event:
                total_duration[event_type].append(event['duration'])

# Mostrar estadísticas
for event_type, count in sorted(stats.items()):
    avg_duration = sum(total_duration[event_type]) / len(total_duration[event_type]) if total_duration[event_type] else 0
    print(f"{event_type}: {count} events, avg duration: {avg_duration:.2f}ms")
```

### 4. **Replay y Testing**
```typescript
// Leer logs y reproducir el flujo
const logs = await readSessionLogs('session-123');
const interactions = logs.filter(e => e.type === 'USER_MESSAGE' || e.type === 'TOOL_CALL');

// Reproducir cada interacción para validar comportamiento
for (const interaction of interactions) {
  // ... replay logic ...
}
```

## Limpieza y Archivado

### Limpiar logs antiguos (PowerShell)
```powershell
# Eliminar logs más antiguos de 30 días
Get-ChildItem .\logs\ | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

### Archivar logs (PowerShell)
```powershell
# Comprimir logs a ZIP
Compress-Archive -Path .\logs\* -DestinationPath ".\logs_archive_$(Get-Date -Format 'yyyyMMdd').zip"
```

## Troubleshooting

### Los logs no aparecen
1. Verificar que `LOGS_DIR` existe y tiene permisos de escritura
2. Verificar estado del logger: `GET /api/chat/logger/status`
3. Revisar si hay errores en consola del servidor

### La cola está llena
```json
{
  "queueSize": 1000,
  "activeSessions": 50
}
```

**Solución:**
- Reducir `LOG_FLUSH_INTERVAL` (más flushes frecuentes)
- Aumentar `maxQueueSize` en configuración

### Performance degradado
- Revisar si disco está lleno o muy lento
- Monitorear I/O del servidor
- Considerar archivado/limpieza de logs antiguos

## Extensiones Futuras

- **Persistencia a Base de Datos:** Implementar `persistToDatabase()` en `SessionLogger`
- **Compresión:** Comprimir eventos grandes en logs
- **Filtrado de Sensibles:** No loguear datos sensibles (passwords, tokens)
- **Alertas:** Notificar si hay errores frecuentes en una sesión
- **Dashboard:** UI para visualizar logs en tiempo real

## API Completa

### SessionLogger

```typescript
// Registrar evento (no-bloqueante)
logger.log({
  type: 'USER_MESSAGE' | 'LLM_RESPONSE' | 'TOOL_CALL' | 'TOOL_RESULT' | 'API_CALL' | 'API_RESPONSE' | 'ERROR' | 'SESSION_START' | 'SESSION_END',
  sessionId: string,
  data: Record<string, any>,
  duration?: number  // en ms
}): void

// Obtener todos los logs de una sesión (desde memoria)
logger.getSessionLogs(sessionId: string): LogEvent[]

// Borrar logs de una sesión (de memoria)
logger.clearSessionLogs(sessionId: string): void

// Obtener estado actual
logger.getStatus(): { queueSize: number; activeSessions: number; isProcessing: boolean }

// Forzar save a disco (espera)
await logger.flush(): Promise<void>

// Graceful shutdown (flush + cierre)
await logger.shutdown(): Promise<void>
```

---

**Versión:** 1.0.0  
**Última actualización:** 2025-11-14
