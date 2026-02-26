// src/api/chat.routes.ts
import { Router } from 'express';
import { AvailabilityAgent } from '../agents/availability.agent.js';
import { ChatRequest, ChatResponse } from '../types/chat.types.js';
import { getSessionLogger } from '../services/session-logger.js';

export function createChatRoutes(agent: AvailabilityAgent): Router {
    const router = Router();

    /**
     * Endpoint para enviar mensajes al chatbot
     */
    router.post('/chat', async (req, res) => {
        try {
            const { message, sessionId = 'default' }: ChatRequest = req.body;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    error: 'El mensaje no puede estar vacío'
                });
            }
            console.error(`Mensaje recibido:`, message);
            const { response, toolsUsed } = await agent.processMessage(message, sessionId);
            // console.error(`Respuesta generada [sessionId=${sessionId}]:`, response);

            const chatResponse: ChatResponse = {
                response,
                sessionId,
                messageId: generateMessageId(),
                timestamp: new Date(),
                toolsUsed
            };

            //console.error('Response to client:', chatResponse);
            res.json(chatResponse);

        } catch (error) {
            console.error('Error en endpoint /chat:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                message: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    });

    /**
     * Endpoint para limpiar el historial de una sesión
     */
    router.delete('/chat/history', async (req, res) => {
        try {
            const { sessionId = 'default' } = req.body;
            agent.clearHistory(sessionId);

            res.json({
                message: 'Historial limpiado correctamente',
                sessionId
            });
        } catch (error) {
            console.error('Error limpiando historial:', error);
            res.status(500).json({
                error: 'Error limpiando historial'
            });
        }
    });

    /**
     * Health check del agente
     */
    router.get('/health', async (req, res) => {
        try {
            // Verificar que los servicios estén funcionando
            res.json({
                status: 'healthy',
                timestamp: new Date(),
                services: {
                    mcp: 'connected', // Esto deberías verificarlo realmente
                    llm: 'connected'
                }
            });
        } catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Error desconocido'
            });
        }
    });

    router.get('/tools', async (req, res) => {
        try {
            const { sessionId = 'default' } = req.body;
            const tools = await agent.getAvailableTools(sessionId);

            res.json({
                tools: tools,
                sessionId
            });
        } catch (error) {
            console.error('Error refrescando las herramientas:', error);
            res.status(500).json({
                error: 'Error refrescando las herramientas'
            });
        }
    });

    /**
     * Obtiene los logs de una sesión
     */
    router.get('/chat/logs/:sessionId', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const logger = getSessionLogger();
            const logs = logger.getSessionLogs(sessionId);

            res.json({
                sessionId,
                logCount: logs.length,
                logs: logs
            });
        } catch (error) {
            console.error('Error obteniendo logs:', error);
            res.status(500).json({
                error: 'Error obteniendo logs'
            });
        }
    });

    /**
     * Obtiene el estado del logger
     */
    router.get('/chat/logger/status', async (req, res) => {
        try {
            const logger = getSessionLogger();
            const status = logger.getStatus();

            res.json({
                status: 'ok',
                logger: status
            });
        } catch (error) {
            console.error('Error obteniendo estado del logger:', error);
            res.status(500).json({
                error: 'Error obteniendo estado del logger'
            });
        }
    });

    /**
     * Obtiene el listado de todas las sesiones con su estado
     */
    router.get('/chat/sessions', async (req, res) => {
        try {
            const logger = getSessionLogger();
            const sessions = logger.getAllSessions();

            res.json({
                status: 'ok',
                sessionCount: sessions.length,
                sessions: sessions
            });
        } catch (error) {
            console.error('Error obteniendo listado de sesiones:', error);
            res.status(500).json({
                error: 'Error obteniendo listado de sesiones'
            });
        }
    });

    /**
     * SSE: stream en tiempo real de eventos del logger para una sesión
     */
    router.get('/chat/logs/stream/:sessionId', (req, res) => {
        try {
            const { sessionId } = req.params;
            const logger = getSessionLogger();

            // Cabeceras SSE
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            });

            // Enviar un comentario inicial
            res.write(`: connected to session ${sessionId}\n\n`);

            const onLog = (event: any) => {
                try {
                    if (event.sessionId === sessionId) {
                        const payload = JSON.stringify(event);
                        res.write(`data: ${payload}\n\n`);
                    }
                } catch (err) {
                    // Ignore send errors
                }
            };

            logger.on('log', onLog);

            // Clean up on client disconnect
            req.on('close', () => {
                logger.off('log', onLog);
            });
        } catch (error) {
            console.error('Error en SSE logs stream:', error);
            res.status(500).end();
        }
    });

    return router;
}

function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}