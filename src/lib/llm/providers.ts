// src/lib/llm/providers.ts
import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';

/**
 * Supported models with pricing estimates per 1M tokens.
 * Values: [input, output] in USD.
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
    // Claude models
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-sonnet-20240620': { input: 3.00, output: 15.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },

    // OpenAI models
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },

    // Gemini models
    'gemini-2.5-pro': { input: 2.50, output: 10.00 },
    'gemini-2.5-flash': { input: 0.15, output: 0.60 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
};

/**
 * Returns the correct Vercel AI SDK language model instance based on the string name.
 */
export function getLLMProvider(modelName: string) {
    if (modelName.startsWith('claude')) {
        // Automatically map to stable versions for accounts that don't have access to 20241022 yet
        let actualModelName = modelName;
        if (modelName === 'claude-3-5-haiku-20241022') {
            actualModelName = 'claude-3-haiku-20240307';
        } else if (modelName === 'claude-3-5-sonnet-20241022') {
            actualModelName = 'claude-3-5-sonnet-20240620';
        }
        return anthropic(actualModelName);
    }

    if (modelName.startsWith('gpt')) {
        return openai(modelName);
    }

    if (modelName.startsWith('gemini')) {
        return google(modelName);
    }

    // Fallback
    return anthropic('claude-3-haiku-20240307');
}

/**
 * Calculate cost based on tokens used.
 * Returns cost in dollars.
 */
export function calculateCost(modelName: string, promptTokens: number, completionTokens: number): number {
    const customModelName = modelName.toLowerCase();

    // Try exact match
    let pricing = MODEL_PRICING[customModelName];

    // Try fallback logic
    if (!pricing) {
        if (customModelName.includes('haiku')) pricing = MODEL_PRICING['claude-3-5-haiku-20241022'];
        else if (customModelName.includes('sonnet')) pricing = MODEL_PRICING['claude-3-5-sonnet-20241022'];
        else if (customModelName.includes('mini')) pricing = MODEL_PRICING['gpt-4o-mini'];
        else if (customModelName.includes('gpt-4o')) pricing = MODEL_PRICING['gpt-4o'];
        else if (customModelName.includes('gemini') && customModelName.includes('2.5') && customModelName.includes('pro')) pricing = MODEL_PRICING['gemini-2.5-pro'];
        else if (customModelName.includes('gemini') && customModelName.includes('2.5') && customModelName.includes('flash')) pricing = MODEL_PRICING['gemini-2.5-flash'];
        else if (customModelName.includes('gemini-1.5-flash')) pricing = MODEL_PRICING['gemini-1.5-flash'];
        else if (customModelName.includes('gemini') && customModelName.includes('pro')) pricing = MODEL_PRICING['gemini-1.5-pro'];
        else pricing = MODEL_PRICING['claude-3-5-haiku-20241022']; // Default fallback
    }

    const inputCost = (promptTokens / 1_000_000) * pricing.input;
    const outputCost = (completionTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
}
