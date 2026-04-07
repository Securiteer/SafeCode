export default function DocsHome() {
  return (
    <article className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">SafeCode Documentation</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          SafeCode is a fully autonomous, multi-agent AI system that continuously scans GitHub repositories
          for security vulnerabilities, verifies findings with AI, and automatically submits Pull Requests
          with patched code.
        </p>
      </div>

      <div className="p-5 rounded-xl bg-violet-500/[0.06] border border-violet-500/15">
        <p className="text-sm text-violet-300">
          <strong>Quick Start:</strong> Run <code>docker-compose up --build</code> from the project root,
          then open <a href="http://localhost:3000">localhost:3000</a> for the dashboard and{" "}
          <a href="http://localhost:4000">localhost:4000</a> for these docs.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How It Works</h2>
        <p className="text-zinc-400 leading-relaxed">
          The swarm operates as a pipeline of three specialized AI agents, each with a distinct role:
        </p>
        <div className="grid gap-4">
          {[
            {
              title: "1. Finder Agent",
              desc: "Clones repositories locally and runs Semgrep static analysis to identify potential vulnerabilities at high speed. Results are filtered and forwarded to the Verifier.",
            },
            {
              title: "2. Verifier Agent",
              desc: "Acts as a quality gate. Reviews each finding using a fast LLM (e.g. GPT-4o Mini) to eliminate false positives before any code is modified.",
            },
            {
              title: "3. Fixer Agent",
              desc: "Rewrites the vulnerable code using a high-capability model (e.g. GPT-4o). The fix is applied locally, sandbox-tested, and if tests pass, a PR is automatically created.",
            },
          ].map((agent) => (
            <div
              key={agent.title}
              className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]"
            >
              <h3 className="text-sm font-semibold mb-1">{agent.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{agent.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Key Features</h2>
        <ul className="space-y-2 text-zinc-400 text-sm leading-relaxed">
          <li>• <strong className="text-zinc-200">Sandbox Testing Loop</strong> — Patches are applied locally and test suites are run. If tests fail, the AI gets the error and retries once before giving up.</li>
          <li>• <strong className="text-zinc-200">GitHub Issue Fixer</strong> — Can read open issues on repositories, understand the codebase, and submit PRs resolving them.</li>
          <li>• <strong className="text-zinc-200">Intelligent Quota Fallback</strong> — Multiple API keys per provider. If one hits a rate limit, the swarm cycles to the next. If all exhaust, it falls back to a different provider entirely.</li>
          <li>• <strong className="text-zinc-200">Real-Time WebSocket Terminal</strong> — Watch the swarm work live. Click any log entry to inspect the exact prompt and AI response.</li>
          <li>• <strong className="text-zinc-200">Analytics Dashboard</strong> — Real-time charts, stats, leaderboard, and per-model cost tracking.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Tech Stack</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-6 text-zinc-500 font-medium">Layer</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Technology</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Backend</td><td>FastAPI, Python 3.11+, SQLAlchemy, PostgreSQL, Redis, Celery</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Frontend</td><td>Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Recharts</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">AI Routing</td><td>LiteLLM (supports 100+ models from OpenAI, Anthropic, Google, Groq, etc.)</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Static Analysis</td><td>Semgrep</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Docs</td><td>Next.js (standalone, port 4000)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Services Overview</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          When running via Docker Compose, the following services are started:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-3 pr-6 text-zinc-500 font-medium">Service</th>
                <th className="text-left py-3 pr-6 text-zinc-500 font-medium">Port</th>
                <th className="text-left py-3 text-zinc-500 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-400">
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Frontend</td><td className="pr-6"><code>3000</code></td><td>Dashboard & Admin UI</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Backend</td><td className="pr-6"><code>8000</code></td><td>FastAPI REST + WebSocket API</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Docs</td><td className="pr-6"><code>4000</code></td><td>This documentation site</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Redis</td><td className="pr-6"><code>6379</code></td><td>Message broker for Celery & WebSocket pub/sub</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">PostgreSQL</td><td className="pr-6"><code>5432</code></td><td>Primary database</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Celery Worker</td><td className="pr-6">—</td><td>Executes scan & fix tasks</td></tr>
              <tr><td className="py-3 pr-6 font-medium text-zinc-200">Celery Beat</td><td className="pr-6">—</td><td>Periodic task scheduler (discover & dispatch)</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
