/**
 * Wraps the `@google/genai` SDK behind the uniform provider adapter interface.
 * Deliberately normalizes quota/429 responses so the AI router treats every provider uniformly;
 * does not enforce daily quota or circuit state itself.
 */
import { GoogleGenAI } from '@google/genai';

function isRateLimitError(err) {
  const status = err?.status ?? err?.code;
  const msg = String(err?.message || '').toLowerCase();
  return (
    status === 429 ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota')
  );
}

function wrapProviderError(err) {
  if (isRateLimitError(err)) {
    err.status = 429;
    err.isRateLimit = true;
  }
  return err;
}

/**
 * Builds a Gemini provider adapter supporting structured JSON, plain text, and vision prompts.
 *
 * @param {object} [options] - Gemini key, model name, alias, and optional mock SDK client.
 * @param {string} [options.apiKey] - Google Gemini API key.
 * @param {string} [options.model] - Target Gemini model identifier.
 * @param {string} [options.keyAlias] - Router tracking alias (`gemini_a` or `gemini_b`).
 * @param {object} [options.client] - Optional prebuilt `@google/genai` client for testing.
 * @returns {{ provider: string, keyAlias: string, isConfigured: () => boolean, generateJson: Function, generateText: Function, vision: Function }} Configured adapter.
 */
export function createGeminiAdapter({ apiKey, model, keyAlias, client } = {}) {
  const getClient = () => {
    if (client) return client;
    return new GoogleGenAI({ apiKey });
  };

  return {
    provider: 'gemini',
    keyAlias,
    isConfigured: () => Boolean(client || apiKey),

    async generateJson({ prompt, systemInstruction, jsonSchema }) {
      try {
        const ai = getClient();
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: 'application/json',
            ...(jsonSchema ? { responseJsonSchema: jsonSchema } : {}),
            temperature: 0.2,
          },
        });
        return JSON.parse(response.text || '{}');
      } catch (err) {
        throw wrapProviderError(err);
      }
    },

    async generateText({ prompt, systemInstruction }) {
      try {
        const ai = getClient();
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            temperature: 0.3,
          },
        });
        return response.text || '';
      } catch (err) {
        throw wrapProviderError(err);
      }
    },

    async vision({ imageBase64, mimeType, prompt, systemInstruction, jsonSchema }) {
      try {
        const ai = getClient();
        const response = await ai.models.generateContent({
          model,
          contents: [{ inlineData: { data: imageBase64, mimeType } }, prompt],
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            ...(jsonSchema
              ? { responseMimeType: 'application/json', responseJsonSchema: jsonSchema }
              : {}),
            temperature: 0.2,
          },
        });
        return jsonSchema ? JSON.parse(response.text || '{}') : response.text || '';
      } catch (err) {
        throw wrapProviderError(err);
      }
    },
  };
}
