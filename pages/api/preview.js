import { fetchNewsForQuery } from '../../lib/newsFetcher';
import { aiChat } from '../../lib/aiClient';
import { summarizeArticlesWithAI } from '../../lib/aiSummarizer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { mode, topics, prompt, model_provider, model } = req.body || {};
  if (!mode) return res.status(400).json({ error: 'Missing mode' });

  try {
    let query = '';
    if (mode === 'filter') {
      const tlist = (topics || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!tlist.length) return res.status(400).json({ error: 'No topics provided' });
      query = tlist.join(' OR ');
    } else {
      if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt required' });
      const parseSystem = `You are a helper that translates a user's natural language request into a concise search query suitable for use with NewsAPI.org's q parameter. Output only the query string.`;
      const parseUser = `User request: ${prompt}\n\nReturn ONLY the query string (no explanation).`;
      const parseMessages = [
        { role: 'system', content: parseSystem },
        { role: 'user', content: parseUser }
      ];
      try {
        const parsed = await aiChat({ provider: model_provider || 'openai', model: model || process.env.OPENAI_MODEL || 'gpt-4', messages: parseMessages });
        query = (parsed || '').split('\n')[0].trim();
        if (!query) query = prompt.split(/\s+/).slice(0, 8).join(' ');
      } catch (err) {
        console.warn('Parsing via AI failed, fallback to keyword extraction', err?.message || err);
        query = prompt.split(/\s+/).slice(0, 8).join(' ');
      }
    }

    const articles = await fetchNewsForQuery(query, 5);
    if (!articles || articles.length === 0) {
      return res.status(200).json({ ok: true, title: `No articles found for "${query}"`, summary: '', bullets: {}, articles: [] });
    }

    const summaryObj = await summarizeArticlesWithAI({
      topicLabel: mode === 'filter' ? (topics || query) : (prompt || query),
      articles,
      provider: model_provider || 'openai',
      model: model || process.env.OPENAI_MODEL || 'gpt-4'
    });

    if (!summaryObj) {
      return res.status(500).json({ error: 'Summarization failed' });
    }

    return res.status(200).json({
      ok: true,
      title: `Brief for ${mode === 'filter' ? (topics || query) : 'custom prompt'}`,
      summary: summaryObj.summary,
      bullets: summaryObj.bullets,
      articles
    });
  } catch (err) {
    console.error('preview error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}