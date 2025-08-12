import React from 'react';

export default function ModelSelector({ value = { provider: 'openai', model: 'gpt-4' }, onChange }) {
  const providers = { openai: ['gpt-4', 'gpt-3.5-turbo'], xai: ['grok-1', 'grok-1.1'] };

  function handleProviderChange(e) {
    const provider = e.target.value;
    const model = (providers[provider] && providers[provider][0]) || 'gpt-4';
    onChange && onChange({ provider, model });
  }

  function handleModelChange(e) {
    onChange && onChange({ provider: value.provider, model: e.target.value });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm">AI Provider</label>
      <select value={value.provider} onChange={handleProviderChange} className="px-3 py-2 border rounded w-full">
        <option value="openai">OpenAI</option>
        <option value="xai">xAI (Grok)</option>
      </select>

      <label className="block text-sm mt-2">Model</label>
      <select value={value.model} onChange={handleModelChange} className="px-3 py-2 border rounded w-full">
        {(providers[value.provider] || providers.openai).map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="text-xs text-gray-600 mt-1">Choose which AI provider & model will handle parsing & summarization.</div>
    </div>
  );
}