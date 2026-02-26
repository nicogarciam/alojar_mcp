import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { UserService } from '../../resources/alojar/userService.js';

export function registerCreateUserTool(server: McpServer) {
    server.registerTool(
        'create_user',
        {
            title: 'Crear usuario',
            description: 'Crea un nuevo usuario en el sistema ALOJAR.',
            inputSchema: {
                name: z.string().describe('Nombre del usuario'),
                email: z.string().describe('Email del usuario'),
                role: z.string().optional().describe('Rol del usuario (ej: admin, receptionist, etc.)'),
                first_login: z.boolean().optional().describe('Indica si es el primer login'),
                logins: z.number().optional().describe('Cantidad de logins realizados'),
                google_id: z.string().optional().describe('ID de Google si aplica'),
                picture: z.string().optional().describe('URL de la imagen de perfil'),
                cash_account_id: z.number().optional().describe('ID de la cuenta de caja asociada'),
            },
        },
        async (input, extra): Promise<CallToolResult> => {
            const svc = new UserService();

            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: `Creando usuario | name=${input.name} | email=${input.email}`
                    },
                    extra.sessionId
                );
            } catch {
                // no bloquear si falla logging
            }

            try {
                const payload = {
                    name: input.name,
                    email: input.email,
                    role: input.role,
                    first_login: input.first_login,
                    logins: input.logins,
                    google_id: input.google_id,
                    picture: input.picture,
                    cash_account_id: input.cash_account_id,
                };

                const result = await svc.createUser(payload);
                const id = (result && (result.id ?? result.user_id ?? result.data?.id)) ?? undefined;

                if (id) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `✅ Usuario creado correctamente\n\n**ID:** ${id}\n**Nombre:** ${payload.name}\n**Email:** ${payload.email}`
                            }
                        ]
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ Usuario creado. Respuesta del servidor:\n\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 1500)}\n\`\`\``
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
                            text: `Error al crear usuario: ${msg}`
                        }
                    ]
                };
            }
        }
    );
}

