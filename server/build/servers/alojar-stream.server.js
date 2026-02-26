import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCollectUserInfoTool } from '../tools/alojar/collect-user-info.tool.js';
import { registerCheckAvailabilityTool } from '../tools/alojar/check-availability.tool.js';
import { registerListAccommodationPricesTool } from '../tools/alojar/list-accommodation-prices.tool.js';
import { registerShowAccommodationDetailTool } from '../tools/alojar/show-accommodation-detail.tool.js';
// Check for OAuth flag
const useOAuth = process.argv.includes('--oauth');
const strictOAuth = process.argv.includes('--oauth-strict');
// Create an MCP server with implementation details
export const getServer = () => {
    const server = new McpServer({
        name: 'alojar-streamable-http-server',
        version: '1.0.0',
    }, { capabilities: { logging: {} } });
    // Register a tool for collecting user information
    registerCollectUserInfoTool(server);
    registerCheckAvailabilityTool(server);
    registerListAccommodationPricesTool(server);
    registerShowAccommodationDetailTool(server);
    // registerAllTools(server);
    // Create a simple resource at a fixed URI
    server.registerResource('greeting-resource', 'https://example.com/greetings/default', {
        title: 'Default Greeting', // Display name for UI
        description: 'A simple greeting resource',
        mimeType: 'text/plain'
    }, async () => {
        return {
            contents: [
                {
                    uri: 'https://example.com/greetings/default',
                    text: 'Hello, world!'
                }
            ]
        };
    });
    // Create additional resources for ResourceLink demonstration
    server.registerResource('example-file-1', 'file:///example/file1.txt', {
        title: 'Example File 1',
        description: 'First example file for ResourceLink demonstration',
        mimeType: 'text/plain'
    }, async () => {
        return {
            contents: [
                {
                    uri: 'file:///example/file1.txt',
                    text: 'This is the content of file 1'
                }
            ]
        };
    });
    server.registerResource('example-file-2', 'file:///example/file2.txt', {
        title: 'Example File 2',
        description: 'Second example file for ResourceLink demonstration',
        mimeType: 'text/plain'
    }, async () => {
        return {
            contents: [
                {
                    uri: 'file:///example/file2.txt',
                    text: 'This is the content of file 2'
                }
            ]
        };
    });
    return server;
};
