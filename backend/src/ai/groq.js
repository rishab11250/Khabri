/**
 * Adapts Groq's OpenAI-compatible chat completions endpoint to the AI router interface.
 * Deliberately text/JSON-only (no vision method) so the router excludes Groq from photo intake.
 */
import axios from 'axios';

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

function normalizeGroqError(err) {
  const status = err?.response?.status ?? err?.status;
  if (status === 429) {
    err.status = 429;
    err.isRateLimit = true;
  }
  return err;
}

/**
 * Builds a Groq chat adapter for JSON and plain-text fallback calls.
 *
 * @param {object} [options] - API key, model identifier, router alias, and HTTP client override.
 * @param {string} [options.apiKey] - Groq API secret key (`gsk_...`).
 * @param {string} [options.model] - Groq model identifier (e.g. `qwen/qwen3.8-27b`).
 * @param {string} [options.keyAlias] - Quota/circuit tracking alias (`groq_a` or `groq_b`).
 * @param {object} [options.httpClient] - Axios-compatible HTTP client for testing.
 * @returns {{ provider: string, keyAlias: string, isConfigured: () => boolean, callChat: Function, generateJson: Function, generateText: Function }} Groq adapter.
 */
export function createGroqAdapter({ apiKey, model, keyAlias = 'groq_a', httpClient = axios } = {}) {
  return {
    provider: 'groq',
    keyAlias,
    isConfigured: () => Boolean(apiKey),

    async callChat({ prompt, systemInstruction, jsonMode = false }) {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
      }
      messages.push({ role: 'user', content: prompt });

      try {
        const res = await httpClient.post(
          GROQ_CHAT_URL,
          {
            model,
            messages,
            temperature: 0.2,
            ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          },
          {
            timeout: 15000,
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );
        return res.data?.choices?.[0]?.message?.content || '';
      } catch (err) {
        throw normalizeGroqError(err);
      }
    },

    async generateJson({ prompt, systemInstruction }) {
      const text = await this.callChat({ prompt, systemInstruction, jsonMode: true });
      return JSON.parse(text || '{}');
    },

    generateText({ prompt, systemInstruction }) {
      return this.callChat({ prompt, systemInstruction, jsonMode: false });
    },
  };
}
