// src/api/chat.routes.ts
import { Router } from 'express';
import { AvailabilityAgent } from '../agents/availability.agent.js';
import { ChatRequest, ChatResponse } from '../types/chat.types.js';

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

    return router;
}

function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}