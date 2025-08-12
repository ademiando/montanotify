import axios from 'axios';

export async function fetchNewsForQuery(q, pageSize = 5) {
  const key = process.env.NEWSAPI_KEY;
  if (!key) {
    throw new Error('NEWSAPI_KEY not set in environment');
  }

  const url = 'https://newsapi.org/v2/everything';
  try {
    const res = await axios.get(url, {
      params: {
        q,
        pageSize,
        sortBy: 'publishedAt',
        language: 'en'
      },
      headers: {
        'X-Api-Key': key
      },
      timeout: 10000
    });

    const data = res.data;
    if (!data || !data.articles) return [];

    return data.articles.map(a => ({
      title: a.title,
      description: a.description || a.content || '',
      url: a.url,
      source: (a.source && a.source.name) || '',
      publishedAt: a.publishedAt
    }));
  } catch (err) {
    console.error('newsFetcher error', err?.message || err);
    return [];
  }
}