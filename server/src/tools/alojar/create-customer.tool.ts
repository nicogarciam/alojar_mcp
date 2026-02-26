import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from 'zod';
import { CustomerService } from '../../resources/alojar/customerService.js';

export function registerCreateCustomerTool(server: McpServer) {
    server.registerTool(
        'create_customer',
        {
            title: 'Crear cliente',
            description: 'Crea un nuevo cliente en el sistema ALOJAR.',
            inputSchema: {
                name: z.string().describe('Nombre del cliente'),
                cuil: z.string().optional().describe('CUIL / identificación fiscal del cliente'),
                contact_name: z.string().optional().describe('Nombre de contacto principal'),
                email: z.string().describe('Email de contacto'),
                phone: z.string().optional().describe('Teléfono de contacto'),
                address: z.string().optional().describe('Dirección del cliente'),
                token: z.string().optional().describe('Token de acceso para el cliente (si aplica)'),
                password: z.string().optional().describe('Contraseña inicial del cliente (si aplica)'),
                city_id: z.number().optional().describe('ID de ciudad del cliente'),
                photo: z.string().optional().describe('URL de la foto/logo del cliente'),
            },
        },
        async (input, extra): Promise<CallToolResult> => {
            const svc = new CustomerService();

            try {
                await server.sendLoggingMessage(
                    {
                        level: 'info',
                        data: `Creando cliente | name=${input.name}`
                    },
                    extra.sessionId
                );
            } catch {
                // no bloquear si falla logging
            }

            try {
                const payload = {
                    name: input.name,
                    cuil: input.cuil,
                    contact_name: input.contact_name,
                    email: input.email,
                    phone: input.phone,
                    address: input.address,
                    token: input.token,
                    password: input.password,
                    city_id: input.city_id,
                    photo: input.photo,
                };

                const result = await svc.createCustomer(payload);
                const id = (result && (result.id ?? result.customer_id ?? result.data?.id)) ?? undefined;

                if (id) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `✅ Cliente creado correctamente\n\n**ID:** ${id}\n**Nombre:** ${payload.name}`
                            }
                        ]
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ Cliente creado. Respuesta del servidor:\n\`\`\`json\n${JSON.stringify(result, null, 2).slice(0, 1500)}\n\`\`\``
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
                            text: `Error al crear cliente: ${msg}`
                        }
                    ]
                };
            }
        }
    );
}

