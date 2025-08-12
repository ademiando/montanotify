import { supabaseAdmin } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, mode, topics = '', prompt = '', freq = 'daily', send_time = null, timezone = 'UTC', model_provider = 'openai', model = process.env.OPENAI_MODEL || 'gpt-4' } = req.body || {};
  if (!email || !mode) return res.status(400).json({ error: 'Missing fields' });

  try {
    if (mode === 'filter') {
      const tlist = topics.split(',').map(s => s.trim()).filter(Boolean);
      if (!tlist.length) return res.status(400).json({ error: 'No topics' });

      const rows = tlist.map(topic => ({
        email,
        topic,
        mode: 'filter',
        prompt: null,
        model_provider,
        model,
        freq: freq === 'hourly' ? 'hourly' : 'daily',
        timezone,
        send_time,
        unsubscribe_token: uuidv4()
      }));

      const { data, error } = await supabaseAdmin.from('subscriptions').upsert(rows, { onConflict: 'email,topic' }).select();
      if (error) { console.error('Supabase upsert', error); return res.status(500).json({ error: 'DB error' }); }
      return res.status(200).json({ ok: true, added: data.length || rows.length });
    } else if (mode === 'prompt') {
      if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt required' });
      const row = {
        email,
        topic: '',
        mode: 'prompt',
        prompt,
        model_provider,
        model,
        freq: freq === 'hourly' ? 'hourly' : 'daily',
        timezone,
        send_time,
        unsubscribe_token: uuidv4()
      };
      const { data, error } = await supabaseAdmin.from('subscriptions').insert([row]).select();
      if (error) { console.error('Supabase insert', error); return res.status(500).json({ error: 'DB error' }); }
      return res.status(200).json({ ok: true, added: 1 });
    } else return res.status(400).json({ error: 'Invalid mode' });
  } catch (err) {
    console.error('subscribe error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}