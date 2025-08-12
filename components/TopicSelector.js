import { useState } from 'react';

export default function TopicSelector({ onChange, initialTopics = [] }) {
  const defaultList = ['crypto', 'macroeconomics', 'geopolitics', 'innovation', 'ai'];
  const [selected, setSelected] = useState(initialTopics || []);
  const [custom, setCustom] = useState('');

  function toggleTopic(t) {
    const next = selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t];
    setSelected(next);
    onChange && onChange(next);
  }

  function addCustom() {
    const parts = custom.split(',').map(p => p.trim()).filter(Boolean);
    const next = Array.from(new Set([...selected, ...parts]));
    setSelected(next);
    setCustom('');
    onChange && onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {defaultList.map(t => (
          <label key={t} className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={selected.includes(t)} onChange={() => toggleTopic(t)} className="form-checkbox" />
            <span className="text-sm">{t}</span>
          </label>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        <input placeholder="Custom topics (comma separated)" value={custom} onChange={e => setCustom(e.target.value)} className="flex-1 px-3 py-2 border rounded" />
        <button type="button" onClick={addCustom} className="px-3 py-2 bg-blue-600 text-white rounded">Add</button>
      </div>

      <div className="text-sm text-gray-600">Selected: {selected.join(', ') || <em>none</em>}</div>
    </div>
  );
}