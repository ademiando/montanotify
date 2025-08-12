import { fetchNewsForQuery } from '../../lib/newsFetcher';
import { summarizeArticlesWithAI } from '../../lib/aiSummarizer';
import { aiChat } from '../../lib/aiClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { mode, topics, prompt, model_provider, model } = req.body || {};

  try {
    let query = '';
    if (mode === 'filter') {
      const tlist = (topics || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!tlist.length) return res.status(400).json({ error: 'No topics' });
      query = tlist.join(' OR ');
    } else {
      if (!prompt) return res.status(400).json({ error: 'No prompt' });
      const parseMessages = [{ role: 'system', content: 'Convert this natural-language request into a concise NewsAPI q= query. Output only the query string.' }, { role: 'user', content: prompt }];
      try {
        const parsed = await aiChat({ provider: model_provider || 'openai', model: model || process.env.OPENAI_MODEL || 'gpt-4', messages: parseMessages });
        query = (parsed || '').split('\n')[0].trim();
      } catch (err) {
        query = prompt.split(/\s+/).slice(0, 8).join(' ');
      }
    }

    const articles = await fetchNewsForQuery(query, 5);
    if (!articles || articles.length === 0) return res.status(200).json({ ok: true, articles: [], summary: null });

    const summary = await summarizeArticlesWithAI({
      topicLabel: mode === 'filter' ? topics : prompt,
      articles,
      provider: model_provider || 'openai',
      model: model || process.env.OPENAI_MODEL || 'gpt-4'
    });

    return res.status(200).json({ ok: true, articles, summary });
  } catch (err) {
    console.error('fetchNow error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}