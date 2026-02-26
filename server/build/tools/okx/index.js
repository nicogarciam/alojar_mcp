import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
const OKX_API_BASE = "https://www.okx.com/api/v5";
const USER_AGENT = "okx-app/1.0";
const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };
export class OKXServer {
    server;
    constructor() {
        console.error('[Setup] Initializing OKX MCP server...');
        this.server = new Server({
            name: 'okx-mcp-server',
            version: '0.1.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupToolHandlers();
        this.server.onerror = (error) => console.error('[Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'get_price',
                    description: 'Get latest price for an OKX instrument',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            instrument: {
                                type: 'string',
                                description: 'Instrument ID (e.g. BTC-USDT)',
                            },
                        },
                        required: ['instrument'],
                    },
                },
                {
                    name: 'get_candlesticks',
                    description: 'Get candlestick data for an OKX instrument',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            instrument: {
                                type: 'string',
                                description: 'Instrument ID (e.g. BTC-USDT)',
                            },
                            bar: {
                                type: 'string',
                                description: 'Time interval (e.g. 1m, 5m, 1H, 1D)',
                                default: '1m'
                            },
                            limit: {
                                type: 'number',
                                description: 'Number of candlesticks (max 100)',
                                default: 100
                            }
                        },
                        required: ['instrument'],
                    },
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            console.info(`[API] Calling tool: ${request.params.name}`);
            try {
                if (!['get_price', 'get_candlesticks'].includes(request.params.name)) {
                    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
                }
                const args = request.params.arguments;
                console.info(`[API] Tool arguments: ${JSON.stringify(args)}`);
                if (!args.instrument) {
                    throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: instrument');
                }
                if (request.params.name === 'get_price') {
                    console.error(`[API] Fetching price for instrument: ${args.instrument}`);
                    const headers = {
                        "User-Agent": USER_AGENT,
                        Accept: "application/geo+json",
                    };
                    const url = OKX_API_BASE + '/market/ticker';
                    const params = { instId: args.instrument };
                    try {
                        console.info(`[API] Calling tool: ${request.params.name}`);
                        const response = await fetch(url, { headers });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const ticker = await response.json();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        instrument: ticker.instId,
                                        lastPrice: ticker.last,
                                        bid: ticker.bidPx,
                                        ask: ticker.askPx,
                                        high24h: ticker.high24h,
                                        low24h: ticker.low24h,
                                        volume24h: ticker.vol24h,
                                        timestamp: new Date(parseInt(ticker.ts)).toISOString(),
                                    }, null, 2),
                                },
                            ],
                        };
                    }
                    catch (error) {
                        console.error("Error making OKX request:", error);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                                }
                            ]
                        };
                        ;
                    }
                }
                else {
                    // get_candlesticks
                    console.error(`[API] Fetching candlesticks for instrument: ${args.instrument}, bar: ${args.bar || '1m'}, limit: ${args.limit || 100}`);
                    const headers = {
                        "User-Agent": USER_AGENT,
                        Accept: "application/geo+json",
                    };
                    const url = OKX_API_BASE + '/market/candles';
                    const params = {
                        instId: args.instrument,
                        bar: args.bar || '1m',
                        limit: args.limit || 100
                    };
                    try {
                        const response = await fetch(url, { headers });
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        const candles = await response.json();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(candles.map(({ time, open, high, low, close, vol, volCcy }) => ({
                                        timestamp: new Date(parseInt(time)).toISOString(),
                                        open,
                                        high,
                                        low,
                                        close,
                                        volume: vol,
                                        volumeCurrency: volCcy
                                    })), null, 2),
                                },
                            ],
                        };
                    }
                    catch (error) {
                        console.error("Error making OKX request:", error);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                                }
                            ]
                        };
                        ;
                    }
                }
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error('[Error] Failed to fetch data:', error);
                    throw new McpError(ErrorCode.InternalError, `Failed to fetch data: ${error.message}`);
                }
                throw error;
            }
        });
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('OKX MCP server running on stdio');
    }
}
