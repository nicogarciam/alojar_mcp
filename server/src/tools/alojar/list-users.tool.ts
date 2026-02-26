import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { UserService } from '../../resources/alojar/userService.js';

export function registerListUsersTool(server: McpServer) {
    server.registerTool(
        'list_users',
        {
            title: 'Listar usuarios',
            description: 'Lista usuarios del sistema ALOJAR con filtros opcionales de búsqueda y paginación.',
            inputSchema: {
                q: z.string().optional().describe('Texto de búsqueda (nombre, email, etc.)'),
                skip: z.number().optional().describe('Cantidad de registros a saltear (paginación)'),
                limit: z.number().optional().describe('Cantidad máxima de usuarios a devolver'),
            },
        },
        async ({ q, skip, limit }, extra): Promise<CallToolResult> => {
            const svc = new UserService();

            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: `Listando usuarios | q=${q ?? ''} | skip=${skip ?? 0} | limit=${limit ?? ''}`
                    },
                    extra.sessionId
                );
            } catch {
                // no bloquear si falla logging
            }

            try {
                const result = await svc.listUsers({ q, skip, limit });
                const text = typeof result === 'string'
                    ? result
                    : JSON.stringify(result, null, 2);

                return {
                    content: [
                        {
                            type: 'text',
                            text
                        }
                    ]
                };
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Error desconocido';
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error al listar usuarios: ${msg}`
                        }
                    ]
                };
            }
        }
    );
}

