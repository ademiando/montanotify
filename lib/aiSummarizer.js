import { aiChat } from './aiClient.js';

export async function summarizeArticlesWithAI({ topicLabel, articles = [], provider = 'openai', model = 'gpt-4' }) {
  if (!articles || articles.length === 0) return null;

  const articleList = articles
    .map((a, i) => `${i + 1}. (${a.source}) ${a.title}\n${a.description || ''}`)
    .join('\n\n');

  const systemPrompt = `You are an expert news summarizer. Produce a concise executive summary of the provided recent articles about "${topicLabel}" (150-220 words). Then provide three short bullet points labeled Impact, Opportunity, Risk. Use clear, non-technical language.`;

  const userPrompt = `Here are the recent articles:\n\n${articleList}\n\nOutput format exactly like this:\n\nSUMMARY:\n<one-paragraph summary 150-220 words>\n\nIMPACT:\n- <one short sentence>\n\nOPPORTUNITY:\n- <one short sentence>\n\nRISK:\n- <one short sentence>\n`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    const text = await aiChat({ provider, model, messages });
    return parseOutput(text);
  } catch (err) {
    console.warn('Primary AI call failed', err?.message || err);
    if (provider !== 'openai') {
      try {
        const text = await aiChat({ provider: 'openai', model: process.env.OPENAI_MODEL || 'gpt-4', messages });
        return parseOutput(text);
      } catch (err2) {
        console.error('Fallback OpenAI call failed', err2?.message || err2);
        return null;
      }
    }
    return null;
  }
}

function parseOutput(raw) {
  if (!raw) return null;
  const out = { summary: '', bullets: { impact: '', opportunity: '', risk: '' } };
  const lines = raw.split(/\n/).map(s => s.trim());
  let mode = 'summary';
  const summaryParts = [];
  for (const line of lines) {
    if (/^IMPACT[:\-]/i.test(line)) { mode = 'impact'; continue; }
    if (/^OPPORTUNITY[:\-]/i.test(line)) { mode = 'opportunity'; continue; }
    if (/^RISK[:\-]/i.test(line)) { mode = 'risk'; continue; }
    if (mode === 'summary') summaryParts.push(line);
    else if (mode === 'impact' && line) out.bullets.impact += ' ' + line.replace(/^-+\s*/, '');
    else if (mode === 'opportunity' && line) out.bullets.opportunity += ' ' + line.replace(/^-+\s*/, '');
    else if (mode === 'risk' && line) out.bullets.risk += ' ' + line.replace(/^-+\s*/, '');
  }
  out.summary = summaryParts.join(' ').trim();
  out.bullets.impact = (out.bullets.impact || '').trim();
  out.bullets.opportunity = (out.bullets.opportunity || '').trim();
  out.bullets.risk = (out.bullets.risk || '').trim();
  return out;
}