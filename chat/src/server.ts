// src/server.ts
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { LLMService } from './services/llm.service.js';
import { AvailabilityAgent } from './agents/availability.agent.js';
import { createChatRoutes } from './api/chat.routes.js';
import { AlojarMCPClient } from './clients/alojar-v1.client.js';

// Cargar variables de entorno
config();

class ChatbotServer {
    private app: express.Application;
    private port: number;
    private agent: AvailabilityAgent | null = null;

    constructor() {
        this.app = express();
        this.port = parseInt(process.env.PORT || '3000');
        this.setupMiddleware();
        this.initializeServices();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    private async initializeServices(): Promise<void> {
        try {

            // Configurar cliente MCP primero
            /* const mcpClient = new RemoteMCPClient({
                command: process.env.MCP_SERVER_COMMAND || 'node',
                args: [process.env.MCP_SERVER_PATH || '../mcp-server/dist/main.js'],
                env: {
                    ALOJAR_API_TOKEN: process.env.ALOJAR_API_TOKEN!,
                    ALOJAR_API_BASE_URL: process.env.ALOJAR_API_BASE_URL!
                },
                serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3001',
            }); */

            const mcpClient = new AlojarMCPClient();
            // Conectar al servidor MCP
            await mcpClient.connect();
            // Configurar servicio LLM con múltiples proveedores
            const llmService = new LLMService('gemini', mcpClient);


            // Crear agente
            this.agent = new AvailabilityAgent(llmService, mcpClient);

            // Configurar rutas
            this.app.use('/api', createChatRoutes(this.agent));

            // Ruta de bienvenida
            this.app.get('/', (req, res) => {
                const providerInfo = this.agent?.getLLMProviderInfo();

                res.json({
                    message: 'Chatbot MCP Availability Server',
                    version: '1.0.0',
                    provider: providerInfo,
                    endpoints: {
                        chat: 'POST /api/chat',
                        health: 'GET /api/health',
                        clearHistory: 'DELETE /api/chat/history'
                    }
                });
            });

            // Health check extendido
            this.app.get('/health', async (req, res) => {
                try {
                    const mcpHealth = this.agent ? await this.agent.healthCheck() : false;
                    const llmHealth = this.agent ? await this.agent.getLLMProviderInfo() : null;

                    res.json({
                        status: 'healthy',
                        timestamp: new Date(),
                        services: {
                            mcp: mcpHealth ? 'connected' : 'disconnected',
                            llm: llmHealth ? 'connected' : 'disconnected',
                            provider: llmHealth?.provider || 'unknown'
                        }
                    });
                } catch (error) {
                    res.status(503).json({
                        status: 'unhealthy',
                        error: error instanceof Error ? error.message : 'Error desconocido',
                        timestamp: new Date()
                    });
                }
            });

            console.log('✅ Servicios inicializados correctamente');
            console.log('🤖 Proveedor LLM:', this.agent.getLLMProviderInfo());

        } catch (error) {
            console.error('❌ Error inicializando servicios:', error);

            // Configurar rutas básicas incluso si hay error
            this.setupFallbackRoutes();
        }
    }

    /**
     * Configura rutas de fallback si los servicios no se inicializan
     */
    private setupFallbackRoutes(): void {
        this.app.post('/api/chat', (req, res) => {
            res.status(503).json({
                error: 'Servicio no disponible',
                message: 'El servicio de disponibilidad no está disponible en este momento. Por favor, intente más tarde.'
            });
        });

        this.app.get('/health', (req, res) => {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date(),
                services: {
                    mcp: 'disconnected',
                    llm: 'unknown',
                    provider: 'unknown'
                }
            });
        });
    }

    public start(): void {
        this.app.listen(this.port, () => {
            console.log(`🚀 Chatbot server running on port ${this.port}`);
            console.log(`📚 API documentation: http://localhost:${this.port}`);
            console.log(`🔧 Health check: http://localhost:${this.port}/health`);
        });
    }
}

// Iniciar servidor
const server = new ChatbotServer();
server.start();
