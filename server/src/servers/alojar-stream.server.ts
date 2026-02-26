import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    CallToolResult,
    GetPromptResult,
    PrimitiveSchemaDefinition,
    ReadResourceResult, ResourceLink
} from "@modelcontextprotocol/sdk/types.js";
import { registerCollectUserInfoTool } from '../tools/alojar/collect-user-info.tool.js';
import { registerAllTools } from '../tools/alojar/register-all-tools.js';
import { register } from 'node:module';
import { registerCheckAvailabilityTool } from '../tools/alojar/check-availability.tool.js';
import { registerListAccommodationPricesTool } from '../tools/alojar/list-accommodation-prices.tool.js';
import { registerShowAccommodationDetailTool } from '../tools/alojar/show-accommodation-detail.tool.js';
import { registerCreateBookingTool } from '../tools/alojar/create-booking.tool.js';
import { registerListUsersTool } from '../tools/alojar/list-users.tool.js';
import { registerCreateUserTool } from '../tools/alojar/create-user.tool.js';
import { registerSearchCustomersTool } from '../tools/alojar/search-customers.tool.js';
import { registerCreateCustomerTool } from '../tools/alojar/create-customer.tool.js';

// Check for OAuth flag
const useOAuth = process.argv.includes('--oauth');
const strictOAuth = process.argv.includes('--oauth-strict');

// Create an MCP server with implementation details
export const getServer = () => {
    const server = new McpServer(
        {
            name: 'alojar-streamable-http-server',
            version: '1.0.0',
        },
        { capabilities: { logging: {} } }
    );

    // Register a tool for collecting user information
    //registerCollectUserInfoTool(server);
    registerCheckAvailabilityTool(server);
    // registerListAccommodationPricesTool(server);
    registerShowAccommodationDetailTool(server);
    registerCreateBookingTool(server);
    
    registerSearchCustomersTool(server);
    registerCreateCustomerTool(server);

     //registerListUsersTool(server);
    //registerCreateUserTool(server);

    // registerAllTools(server);
    // Create a simple resource at a fixed URI
   /* server.registerResource(
        'greeting-resource',
        'https://example.com/greetings/default',
        {
            title: 'Default Greeting', // Display name for UI
            description: 'A simple greeting resource',
            mimeType: 'text/plain'
        },
        async (): Promise<ReadResourceResult> => {
            return {
                contents: [
                    {
                        uri: 'https://example.com/greetings/default',
                        text: 'Hello, world!'
                    }
                ]
            };
        }
    );*/

    // Create additional resources for ResourceLink demonstration
    /*server.registerResource(
        'example-file-1',
        'file:///example/file1.txt',
        {
            title: 'Example File 1',
            description: 'First example file for ResourceLink demonstration',
            mimeType: 'text/plain'
        },
        async (): Promise<ReadResourceResult> => {
            return {
                contents: [
                    {
                        uri: 'file:///example/file1.txt',
                        text: 'This is the content of file 1'
                    }
                ]
            };
        }
    );*/

    /*server.registerResource(
        'example-file-2',
        'file:///example/file2.txt',
        {
            title: 'Example File 2',
            description: 'Second example file for ResourceLink demonstration',
            mimeType: 'text/plain'
        },
        async (): Promise<ReadResourceResult> => {
            return {
                contents: [
                    {
                        uri: 'file:///example/file2.txt',
                        text: 'This is the content of file 2'
                    }
                ]
            };
        }
    );*/

    return server;
};

