export default function ApiPage() {
  const endpoints = [
    {
      method: "GET",
      path: "/api/stats",
      desc: "Dashboard statistics — total repos scanned, vulnerabilities found/fixed, issues fixed, total cost.",
      response: `{
  "total_repos_scanned": 42,
  "total_vulnerabilities_found": 18,
  "vulnerabilities_fixed": 12,
  "issues_fixed": 7,
  "severity_breakdown": { "high": 5, "medium": 8, "low": 5 },
  "total_cost_usd": 2.4012
}`,
    },
    {
      method: "GET",
      path: "/api/models",
      desc: "Per-model usage statistics — request count, total tokens, and cost grouped by model name.",
      response: `[
  {
    "model": "gpt-4o-mini",
    "requests": 234,
    "tokens": 450000,
    "cost": 0.1234
  }
]`,
    },
    {
      method: "GET",
      path: "/api/repositories",
      desc: "List all scanned repositories. Supports pagination with skip and limit query params.",
      response: `[
  {
    "id": 1,
    "full_name": "user/repo",
    "stars": 1200,
    "code_quality_percent": 85,
    "themes": ["python", "security"],
    "last_scanned_at": "2026-04-01T12:00:00"
  }
]`,
    },
    {
      method: "GET",
      path: "/api/config",
      desc: "Retrieve all swarm configuration key-value pairs from the database.",
      response: `{
  "is_active": true,
  "max_agents": 4,
  "finder_model": "gpt-4o-mini",
  "verifier_model": "gpt-4o-mini",
  "fixer_model": "gpt-4o",
  "github_token": "ghp_...",
  ...
}`,
    },
    {
      method: "POST",
      path: "/api/config",
      desc: "Update swarm configuration. Send a JSON body with a configs object containing key-value pairs to set.",
      response: `// Request body:
{
  "configs": {
    "is_active": true,
    "max_agents": 6,
    "finder_model": "gpt-4o-mini"
  }
}

// Response:
{ "status": "success" }`,
    },
    {
      method: "GET",
      path: "/api/charts",
      desc: "Vulnerability counts grouped by date for the last 7 days (used by the area chart).",
      response: `[
  { "date": "2026-04-01", "count": 5 },
  { "date": "2026-04-02", "count": 3 }
]`,
    },
    {
      method: "GET",
      path: "/api/leaderboard",
      desc: "Top 10 repositories by number of fixed vulnerabilities, with code quality percentage.",
      response: `[
  {
    "repo": "user/repo",
    "fixes": 8,
    "quality": 92
  }
]`,
    },
    {
      method: "GET",
      path: "/api/terminal/{log_id}",
      desc: "Retrieve the full prompt and AI response for a specific terminal log entry (for the log inspector modal).",
      response: `{
  "prompt": "[{\"role\": \"user\", ...}]",
  "response": "Here is the fixed code...",
  "details": "Fixing SQL injection in auth.py",
  "action": "FIXING"
}`,
    },
    {
      method: "WS",
      path: "/ws/terminal",
      desc: "WebSocket endpoint for real-time terminal logs. On connect, receives the last 50 historical logs, then streams new entries as they occur via Redis pub/sub.",
      response: `// Each message is a JSON object:
{
  "id": 123,
  "bot_id": "BOT-1-A42",
  "timestamp": "2026-04-01T12:00:00",
  "action": "FOUND",
  "details": "SQL injection in auth.py",
  "model": "gpt-4o-mini",
  "cost": 0.0012,
  "has_context": true
}`,
    },
  ];

  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">API Reference</h1>
        <p className="text-zinc-400 leading-relaxed">
          All endpoints are served by the FastAPI backend on port <code>8000</code>.
          CORS is open to all origins.
        </p>
      </div>

      <div className="space-y-6">
        {endpoints.map((ep) => (
          <div
            key={`${ep.method}-${ep.path}`}
            className="p-5 rounded-xl bg-[#111118] border border-white/[0.06] space-y-3"
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  ep.method === "GET"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : ep.method === "POST"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {ep.method}
              </span>
              <code className="text-sm bg-transparent border-none p-0">{ep.path}</code>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">{ep.desc}</p>
            <details className="group">
              <summary className="text-[11px] font-medium text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
                Example response ▾
              </summary>
              <pre className="mt-2 text-xs">{ep.response}</pre>
            </details>
          </div>
        ))}
      </div>
    </article>
  );
}
