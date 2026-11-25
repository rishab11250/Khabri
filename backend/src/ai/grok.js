import axios from 'axios';

const XAI_CHAT_URL = 'https://api.x.ai/v1/chat/completions';

function normalizeGrokError(err) {
  const status = err?.response?.status ?? err?.status;
  if (status === 429) {
    err.status = 429;
    err.isRateLimit = true;
  }
  return err;
}

export function createGrokAdapter({ apiKey, model, keyAlias = 'grok_1', httpClient = axios } = {}) {
  return {
    provider: 'grok',
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
          XAI_CHAT_URL,
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
        throw normalizeGrokError(err);
      }
    },

    async generateJson({ prompt, systemInstruction }) {
      const text = await this.callChat({ prompt, systemInstruction, jsonMode: true });
      return JSON.parse(text || '{}');
    },

    async generateText({ prompt, systemInstruction }) {
      return this.callChat({ prompt, systemInstruction, jsonMode: false });
    },
  };
}
