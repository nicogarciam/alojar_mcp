import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";
import { AlojarServer } from "./servers/alojar.server.js";
import { configDotenv } from "dotenv";
import { config } from "./env.js";
import * as dotenv from 'dotenv';

dotenv.config();

const server = new AlojarServer();

server.run().catch(console.error);