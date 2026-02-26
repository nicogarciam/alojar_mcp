import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { CustomerService } from '../../resources/alojar/customerService.js';

export function registerSearchCustomersTool(server: McpServer) {
    server.registerTool(
        'search_customers',
        {
            title: 'Buscar clientes',
            description: 'Buscar clientes en el sistema ALOJAR con filtros por nombre o email.',
            inputSchema: {
                q: z.string().optional().describe('Texto de búsqueda (nombre, email, etc.)')
            },
        },
        async (_input, extra): Promise<CallToolResult> => {
            const svc = new CustomerService();

            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: 'Listando clientes'
                    },
                    extra.sessionId
                );
            } catch {
                // no bloquear si falla logging
            }

            try {
                const result = await svc.listCustomers();
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
                            text: `Error al listar clientes: ${msg}`
                        }
                    ]
                };
            }
        }
    );
}

