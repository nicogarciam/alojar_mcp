export type SupportedProviders = 'openai' | 'deepseek' | 'azure' | 'groq' | 'gemini';

export interface LLMConfig {
    apiKey: string;
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: SupportedProviders;
}


export const OpenAIModel: LLMConfig = {
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-5-mini', //gpt-3.5-turbo
    baseURL: 'https://api.openai.com/v1',
    provider: 'openai', // Por defecto OpenAI
    temperature: 0.7,
    maxTokens: 1000,
};

export const DeepSeekModel: LLMConfig = {
    apiKey: process.env.DEEPSEEK_API_KEY!,
    model: 'deepseek-chat',
    baseURL: 'https://api.deepseek.com/v1',
    provider: 'deepseek',
    temperature: 0.7,
    maxTokens: 1000,
};


export const GroqModel: LLMConfig = {
    apiKey: process.env.GROQ_API_KEY!,
    model: 'llama-3.3-70b-versatile',
    baseURL: 'https://api.groq.com/openai/v1',
    provider: 'groq',
    temperature: 0.7,
    maxTokens: 1000,
};

// Configuración para Gemini (Google Generative Models)
export const GeminiModel: LLMConfig = {
    apiKey: process.env.GEMINI_API_KEY!,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', // ajusta según el modelo que uses
    baseURL: process.env.GEMINI_BASE_URL || 'https://gemini.googleapis.com/v1beta', // opcional, ajusta según integración
    provider: 'gemini',
    temperature: 0.7,
    maxTokens: 1000,
};


export const getLLMConfig = (provider: SupportedProviders): LLMConfig => {

    switch (provider) {
        case 'openai':
            return OpenAIModel;
        case 'deepseek':
            return DeepSeekModel;
        case 'azure':
            return GeminiModel;
        case 'groq':
            return GroqModel;
        case 'gemini':
            return GeminiModel;
        default:
            return OpenAIModel;
    }
};


