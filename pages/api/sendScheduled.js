import { supabaseAdmin } from '../../lib/supabase';
import { fetchNewsForQuery } from '../../lib/newsFetcher';
import { summarizeArticlesWithAI } from '../../lib/aiSummarizer';
import { sendEmail, buildNewsletterHtml } from '../../lib/email';
import { sendWhatsApp } from '../../lib/whatsapp';
import { aiChat } from '../../lib/aiClient';
import cronParser from 'cron-parser';

/**
 * sendScheduled:
 * - protected by x-scheduler-secret header
 * - loads enabled tasks and subscriptions
 * - groups jobs by prompt+provider+model to batch fetch/summarize
 * - sends results to configured channels (email, whatsapp)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = req.headers['x-scheduler-secret'] || req.headers['x-scheduler-secret'.toLowerCase()];
  if (!process.env.ACTION_SECRET || !secret || secret !== process.env.ACTION_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // load tasks and prompt-based subscriptions
    const { data: tasks } = await supabaseAdmin.from('tasks').select('*').eq('enabled', true);
    const { data: subs } = await supabaseAdmin.from('subscriptions').select('*').in('mode', ['prompt']); // prompt-mode subscriptions

    const jobs = [];
    const now = new Date();

    // Evaluate tasks by cron expression (UTC)
    for (const t of tasks || []) {
      try {
        const interval = cronParser.parseExpression(t.cron_expr, { tz: t.timezone || 'UTC' });
        const prev = interval.prev();
        const prevDate = prev.toDate();
        const lastRun = t.last_run ? new Date(t.last_run) : null;
        if (!lastRun || lastRun < prevDate) {
          if (prevDate <= now) {
            jobs.push({
              type: 'task',
              id: t.id,
              name: t.name,
              prompt: t.prompt,
              provider: t.model_provider,
              model: t.model,
              channels: t.channels,
              to_email: t.to_email,
              to_whatsapp: t.to_whatsapp
            });
          }
        }
      } catch (e) {
        console.warn('cron parse error for task', t.id, e?.message || e);
        continue;
      }
    }

    // Subscriptions: simple cadence checks for prompt-mode subs
    for (const s of subs || []) {
      try {
        let should = false;
        const lastSent = s.last_sent ? new Date(s.last_sent) : null;
        if (s.freq === 'hourly') {
          if (!lastSent) should = true;
          else if ((now - lastSent) > 1000 * 60 * 60) should = true;
        } else {
          if (!lastSent) should = true;
          else {
            const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
            const lastUTC = new Date(Date.UTC(lastSent.getUTCFullYear(), lastSent.getUTCMonth(), lastSent.getUTCDate()));
            if (nowUTC > lastUTC) should = true;
          }
        }
        if (should) {
          const prompt = s.prompt || s.topic || '';
          jobs.push({
            type: 'subscription',
            id: s.id,
            name: s.topic || 'subscription',
            prompt,
            provider: s.model_provider || 'openai',
            model: s.model || process.env.OPENAI_MODEL || 'gpt-4',
            channels: ['email'],
            to_email: s.email,
            unsubscribe_token: s.unsubscribe_token
          });
        }
      } catch (e) {
        console.error('subs error', e);
        continue;
      }
    }

    // Group jobs by prompt+provider+model
    const groups = {};
    for (const j of jobs) {
      const key = `${j.prompt}||${j.provider}||${j.model}`;
      if (!groups[key]) groups[key] = { prompt: j.prompt, provider: j.provider, model: j.model, jobs: [] };
      groups[key].jobs.push(j);
    }

    let sent = 0;
    for (const key of Object.keys(groups)) {
      const g = groups[key];
      try {
        const isShort = g.prompt && g.prompt.split(' ').length <= 8;
        let articles = [];
        let summaryObj = null;

        if (isShort) {
          articles = await fetchNewsForQuery(g.prompt, 5);
          if (articles && articles.length > 0) {
            summaryObj = await summarizeArticlesWithAI({ topicLabel: g.prompt, articles, provider: g.provider, model: g.model });
          }
        }

        if (!summaryObj) {
          const messages = [{ role: 'system', content: 'You are an assistant that returns concise output for scheduled user tasks.' }, { role: 'user', content: g.prompt }];
          const text = await aiChat({ provider: g.provider, model: g.model, messages });
          summaryObj = { summary: text, bullets: {} };
        }

        for (const job of g.jobs) {
          try {
            const unsubscribeUrl = job.unsubscribe_token ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/unsubscribe?token=${job.unsubscribe_token}` : '';
            const html = buildNewsletterHtml({ title: job.name || 'Your brief', summary: summaryObj.summary || '', bullets: summaryObj.bullets || {}, articles, unsubscribeUrl });
            const subject = `${job.name || 'Brief'} — automated`;

            if (job.channels && job.channels.includes('email') && job.to_email) {
              await sendEmail({ to: job.to_email, subject, html });
            }
            if (job.channels && job.channels.includes('whatsapp') && job.to_whatsapp) {
              const waText = `${job.name}\n\n${(summaryObj.summary || '').slice(0, 2000)}\n\nUnsubscribe: ${unsubscribeUrl}`;
              await sendWhatsApp({ to: job.to_whatsapp, body: waText });
            }

            if (job.type === 'subscription') {
              await supabaseAdmin.from('subscriptions').update({ last_sent: new Date().toISOString() }).eq('id', job.id);
            } else if (job.type === 'task') {
              await supabaseAdmin.from('tasks').update({ last_run: new Date().toISOString() }).eq('id', job.id);
              await supabaseAdmin.from('task_runs').insert([{ task_id: job.id, status: 'ok', result: (summaryObj.summary || '').slice(0, 4000) }]);
            }
            sent++;
          } catch (jobErr) {
            console.error('job send error', job?.id, jobErr);
            if (job.type === 'task') await supabaseAdmin.from('task_runs').insert([{ task_id: job.id, status: 'error', error: String(jobErr) }]);
            continue;
          }
        }
      } catch (groupErr) {
        console.error('group process error', groupErr);
        continue;
      }
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error('sendScheduled error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}