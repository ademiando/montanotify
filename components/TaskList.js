import { useEffect, useState } from 'react';

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data?.ok) setTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading tasks...</div>;
  if (!tasks.length) return <div className="text-sm text-gray-600">No tasks found. Create a task above.</div>;

  return (
    <div className="space-y-3">
      {tasks.map(t => (
        <div key={t.id} className="p-3 border rounded">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-gray-600">{t.cron_expr} — {t.model_provider}:{t.model}</div>
            </div>
            <div className="text-sm text-gray-600">Enabled: {t.enabled ? 'Yes' : 'No'}</div>
          </div>
          <div className="mt-2 text-sm">{t.prompt}</div>
        </div>
      ))}
    </div>
  );
}