import { AlojarServer } from "./servers/alojar.server.js";
import * as dotenv from 'dotenv';
dotenv.config();
const server = new AlojarServer();
server.run().catch(console.error);
