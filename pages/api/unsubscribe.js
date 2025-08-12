import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req, res) {
  const token = req.query.token;
  if (!token) return res.status(400).send('<h3>Invalid unsubscribe link</h3>');
  try {
    const { data, error } = await supabaseAdmin.from('subscriptions').delete().eq('unsubscribe_token', token);
    if (error) { console.error('unsubscribe error', error); return res.status(500).send('<h3>Unable to process unsubscribe. Try again later.</h3>'); }
    if (!data || data.length === 0) return res.status(200).send('<h3>No subscription found for this link (or already unsubscribed).</h3>');
    return res.status(200).send('<h3>You have been unsubscribed. Thank you.</h3>');
  } catch (err) {
    console.error('unsubscribe exception', err);
    return res.status(500).send('<h3>Server error while unsubscribing</h3>');
  }
}