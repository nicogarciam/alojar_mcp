import { Router } from 'express';
import { getLLMConfig, SupportedProviders } from '../services/models.js';

export function createAdminRoutes(): Router {
    const router = Router();

    router.get('/providers', (req, res) => {
        const providers: SupportedProviders[] = ['openai', 'deepseek', 'groq', 'gemini'];
        const configuredProviders = providers.map(p => {
            const config = getLLMConfig(p);
            return {
                id: p,
                name: p.charAt(0).toUpperCase() + p.slice(1),
                isConfigured: !!config.apiKey && config.apiKey.length > 0,
                defaultModel: config.model
            };
        });
        res.json(configuredProviders);
    });

    router.get('/providers/:provider/models', async (req, res) => {
        const provider = req.params.provider as SupportedProviders;
        const config = getLLMConfig(provider);

        if (!config.apiKey) {
            return res.status(400).json({ error: 'Proveedor no configurado (falta API Key)' });
        }

        try {
            if (provider === 'gemini') {
                const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`;
                const response = await fetch(url);
                const data: any = await response.json();
                if (!response.ok) throw new Error(data.error?.message || 'Error fetching Gemini models');
                return res.json(data.models.map((m: any) => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name })));
            } else {
                // OpenAI compatible format (Groq, DeepSeek, OpenAI)
                const baseUrl = config.baseURL || 'https://api.openai.com/v1';
                const response = await fetch(`${baseUrl}/models`, {
                    headers: { 'Authorization': `Bearer ${config.apiKey}` }
                });
                const data: any = await response.json();
                if (!response.ok) throw new Error(data.error?.message || 'Error fetching models');
                return res.json(data.data.map((m: any) => ({ id: m.id, name: m.id })));
            }
        } catch (error: any) {
            console.error('Error fetching models:', error);
            res.status(500).json({ error: error.message || 'Error fetching models' });
        }
    });

    return router;
}
