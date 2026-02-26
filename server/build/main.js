import express from 'express';
import { randomUUID } from 'node:crypto';
import cors from 'cors';
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js";
import { getServer } from "./servers/alojar-stream.server.js";
const useOAuth = process.argv.includes('--oauth');
const strictOAuth = process.argv.includes('--oauth-strict');
const MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : 3001;
const AUTH_PORT = process.env.MCP_AUTH_PORT ? parseInt(process.env.MCP_AUTH_PORT, 10) : 3002;
const app = express();
app.use(express.json());
// Allow CORS all domains, expose the Mcp-Session-Id header
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    // Añadir aquí cualquier header personalizado que el cliente envíe en las peticiones
    allowedHeaders: ['Content-Type', 'mcp-session-id', 'mcp-protocol-version', 'last-event-id'],
    // Exponer al cliente los headers que necesite leer de la respuesta
    exposedHeaders: ['mcp-session-id', 'mcp-protocol-version'],
}));
// Set up OAuth if enabled
let authMiddleware = null;
// Map to store transports by session ID
const transports = {};
async function initializeTransport() {
    // Initialize the transport layer for handling requests
    const eventStore = new InMemoryEventStore();
    let transport;
    transport = new StreamableHTTPServerTransport({
        // Generar un sessionId único usando randomUUID para poder recuperar el transport luego
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true
    });
    transport.onclose = () => {
        const sid = transport?.sessionId;
        if (sid && transports[sid]) {
            console.log(`Transport closed for session ${sid}, removing from transports map`);
            delete transports[sid];
        }
    };
    // Conectar el transport (el SDK podría modificar/establecer sessionId durante la conexión)
    const server = getServer();
    await server.connect(transport);
    return transport;
}
// MCP POST endpoint with optional auth
const mcpPostHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (sessionId) {
        console.log(`Received MCP request for session: ${sessionId}`);
    }
    else {
        console.log('Request Initialize body:', req.body);
    }
    try {
        const isInitRequest = isInitializeRequest(req.body) || (req.body && req.body.method === 'initialize');
        let transport;
        // If client sends a sessionId, require that we have a transport for it
        if (sessionId) {
            transport = transports[sessionId];
            if (!transport) {
                // Unknown session id
                console.warn(`No transport found for session ${sessionId}`);
                if (!res.headersSent) {
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: Invalid session ID'
                        },
                        id: null
                    });
                }
                return;
            }
            console.log(`Handling request for existing session ${transport.sessionId}`);
            await transport.handleRequest(req, res, req.body);
            return;
        }
        // No sessionId: initialization flow
        if (!sessionId && isInitRequest) {
            console.log('No session ID provided, handling initialization request');
            transport = await initializeTransport();
            // Let the transport handle the HTTP response for initialization
            console.log('Handling initialization request for new session');
            await transport.handleRequest(req, res, req.body);
            // Después de que el SDK haya manejado la respuesta, leer el sessionId final
            // y registrar/actualizar el transport en el mapa para futuras conexiones GET/POST/DELETE.
            if (transport.sessionId) {
                transports[transport.sessionId] = transport;
                console.log(`Registered transport after initialization with session ${transport.sessionId}`);
            }
            else {
                // Si aún no hay sessionId, generar uno y registrar (fallback)
                const fallbackSid = randomUUID();
                transport.sessionId = fallbackSid;
                transports[fallbackSid] = transport;
                console.log(`No sessionId from SDK; assigned fallback ${fallbackSid} and registered transport`);
            }
            return;
        }
        // If we reach here, it's a bad request (no session id + not init)
        if (!res.headersSent) {
            res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Bad Request: No valid session ID provided'
                },
                id: null
            });
        }
        return;
    }
    catch (error) {
        console.error('Error handling MCP request:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
};
app.post('/mcp', mcpPostHandler);
// Handle GET requests for SSE streams (using built-in support from StreamableHTTP)
const mcpGetHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    // Check for Last-Event-ID header for resumability
    const lastEventId = req.headers['last-event-id'];
    if (lastEventId) {
        console.log(`Client reconnecting with Last-Event-ID: ${lastEventId}`);
    }
    else {
        console.log(`Establishing new SSE stream for session ${sessionId}`);
    }
    const transport = transports[sessionId];
    await transport.handleRequest(req, res);
};
// Set up GET route with conditional auth middleware
app.get('/mcp', mcpGetHandler);
// Handle DELETE requests for session termination (according to MCP spec)
const mcpDeleteHandler = async (req, res) => {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
    }
    console.log(`Received session termination request for session ${sessionId}`);
    try {
        const transport = transports[sessionId];
        await transport.handleRequest(req, res);
    }
    catch (error) {
        console.error('Error handling session termination:', error);
        if (!res.headersSent) {
            res.status(500).send('Error processing session termination');
        }
    }
};
// Set up DELETE route with conditional auth middleware
if (useOAuth && authMiddleware) {
    app.delete('/mcp', authMiddleware, mcpDeleteHandler);
}
else {
    app.delete('/mcp', mcpDeleteHandler);
}
app.listen(MCP_PORT, error => {
    if (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
    console.log(`MCP Streamable HTTP Server listening on port ${MCP_PORT}`);
});
// Handle server shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    // Close all active transports to properly clean up resources
    for (const sessionId in transports) {
        try {
            console.log(`Closing transport for session ${sessionId}`);
            await transports[sessionId].close();
            delete transports[sessionId];
        }
        catch (error) {
            console.error(`Error closing transport for session ${sessionId}:`, error);
        }
    }
    console.log('Server shutdown complete');
    process.exit(0);
});
