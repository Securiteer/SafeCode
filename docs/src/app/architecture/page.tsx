export default function ArchitecturePage() {
  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Architecture</h1>
        <p className="text-zinc-400 leading-relaxed">
          How the backend, frontend, AI agents, and task queue fit together.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">System Diagram</h2>
        <pre>{`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │    Docs     │    │   GitHub    │
│  Next.js    │    │  Next.js    │    │    API      │
│  :3000      │    │  :4000      │    │             │
└──────┬──────┘    └─────────────┘    └──────┬──────┘
       │                                      │
       │  REST + WebSocket                    │
       ▼                                      │
┌──────────────┐                              │
│   Backend    │◄─────────────────────────────┘
│  FastAPI     │         Fork / PR / Clone
│  :8000       │
└──────┬───────┘
       │
       │  Enqueue tasks
       ▼
┌──────────────┐    ┌──────────────┐
│ Celery Beat  │───▶│Celery Worker │
│ (Scheduler)  │    │ (Executor)   │
└──────────────┘    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Semgrep   │  │  LiteLLM   │  │  Git CLI   │
    │  (Scan)    │  │  (AI Call)  │  │  (Clone)   │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           └───────────────┼───────────────┘
                           ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │  + Redis     │
                    └──────────────┘
`}</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Backend Structure</h2>
        <pre>{`backend/
├── app/
│   ├── main.py              # FastAPI app, all REST + WebSocket endpoints
│   ├── core/
│   │   ├── config.py         # Environment settings (DB URL, Redis URL)
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   └── celery_app.py     # Celery app instance
│   ├── models/
│   │   └── models.py         # SQLAlchemy models (Repository, Vulnerability, etc.)
│   ├── services/
│   │   ├── ai_engine.py      # LiteLLM wrapper with fallback logic & cost tracking
│   │   ├── github_service.py # GitHub API (search, fork, PR, branch)
│   │   ├── git_local_service.py # Local git clone, apply fix, run tests
│   │   ├── semgrep_service.py   # Semgrep static analysis runner
│   │   └── terminal_logger.py  # Redis pub/sub logger for live terminal
│   └── tasks/
│       ├── scanner.py        # Main scan_repository_task + discover_and_dispatch
│       └── beat_schedule.py  # Celery Beat periodic task schedule
├── alembic/                  # Database migrations
├── requirements.txt
└── Dockerfile`}</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Frontend Structure</h2>
        <pre>{`frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout with sidebar navigation
│   │   ├── globals.css        # Design system (surface cards, glass panels)
│   │   ├── page.tsx           # Dashboard (stats, chart, terminal, models)
│   │   ├── admin/page.tsx     # Settings (swarm control, AI models, credentials)
│   │   └── repositories/page.tsx  # Scanned repositories list
│   ├── components/
│   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   ├── Terminal.tsx       # WebSocket live terminal with log inspector
│   │   ├── Charts.tsx         # Recharts area chart for vulnerability trends
│   │   └── Leaderboard.tsx    # Top secured repositories ranking
│   └── lib/
│       └── utils.ts           # cn() utility (clsx + tailwind-merge)
├── package.json
└── Dockerfile`}</pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Scan Pipeline</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          This is the detailed flow that runs for each repository:
        </p>
        <ol className="space-y-3 text-sm text-zinc-400 leading-relaxed list-decimal list-inside">
          <li><strong className="text-zinc-200">Discovery</strong> — Celery Beat triggers <code>discover_and_dispatch</code> periodically. It calls the GitHub Search API to find trending repos matching the configured theme and age criteria.</li>
          <li><strong className="text-zinc-200">Clone</strong> — Each repo is assigned a bot ID and cloned to a temp directory using <code>GitLocalService</code>.</li>
          <li><strong className="text-zinc-200">Scan</strong> — Semgrep runs against the cloned directory. Findings are saved to the database as <code>Vulnerability</code> records.</li>
          <li><strong className="text-zinc-200">Verify</strong> — (If enabled) Each finding is sent to the Verifier model to confirm it's a real vulnerability, not a false positive.</li>
          <li><strong className="text-zinc-200">Fix</strong> — The Fixer model receives the vulnerable code + description and generates a patch.</li>
          <li><strong className="text-zinc-200">Sandbox Test</strong> — The patch is applied locally and the repo's test suite is run. If tests fail, the error is fed back to the AI for a second attempt.</li>
          <li><strong className="text-zinc-200">PR</strong> — If tests pass, the repo is forked, a branch is created with the fix, and a Pull Request is opened on the original repository.</li>
          <li><strong className="text-zinc-200">Cleanup</strong> — The temp directory is deleted to prevent disk exhaustion.</li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">AI Fallback Strategy</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The <code>AIEngine</code> class implements a multi-tier fallback:
        </p>
        <ol className="space-y-2 text-sm text-zinc-400 leading-relaxed list-decimal list-inside">
          <li>Try each API key for the configured provider in order.</li>
          <li>If all keys hit rate limits and <strong className="text-zinc-200">auto-failover</strong> is enabled, randomly try <code>gpt-4o-mini</code>, <code>claude-3-haiku</code>, or <code>gemini-1.5-flash</code>.</li>
          <li>For each fallback model, try all available keys for that provider.</li>
          <li>If everything fails, the task raises an exception and logs the error.</li>
        </ol>
      </section>
    </article>
  );
}
