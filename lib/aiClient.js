import axios from 'axios';

/**
 * aiClient - universal wrapper for OpenAI and xAI (Grok-like) APIs.
 * - provider: 'openai' or 'xai'
 * - model: model name (string)
 * - messages: array of chat messages
 *
 * For OpenAI we call api.openai.com/v1/chat/completions.
 * For xAI/Grok we attempt to call XAI_API_BASE/v1/chat/completions; set XAI_API_BASE and XAI_API_KEY in env.
 */

async function callOpenAI(messages, model) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const url = 'https://api.openai.com/v1/chat/completions';

  const body = { model, messages, temperature: 0.15, max_tokens: 800 };

  const res = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });

  return res.data?.choices?.[0]?.message?.content || null;
}

async function callXAI(messages, model) {
  const key = process.env.XAI_API_KEY;
  const base = process.env.XAI_API_BASE || 'https://api.grok.ai';
  if (!key) throw new Error('XAI_API_KEY not set');
  const url = `${base}/v1/chat/completions`;
  const body = { model, messages, temperature: 0.15, max_tokens: 800 };
  const res = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    timeout: 20000
  });
  return res.data?.choices?.[0]?.message?.content || null;
}

export async function aiChat({ provider = 'openai', model = 'gpt-4', messages = [] }) {
  if (provider === 'openai') return await callOpenAI(messages, model);
  if (provider === 'xai') return await callXAI(messages, model);
  throw new Error(`Unknown provider: ${provider}`);
}