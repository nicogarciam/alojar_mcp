// src/services/session-logger.ts
import { appendFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Tipos de eventos que se pueden loguear en una sesión
 */
export type LogEventType =
    | 'USER_MESSAGE'      // Usuario envía un mensaje
    | 'LLM_RESPONSE'      // LLM responde
    | 'TOOL_CALL'         // Se llama a una herramienta
    | 'TOOL_RESULT'       // Resultado de la herramienta
    | 'API_CALL'          // Llamada a API externa (desde tool)
    | 'API_RESPONSE'      // Respuesta de API externa
    | 'ERROR'             // Error durante la sesión
    | 'SESSION_START'     // Inicio de sesión
    | 'SESSION_END';      // Fin de sesión

/**
 * Evento de log para una sesión
 */
export interface LogEvent {
    timestamp: Date;
    type: LogEventType;
    sessionId: string;
    data: Record<string, any>;
    duration?: number;  // Duración en ms para operaciones
}

/**
 * Opciones de configuración del logger
 */
export interface SessionLoggerConfig {
    logsDir?: string;               // Directorio para guardar logs (default: ./logs)
    persistToFile?: boolean;        // Persistir a archivo (default: true)
    persistToDatabase?: boolean;    // Persistir a BD (default: false, no implementado aún)
    dbPath?: string;                // Path a archivo de BD sqlite (si persistToDatabase)
    maxQueueSize?: number;          // Tamaño máximo de la cola (default: 1000)
    flushInterval?: number;         // Intervalo de flush en ms (default: 5000)
    verbose?: boolean;              // Log a consola (default: false)
}

/**
 * Logger asincrónico de sesiones de chat
 * 
 * Usa una cola interna para persistir logs sin bloquear el flujo principal.
 * Los logs se escriben a archivo de forma asincrónica en background.
 */
export class SessionLogger extends EventEmitter {
    private queue: LogEvent[] = [];
    private isProcessing = false;
    private flushTimer: NodeJS.Timeout | null = null;
    private sessionLogs: Map<string, LogEvent[]> = new Map();
    private config: Required<SessionLoggerConfig>;
    // sqlite DB instance (optional)
    private db: any | null = null;

    constructor(config: SessionLoggerConfig = {}) {
        super();
        this.config = {
            logsDir: config.logsDir || resolve(process.cwd(), 'logs'),
            persistToFile: config.persistToFile !== false,
            persistToDatabase: config.persistToDatabase || false,
            dbPath: config.dbPath || resolve(process.cwd(), 'logs', 'session_logs.db'),
            maxQueueSize: config.maxQueueSize || 1000,
            flushInterval: config.flushInterval || 5000,
            verbose: config.verbose || false,
        };

        // Inicializar DB si está configurado (asincrónico, pero no bloqueante)
        if (this.config.persistToDatabase) {
            this.initDatabaseAsync().catch(err => {
                console.error('Error inicializando DB en background:', err);
            });
        }
    }

    /**
     * Registra un evento de log
     * Esta operación es NO BLOQUEANTE - devuelve inmediatamente
     */
    log(event: Omit<LogEvent, 'timestamp'>): void {
        const logEvent: LogEvent = {
            ...event,
            timestamp: new Date(),
        };

        // Agregar a la cola
        if (this.queue.length < this.config.maxQueueSize) {
            this.queue.push(logEvent);
        } else {
            console.warn(`⚠️  SessionLogger: cola llena (${this.config.maxQueueSize}), descartando evento`);
        }

        // Agregar a logs de sesión en memoria
        if (!this.sessionLogs.has(event.sessionId)) {
            this.sessionLogs.set(event.sessionId, []);
        }
        this.sessionLogs.get(event.sessionId)!.push(logEvent);

        // Log a consola si está habilitado
        if (this.config.verbose) {
            console.log(`[LOG] ${event.type} | Sesión: ${event.sessionId} |`, event.data);
        }

        // Disparar evento (para listeners)
        this.emit('log', logEvent);

        // Iniciar flush timer si no está activo
        this.ensureFlushTimer();
    }

    /**
     * Fuerza el guardado de logs pendientes a disco
     */
    async flush(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const eventsToFlush = [...this.queue];
        this.queue = [];

        try {
            // Agrupar por sessionId para escribir en archivos separados
            const groupedBySession = this.groupBySessionId(eventsToFlush);

            for (const [sessionId, events] of Object.entries(groupedBySession)) {
                if (this.config.persistToFile) {
                    await this.persistToFile(sessionId, events);
                }

                if (this.config.persistToDatabase) {
                    try {
                        await this.persistToDatabase(sessionId, events);
                    } catch (dbErr) {
                        console.error('Error persistiendo a DB:', dbErr);
                    }
                }
            }

            if (this.config.verbose) {
                console.log(`✅ SessionLogger: ${eventsToFlush.length} eventos guardados`);
            }
        } catch (err) {
            console.error('❌ Error en SessionLogger.flush():', err);
            // Re-agregar a la cola para reintentar más tarde
            this.queue.push(...eventsToFlush);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Obtiene todos los logs de una sesión desde la memoria
     */
    getSessionLogs(sessionId: string): LogEvent[] {
        return this.sessionLogs.get(sessionId) || [];
    }

    /**
     * Limpia los logs de una sesión de la memoria (después de guardar a disco)
     */
    clearSessionLogs(sessionId: string): void {
        this.sessionLogs.delete(sessionId);
    }

    /**
     * Obtiene información del estado del logger
     */
    getStatus(): {
        queueSize: number;
        activeSessions: number;
        isProcessing: boolean;
    } {
        return {
            queueSize: this.queue.length,
            activeSessions: this.sessionLogs.size,
            isProcessing: this.isProcessing,
        };
    }

    /**
     * Obtiene listado de todas las sesiones con su estado
     */
    getAllSessions(): Array<{ sessionId: string; status: 'active' | 'closed'; eventCount: number; lastActivity: Date | null }> {
        const sessions: Array<{ sessionId: string; status: 'active' | 'closed'; eventCount: number; lastActivity: Date | null }> = [];

        for (const [sessionId, events] of this.sessionLogs.entries()) {
            if (events.length === 0) continue;

            const hasSessionEnd = events.some(e => e.type === 'SESSION_END');
            const status = hasSessionEnd ? 'closed' : 'active';
            const lastEvent = events[events.length - 1];

            sessions.push({
                sessionId,
                status,
                eventCount: events.length,
                lastActivity: lastEvent?.timestamp || null,
            });
        }

        // Ordenar por última actividad (descendente)
        return sessions.sort((a, b) => {
            const timeA = a.lastActivity?.getTime() || 0;
            const timeB = b.lastActivity?.getTime() || 0;
            return timeB - timeA;
        });
    }

    /**
     * Detiene el logger y guarda todos los logs pendientes
     */
    async shutdown(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Flush final
        await this.flush();
        console.log('🛑 SessionLogger detenido');
    }

    // ========== Métodos privados ==========

    private ensureFlushTimer(): void {
        if (this.flushTimer) return;

        this.flushTimer = setInterval(async () => {
            await this.flush();
        }, this.config.flushInterval);
    }

    private groupBySessionId(events: LogEvent[]): Record<string, LogEvent[]> {
        return events.reduce((acc, event) => {
            if (!acc[event.sessionId]) {
                acc[event.sessionId] = [];
            }
            acc[event.sessionId].push(event);
            return acc;
        }, {} as Record<string, LogEvent[]>);
    }

    private async persistToFile(sessionId: string, events: LogEvent[]): Promise<void> {
        // Crear directorio si no existe
        await mkdir(this.config.logsDir, { recursive: true });

        // Nombre del archivo: logs/session_<sessionId>_<date>.jsonl
        const date = new Date().toISOString().split('T')[0];
        const filePath = resolve(this.config.logsDir, `session_${sessionId}_${date}.jsonl`);

        // Convertir eventos a formato JSONL (una línea por evento)
        const lines = events.map(event => JSON.stringify(this.serializeEvent(event))).join('\n');

        // Agregar nueva línea al final para separar desde el siguiente flush
        await appendFile(filePath, lines + '\n', 'utf8');
    }

    private serializeEvent(event: LogEvent): Record<string, any> {
        return {
            timestamp: event.timestamp.toISOString(),
            type: event.type,
            sessionId: event.sessionId,
            duration: event.duration,
            data: event.data,
        };
    }

    /**
     * Inicializa la base de datos SQLite de forma asincrónica (si está disponible)
     */
    private async initDatabaseAsync(): Promise<void> {
        try {
            // Asegurar que el directorio existe
            await mkdir(resolve(this.config.dbPath, '..'), { recursive: true });

            // Import dinámico usando require (permitido en ES6 via createRequire)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const Database = require('better-sqlite3');
            this.db = new Database(this.config.dbPath);

            // Crear tabla si no existe
            this.db.prepare(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sessionId TEXT,
                    timestamp TEXT,
                    type TEXT,
                    duration INTEGER,
                    data TEXT
                )
            `).run();

            if (this.config.verbose) {
                console.log('✅ SessionLogger: SQLite inicializada en', this.config.dbPath);
            }
        } catch (err) {
            console.error('⚠️  SessionLogger: no se pudo inicializar SQLite. Instale `better-sqlite3` para habilitar persistencia a DB.', err);
            this.db = null;
        }
    }


    /**
     * Persiste eventos a la base de datos SQLite en una transacción
     */
    private async persistToDatabase(sessionId: string, events: LogEvent[]): Promise<void> {
        if (!this.db) {
            throw new Error('SQLite no inicializada');
        }

        try {
            const insert = this.db.prepare('INSERT INTO events (sessionId, timestamp, type, duration, data) VALUES (?, ?, ?, ?, ?)');
            const insertMany = this.db.transaction((rows: any[]) => {
                for (const r of rows) {
                    insert.run(r.sessionId, r.timestamp, r.type, r.duration ?? null, r.data);
                }
            });

            const rows = events.map(e => ({
                sessionId: e.sessionId,
                timestamp: e.timestamp.toISOString(),
                type: e.type,
                duration: e.duration ?? null,
                data: JSON.stringify(e.data),
            }));

            insertMany(rows);
        } catch (err) {
            console.error('Error guardando eventos en SQLite:', err);
            throw err;
        }
    }
}

/**
 * Instancia singleton del logger (para usar globalmente)
 */
let globalLogger: SessionLogger | null = null;

export function initializeSessionLogger(config?: SessionLoggerConfig): SessionLogger {
    if (globalLogger) {
        return globalLogger;
    }

    globalLogger = new SessionLogger(config);
    return globalLogger;
}

export function getSessionLogger(): SessionLogger {
    if (!globalLogger) {
        globalLogger = new SessionLogger();
    }
    return globalLogger;
}
