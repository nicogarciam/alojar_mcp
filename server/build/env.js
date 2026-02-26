// src/config/env.ts
import * as dotenv from 'dotenv';
import { z } from 'zod'; // Opcional: para validación
// Cargar variables de entorno
dotenv.config();
// Esquema de validación para las variables de entorno (recomendado)
const envSchema = z.object({
    ALOJAR_API_TOKEN: z.string().min(1, "API token es requerido"),
    ALOJAR_API_BASE_URL: z.string().url("URL base debe ser una URL válida"),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});
// Validar y exportar configuración
export const env = envSchema.parse(process.env);
// O exportar sin validación (más simple)
export const config = {
    token: process.env.ALOJAR_API_TOKEN,
    baseUrl: process.env.ALOJAR_API_BASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
};
