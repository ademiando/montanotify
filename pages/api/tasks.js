import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.from('tasks').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) { console.error(error); return res.status(500).json({ error: 'DB error' }); }
    return res.status(200).json({ ok: true, tasks: data });
  } else if (req.method === 'POST') {
    const body = req.body || {};
    const row = {
      owner_email: body.owner_email || body.to_email || 'anonymous',
      name: body.name || 'task',
      prompt: body.prompt,
      model_provider: body.model_provider || 'openai',
      model: body.model || process.env.OPENAI_MODEL || 'gpt-4',
      cron_expr: body.cron_expr,
      timezone: body.timezone || 'UTC',
      channels: body.channels || ['email'],
      to_email: body.to_email || null,
      to_whatsapp: body.to_whatsapp || null,
      enabled: body.enabled !== false
    };
    try {
      const { data, error } = await supabaseAdmin.from('tasks').insert([row]).select();
      if (error) { console.error(error); return res.status(500).json({ error: 'DB error' }); }
      return res.status(200).json({ ok: true, task: data[0] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  } else return res.status(405).json({ error: 'Method not allowed' });
}