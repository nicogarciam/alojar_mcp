// src/services/llm.service.ts
import OpenAI from 'openai';
import { LLMMessage, ToolCall, MessageRole } from '../types/chat.types.js';
import { getLLMConfig, LLMConfig, SupportedProviders } from './models.js';
import { MCPClient } from '../clients/mcpClient.js';
import { GoogleGenAI, mcpToTool } from '@google/genai';



/**
 * Servicio para interactuar con múltiples proveedores de LLM
 * Soporta: OpenAI, DeepSeek, Azure OpenAI y proveedores personalizados
 */
export class LLMService {
    private model: any; // openai client OR undefined for gemini
    private config: LLMConfig;
    private mcpClient: MCPClient;
    private provider: SupportedProviders;

    constructor(provider: SupportedProviders, mcpClient: MCPClient) {
        this.provider = provider;
        this.config = getLLMConfig(provider);
        // Solo inicializar OpenAI SDK si no es Gemini (usamos REST para Gemini)
        if (this.provider !== 'gemini') {
            this.model = new OpenAI(this.config as any);
        } else {
            this.model = new GoogleGenAI({ apiKey: this.config.apiKey });
        }
        this.mcpClient = mcpClient;
    }

    private getDefaultHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};

        if (this.config.provider === 'azure') {
            headers['api-key'] = this.config.apiKey;
        }

        if (this.config.provider === 'deepseek') {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        return headers;
    }

    /**
     * Genera una respuesta del LLM
     */
    async generateResponse(
        messages: LLMMessage[],
        tools?: any[], tool_choice: 'auto' | 'none' = 'auto',
        systemPrompt?: LLMMessage
    ): Promise<{ response: string; toolCalls?: ToolCall[] }> {
        try {
            // Si no se proporcionan tools explícitamente, obtenerlas del MCP
            const availableTools = tools || await this.getToolsAvailables();
            console.error(`Usando proveedor LLM ${this.provider} con modelo ${this.config.model}`);

            // Ruta para proveedores distintos de Gemini: usar SDK (OpenAI)
            if (this.provider !== 'gemini') {
                console.error(`Usando NO GEMINI`);
                const requestConfig: any = {
                    model: this.config.model,
                    messages: messages as any,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens,
                    systemPrompt: systemPrompt
                };

                if (availableTools && availableTools.length > 0 && this.supportsTools()) {
                    requestConfig.tools = availableTools;
                    requestConfig.tool_choice = tool_choice;
                }

                const completion = await this.model.chat.completions.create(requestConfig);
                const message = completion.choices[0]?.message;

                if (message?.tool_calls && message.tool_calls.length > 0) {
                    return {
                        response: message.content || '',
                        toolCalls: message.tool_calls as ToolCall[]
                    };
                }

                return {
                    response: message?.content || 'Lo siento, no pude generar una respuesta.'
                };
            }

            console.error(`Usando GEMINI`);

            const prompt = messages.map(m => {
                const role = m.role || 'user';
                const name = role === 'assistant' ? 'Assistant' : role === 'system' ? 'System' : 'User';
                const content = Array.isArray(m.content) ? m.content.map(c => (c as any).text || String(c)).join('\n') : String(m.content || '');
                return `${name}: ${content}`;
            }).join('\n\n');

            const response = await (this.model as GoogleGenAI).models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [mcpToTool(this.mcpClient.client)],
                    systemInstruction: systemPrompt?.content
                },
            });
            console.error('Gemini functionCalls:', JSON.stringify(response, null, 2));

            if (response?.functionCalls && response.functionCalls.length > 0) {

                return {
                    response: response.text || '',
                    toolCalls: response.functionCalls as ToolCall[]
                };
            }

            return { response: response.text || 'Lo siento, no pude obtener una respuesta de Gemini.' };

        } catch (error) {
            console.error('Error en LLM:', error);
            throw new Error(`Error generando respuesta: ${this.getErrorMessage(error)}`);
        }
    }



    /**
 * Obtiene las herramientas disponibles del MCP server
 */
    async getToolsAvailables(): Promise<any[] | undefined> {
        try {
            // Verificar que el MCP client esté conectado
            if (!this.mcpClient.isClientConnected()) {
                console.warn('MCP client no conectado, no hay herramientas disponibles');
                return undefined;
            }

            const tools = await this.mcpClient.getToolsForLLM();

            if (tools.length === 0) {
                console.warn('No hay herramientas disponibles en el MCP server');
                return undefined;
            }

            console.log(`🛠️  Cargadas ${tools.length} herramientas del MCP:`, tools.map(t => t.function.name));
            return tools;

        } catch (error) {
            console.error('Error obteniendo herramientas del MCP:', error);
            return undefined;
        }
    }

    /**
     * Verifica si el proveedor actual soporta tools/functions
     */
    private supportsTools(): boolean {
        // DeepSeek puede no soportar tools completamente, ajustar según necesidad
        return this.config.provider !== 'deepseek'; // Temporalmente deshabilitado para DeepSeek
    }

    /**
     * Obtiene mensajes de error específicos por proveedor
     */
    private getErrorMessage(error: any): string {
        if (error?.code === 'invalid_api_key') {
            return 'API key inválida';
        } else if (error?.code === 'rate_limit_exceeded') {
            return 'Límite de tasa excedido';
        } else if (error?.status === 429) {
            return 'Demasiadas solicitudes. Por favor, espera un momento.';
        } else if (error?.status === 503) {
            return 'Servicio no disponible. Por favor, intenta más tarde.';
        }

        return error instanceof Error ? error.message : 'Error desconocido';
    }


    /**
     * Verifica la conexión con el proveedor LLM
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.model.models.list();
            return true;
        } catch (error) {
            console.error('Health check LLM falló:', error);
            return false;
        }
    }

    /**
     * Obtiene información del proveedor configurado
     */
    getProviderInfo() {
        return {
            provider: this.config.provider,
            model: this.config.model,
            baseURL: this.config.baseURL,
            supportsTools: this.supportsTools()
        };
    }
}

/**
 * Convierte strings numéricos en números para keys conocidas.
 * Evita que la validación de herramientas falle por tipos incorrectos.
 */
function sanitizeToolParams(params: Record<string, any>, toolName?: string): Record<string, any> {
    // claves que deben ser numéricas (agregar otras si es necesario)
    const numericKeys = new Set(['hotel_id', 'pax', 'guests', 'num_guests', 'nights', 'rooms', 'hotelId', 'paxes']);
    if (!params || typeof params !== 'object') return params;
    const out: Record<string, any> = { ...params };
    for (const key of Object.keys(out)) {
        const val = out[key];
        if (typeof val === 'string' && numericKeys.has(key)) {
            const n = Number(val);
            if (!Number.isNaN(n)) out[key] = n;
        }
        // Si vienen números como strings dentro de objetos anidados simples, opcionalmente convertir:
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            for (const k2 of Object.keys(val)) {
                if (typeof val[k2] === 'string' && numericKeys.has(k2)) {
                    const n2 = Number(val[k2]);
                    if (!Number.isNaN(n2)) val[k2] = n2;
                }
            }
            out[key] = val;
        }
    }
    return out;
}

/**
 * Helper: enmascara headers sensibles para logging (no imprimir api keys)
 */
function maskHeaders(headers: Record<string, any> | HeadersInit | undefined) {
    // normalizar a objeto simple
    const out: Record<string, any> = {};
    if (!headers) return out;
    if (headers instanceof Headers) {
        headers.forEach((v, k) => out[k] = v);
    } else if (typeof headers === 'object') {
        Object.assign(out, headers as Record<string, any>);
    }
    if (out['Authorization']) out['Authorization'] = out['Authorization'].replace(/(Bearer\s+).+/, '$1****');
    if (out['api-key']) out['api-key'] = '****';
    if (out['x-api-key']) out['x-api-key'] = '****';
    return out;
}

/**
 * Wrapper para llamadas HTTP al proveedor LLM con logging y manejo específico de 404 sin body.
 * Reemplaza llamadas directas a fetch(...) usadas para llamar al LLM.
 */
async function safeFetchLLM(url: string, opts: RequestInit = {}, provider?: string) {
    // No loguear body completo si contiene keys sensibles; loguear tamaño/keys
    const safeHeaders = maskHeaders(opts.headers);
    try {
        console.error(`[LLM] Req -> ${provider ?? 'provider'} ${opts.method || 'POST'} ${url}`);
        console.error('[LLM] Headers:', safeHeaders);
        if (opts.body) {
            const bodyPreview = typeof opts.body === 'string' ? (opts.body.length > 1000 ? opts.body.slice(0, 1000) + '... (truncated)' : opts.body) : '[non-string body]';
            console.error('[LLM] Body preview:', bodyPreview);
        }

        const res = await fetch(url, opts);

        // intentar leer body si existe
        let text: string | null = null;
        try {
            text = await res.text();
        } catch (err) {
            // no pudo leer body
        }

        if (!res.ok) {
            // 404 sin body es lo que vimos: generar mensaje más útil
            const status = res.status;
            const statusText = res.statusText || '';
            const bodySnippet = text && text.length ? (text.length > 1000 ? text.slice(0, 1000) + '... (truncated)' : text) : '<empty body>';
            const msg = `[LLM] Error HTTP ${status} ${statusText} from ${provider || 'provider'} endpoint. Response body: ${bodySnippet}. Request: ${opts.method || 'POST'} ${url} Headers: ${JSON.stringify(safeHeaders)}`;
            console.error(msg);
            const error: any = new Error(`LLM request failed: ${status} ${statusText} - ${bodySnippet}`);
            error.status = status;
            error.statusText = statusText;
            error.responseBody = text;
            throw error;
        }

        // si ok, parsear JSON si posible
        try {
            return JSON.parse(text || '{}');
        } catch {
            return text;
        }
    } catch (err) {
        // Re-throw con más contexto
        console.error('[LLM] safeFetchLLM caught error:', err instanceof Error ? err.message : err);
        throw err;
    }
}

/*
    { changed code }
    Reemplazar la llamada directa al proveedor en generateResponse / makeRequest por safeFetchLLM(url, opts, providerName)
    por ejemplo, si tienes algo así:

    const response = await fetch(fullUrl, { method:'POST', headers, body });

    reemplazar por:

    const result = await safeFetchLLM(fullUrl, { method:'POST', headers, body }, config.provider || 'openai');

    y luego usar result como respuesta parseada.
*/