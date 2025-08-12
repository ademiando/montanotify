import { useState } from 'react';
import ModelSelector from './ModelSelector';

export default function TaskForm({ defaultModel = { provider: 'openai', model: 'gpt-4' } }) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [modelChoice, setModelChoice] = useState(defaultModel);
  const [cronExpr, setCronExpr] = useState('0 8 * * *');
  const [toEmail, setToEmail] = useState('');
  const [channels, setChannels] = useState({ email: true, whatsapp: false });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function toggleChannel(key) {
    setChannels(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setMessage(null);
    if (!name || !prompt) { setMessage({ type: 'error', text: 'Name and prompt are required.' }); return; }
    setLoading(true);
    try {
      const body = {
        name,
        prompt,
        model_provider: modelChoice.provider,
        model: modelChoice.model,
        cron_expr: cronExpr,
        channels: Object.keys(channels).filter(k => channels[k]),
        to_email: toEmail
      };
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data?.ok) {
        setMessage({ type: 'success', text: 'Task created.' });
        setName(''); setPrompt(''); setToEmail('');
      } else {
        setMessage({ type: 'error', text: data?.error || 'Failed to create task' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="space-y-3 mt-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Task name (e.g., Daily crypto brief)" className="w-full px-3 py-2 border rounded" />
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Write the prompt to send to the AI" className="w-full px-3 py-2 border rounded h-28" />
      <div>
        <label className="block text-sm mb-1">Schedule (cron, UTC)</label>
        <input value={cronExpr} onChange={e => setCronExpr(e.target.value)} className="px-3 py-2 border rounded w-full" />
        <div className="text-xs text-gray-600 mt-1">Example: <code>0 8 * * *</code> (daily 08:00 UTC), <code>0 * * * *</code> (hourly)</div>
      </div>

      <div>
        <ModelSelector value={modelChoice} onChange={setModelChoice} />
      </div>

      <div className="flex gap-2 items-center">
        <label className="inline-flex items-center space-x-2">
          <input type="checkbox" checked={channels.email} onChange={() => toggleChannel('email')} /> <span>Email</span>
        </label>
        <label className="inline-flex items-center space-x-2">
          <input type="checkbox" checked={channels.whatsapp} onChange={() => toggleChannel('whatsapp')} /> <span>WhatsApp</span>
        </label>
      </div>

      {channels.email && <input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="Recipient email" className="w-full px-3 py-2 border rounded" />}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Create Task</button>
      </div>

      {message && <div className={`p-2 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>{message.text}</div>}
    </form>
  );
}