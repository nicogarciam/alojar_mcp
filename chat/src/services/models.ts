export type SupportedProviders = 'openai' | 'deepseek' | 'azure' | 'groq' | 'gemini';

export interface LLMConfig {
    apiKey: string;
    model: string;
    baseURL?: string;
    temperature?: number;
    maxTokens?: number;
    provider?: SupportedProviders;
}


export const getOpenAIConfig = (): LLMConfig => ({
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    provider: 'openai',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
});

export const getDeepSeekConfig = (): LLMConfig => ({
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    provider: 'deepseek',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
});

export const getGroqConfig = (): LLMConfig => ({
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    provider: 'groq',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
});

export const getGeminiConfig = (): LLMConfig => ({
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    baseURL: process.env.GEMINI_BASE_URL || 'https://gemini.googleapis.com/v1beta',
    provider: 'gemini',
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
});

// Backward compatibility exports
export const OpenAIModel = getOpenAIConfig();
export const DeepSeekModel = getDeepSeekConfig();
export const GroqModel = getGroqConfig();
export const GeminiModel = getGeminiConfig();

export const getLLMConfig = (provider: SupportedProviders): LLMConfig => {
    switch (provider) {
        case 'openai':
            return getOpenAIConfig();
        case 'deepseek':
            return getDeepSeekConfig();
        case 'groq':
            return getGroqConfig();
        case 'gemini':
            return getGeminiConfig();
        default:
            return getGeminiConfig();
    }
};


