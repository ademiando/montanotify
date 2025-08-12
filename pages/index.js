import { useEffect, useState } from 'react';
import TopicSelector from '../components/TopicSelector';
import ModelSelector from '../components/ModelSelector';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

/**
 * Landing page & primary UI.
 */
export default function Home() {
  const [mode, setMode] = useState('filter'); // filter | prompt
  const [topics, setTopics] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [modelChoice, setModelChoice] = useState({ provider: 'openai', model: 'gpt-4' });
  const [email, setEmail] = useState('');
  const [freq, setFreq] = useState('daily');
  const [sendTime, setSendTime] = useState('08:00'); // HH:MM
  const [timezone, setTimezone] = useState('UTC');
  const [previewResult, setPreviewResult] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [message, setMessage] = useState(null);

  async function handlePreview() {
    setPreviewResult(null);
    setMessage(null);
    setLoadingPreview(true);
    try {
      const body = {
        mode,
        topics: topics.join(','),
        prompt,
        model_provider: modelChoice.provider,
        model: modelChoice.model
      };
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data?.ok) setPreviewResult(data);
      else setMessage({ type: 'error', text: data?.error || 'Preview failed' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const body = {
        email,
        mode,
        topics: topics.join(','),
        prompt,
        freq,
        send_time: sendTime,
        timezone,
        model_provider: modelChoice.provider,
        model: modelChoice.model
      };
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data?.ok) {
        setMessage({ type: 'success', text: 'Subscribed! Check your email (or spam).' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: data?.error || 'Subscription failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Network error' });
    }
  }

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">MontaNotify — Automated AI Tasks</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubscribe} className="card">
          <h2 className="text-lg font-semibold mb-3">Quick Subscribe / Task</h2>

          <div className="mb-3">
            <label className="block text-sm mb-1">Mode</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode('filter')} className={`px-3 py-2 rounded ${mode === 'filter' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Filter</button>
              <button type="button" onClick={() => setMode('prompt')} className={`px-3 py-2 rounded ${mode === 'prompt' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Prompt</button>
            </div>
          </div>

          {mode === 'filter' ? (
            <>
              <label className="block mb-2 text-sm">Topics</label>
              <TopicSelector onChange={(t) => setTopics(t)} />
            </>
          ) : (
            <>
              <label className="block mb-2 text-sm">Custom Prompt</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full p-2 border rounded h-28" placeholder="e.g. Summarize top AI funding news in SEA this week" />
            </>
          )}

          <div className="mt-3">
            <ModelSelector value={modelChoice} onChange={setModelChoice} />
          </div>

          <div className="mt-3">
            <label className="block text-sm mb-1">Frequency</label>
            <div className="flex gap-2 items-center">
              <select value={freq} onChange={(e) => setFreq(e.target.value)} className="px-3 py-2 border rounded">
                <option value="daily">Daily</option>
                <option value="hourly">Hourly</option>
              </select>
              <input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="px-2 py-2 border rounded" />
              <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="px-2 py-2 border rounded w-32" />
            </div>
            <div className="text-xs text-gray-600 mt-1">Timezone (default UTC). For hourly frequency, send_time is used as preferred minute/hour but scheduler applies cadence rules.</div>
          </div>

          <label className="block mt-3 mb-2 text-sm">Delivery Email</label>
          <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full px-3 py-2 border rounded mb-3" />

          <div className="flex gap-3">
            <button type="button" onClick={handlePreview} disabled={loadingPreview} className="px-4 py-2 bg-yellow-500 text-white rounded">Preview</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Subscribe</button>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Preview / Tasks</h2>
          {previewResult ? (
            <div>
              <h3 className="font-medium mb-2">{previewResult.title}</h3>
              <p className="mb-2">{previewResult.summary}</p>
              <h4 className="font-semibold">Notes</h4>
              <ul className="list-disc pl-5">
                <li><strong>Impact:</strong> {previewResult.bullets?.impact}</li>
                <li><strong>Opportunity:</strong> {previewResult.bullets?.opportunity}</li>
                <li><strong>Risk:</strong> {previewResult.bullets?.risk}</li>
              </ul>
              <h4 className="font-semibold mt-3">Sources</h4>
              <ul className="list-disc pl-5">
                {previewResult.articles?.map((a, i) => (
                  <li key={i}><a href={a.url} className="text-blue-600" target="_blank" rel="noreferrer">{a.title}</a> — <small>{a.source}</small></li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No preview available. Use Preview to test the prompt or topics.</div>
          )}

          <hr className="my-4" />

          <h3 className="font-medium">Create scheduled tasks</h3>
          <TaskForm defaultModel={modelChoice} />
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="text-lg font-semibold mb-3">Your Scheduled Tasks</h2>
        <TaskList />
      </div>
    </div>
  );
}