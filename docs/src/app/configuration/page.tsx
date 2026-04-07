export default function ConfigurationPage() {
  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
        <p className="text-zinc-400 leading-relaxed">
          All configuration is done from the <a href="http://localhost:3000/admin">Admin Settings</a> page
          in the dashboard. Values are stored in the PostgreSQL database via the <code>/api/config</code> endpoint.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Swarm Control</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Key</th>
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Type</th>
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Default</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-4"><code>is_active</code></td><td className="pr-4">boolean</td><td className="pr-4"><code>true</code></td><td>Master switch — enable or disable the entire swarm.</td></tr>
              <tr><td className="py-3 pr-4"><code>max_agents</code></td><td className="pr-4">integer</td><td className="pr-4"><code>4</code></td><td>Number of parallel scanning bots per dispatch cycle.</td></tr>
              <tr><td className="py-3 pr-4"><code>target_theme</code></td><td className="pr-4">string</td><td className="pr-4"><code>""</code></td><td>GitHub search topic filter (e.g. "react", "python", "security").</td></tr>
              <tr><td className="py-3 pr-4"><code>max_repo_age_days</code></td><td className="pr-4">integer</td><td className="pr-4"><code>30</code></td><td>Only scan repositories pushed to within this many days.</td></tr>
              <tr><td className="py-3 pr-4"><code>scan_issues</code></td><td className="pr-4">boolean</td><td className="pr-4"><code>false</code></td><td>Also scan and attempt to fix open GitHub issues on repos.</td></tr>
              <tr><td className="py-3 pr-4"><code>use_verifier</code></td><td className="pr-4">boolean</td><td className="pr-4"><code>true</code></td><td>Enable the AI verifier step to reduce false positives.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">AI Models</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Key</th>
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Default</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-4"><code>finder_model</code></td><td className="pr-4"><code>gpt-4o-mini</code></td><td>Model used by the Finder agent for initial analysis.</td></tr>
              <tr><td className="py-3 pr-4"><code>verifier_model</code></td><td className="pr-4"><code>gpt-4o-mini</code></td><td>Model used by the Verifier agent to validate findings.</td></tr>
              <tr><td className="py-3 pr-4"><code>fixer_model</code></td><td className="pr-4"><code>gpt-4o</code></td><td>Model used by the Fixer agent to generate code patches.</td></tr>
              <tr><td className="py-3 pr-4"><code>auto_fallback_random</code></td><td className="pr-4"><code>false</code></td><td>If all keys for a provider are exhausted, randomly fall back to another provider.</td></tr>
              <tr><td className="py-3 pr-4"><code>local_base_url</code></td><td className="pr-4"><code>http://localhost:11434/v1</code></td><td>Base URL for local/self-hosted models (e.g. Ollama).</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Credentials</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          API keys are stored as JSON arrays in the database. You can add multiple keys per provider —
          the swarm cycles through them if one hits a rate limit.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Key</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-4"><code>github_token</code></td><td>GitHub PAT with <code>repo</code> permissions (required for forking and PR creation).</td></tr>
              <tr><td className="py-3 pr-4"><code>openai_api_keys</code></td><td>Array of OpenAI API keys (<code>sk-proj-...</code>).</td></tr>
              <tr><td className="py-3 pr-4"><code>anthropic_api_keys</code></td><td>Array of Anthropic API keys (<code>sk-ant-api03-...</code>).</td></tr>
              <tr><td className="py-3 pr-4"><code>gemini_api_keys</code></td><td>Array of Google Gemini API keys (<code>AIzaSy...</code>).</td></tr>
              <tr><td className="py-3 pr-4"><code>groq_api_keys</code></td><td>Array of Groq API keys (<code>gsk_...</code>).</td></tr>
              <tr><td className="py-3 pr-4"><code>vertexai_api_keys</code></td><td>Array of Vertex AI service account JSON strings.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Environment Variables</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          These are set in <code>docker-compose.yml</code> or your shell environment:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Variable</th>
                <th className="text-left py-3 pr-4 text-zinc-500 font-medium">Default</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-4"><code>DATABASE_URL</code></td><td className="pr-4"><code>sqlite:///./ai_sec.db</code></td><td>SQLAlchemy connection string. PostgreSQL in Docker, SQLite locally.</td></tr>
              <tr><td className="py-3 pr-4"><code>REDIS_URL</code></td><td className="pr-4"><code>redis://localhost:6379/0</code></td><td>Redis connection for Celery broker and pub/sub.</td></tr>
              <tr><td className="py-3 pr-4"><code>NEXT_PUBLIC_API_URL</code></td><td className="pr-4"><code>http://localhost:8000</code></td><td>Backend URL used by the frontend (set at build time).</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
