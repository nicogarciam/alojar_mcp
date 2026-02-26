#!/usr/bin/env node
/**
 * Inspector Server
 *
 * Este archivo es un punto de entrada para usar el servidor MCP con el @modelcontextprotocol/inspector
 * El inspector espera un servidor que comunique vía stdio (entrada/salida estándar)
 *
 * Uso:
 *   npx @modelcontextprotocol/inspector node dist/inspector.js
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getServer } from './servers/alojar-stream.server.js';
// Asegurarse de que las variables de entorno están cargadas
if (!process.env.ALOJAR_API_TOKEN) {
    console.error('❌ Error: ALOJAR_API_TOKEN no está configurada en las variables de entorno');
    console.error('Por favor, configura el archivo .env en la raíz del proyecto server/');
    process.exit(1);
}
async function main() {
    // Crear el servidor MCP
    const server = getServer();
    // Crear el transporte stdio
    const transport = new StdioServerTransport();
    // Conectar el servidor al transporte
    await server.connect(transport);
    // Log para debugging
    console.error('✅ MCP Server iniciado con transporte Stdio');
    console.error('🔍 Inspector debería ser capaz de descubrir este servidor');
}
// Ejecutar
main().catch((error) => {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
});
// Manejar shutdown graceful
process.on('SIGINT', async () => {
    console.error('\n🛑 Cerrando servidor...');
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.error('\n🛑 Cerrando servidor (SIGTERM)...');
    process.exit(0);
});
