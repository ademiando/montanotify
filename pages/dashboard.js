export default function Dashboard() {
  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">Dashboard (Read-only)</h1>
      <p>Check Vercel logs and Supabase tables (<code>subscriptions</code>, <code>tasks</code>) for activity.</p>
      <div className="mt-4">
        <a href="/api/health" className="px-3 py-2 bg-blue-600 text-white rounded">Check API Health</a>
      </div>
    </div>
  );
}