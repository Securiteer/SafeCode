# SafeCode — AI Security Swarm 🛡️

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-purple.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![LiteLLM](https://img.shields.io/badge/LiteLLM-supported-green.svg)

A fully autonomous, multi-agent AI system that runs 24/7. It continuously discovers popular GitHub repositories, runs high-speed static analysis (Semgrep), verifies findings with AI, sandbox-tests patches, and **automatically submits Pull Requests with fixed code**.

---

## Key Features

- **Multi-Agent Pipeline** — Three specialized AI agents (Finder → Verifier → Fixer) work together to discover, validate, and patch security vulnerabilities.
- **Sandbox Testing Loop** — Patches are applied locally and tests are run. If tests fail, the AI gets the error and retries before opening a PR.
- **GitHub Issue Fixer** — Reads open issues on repositories and submits PRs resolving them.
- **Intelligent Quota Fallback** — Multiple API keys per provider. If one key hits a rate limit, the swarm cycles to the next. If all exhaust, it falls back to a different provider.
- **Real-Time Live Terminal** — Watch the swarm work via WebSocket-powered logs. Click any entry to inspect the exact prompt and AI response.
- **Analytics Dashboard** — Real-time charts, stats, leaderboard, and per-model cost tracking.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI, Python 3.11+, SQLAlchemy, PostgreSQL, Redis, Celery |
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4, Framer Motion, Recharts |
| **AI Routing** | LiteLLM (supports 100+ models) |
| **Static Analysis** | Semgrep |
| **Docs** | Next.js (standalone, port 4000) |

---

## Setup & Installation

### 🐳 Option A: Docker Compose (Recommended)

Works on Mac, Linux, and Windows. Starts all 7 services with one command.

```bash
git clone https://github.com/Securiteer/SafeCode.git
cd SafeCode
docker-compose up --build
```

Initialize the database (first time only):

```bash
docker-compose exec backend alembic upgrade head
```

**Services started:**

| Service | URL |
|---|---|
| Dashboard | [http://localhost:3000](http://localhost:3000) |
| Admin Settings | [http://localhost:3000/admin](http://localhost:3000/admin) |
| Documentation | [http://localhost:4000](http://localhost:4000) |
| API | [http://localhost:8000](http://localhost:8000) |

---

### 💻 Option B: Local Setup (Mac & Linux)

Prerequisites: Python 3.11+, Node.js 18+, Redis running on port 6379.

```bash
git clone https://github.com/Securiteer/SafeCode.git
cd SafeCode
chmod +x start_local.sh
./start_local.sh
```

This installs all dependencies and starts the backend, Celery workers, frontend dashboard, and documentation server.

---

### 🪟 Option C: Local Setup (Windows)

Prerequisites: Python 3.11+, Node.js 18+. Redis requires WSL or [Memurai](https://www.memurai.com/).

**Terminal 1 — Backend:**

```powershell
cd backend
python -m virtualenv venv
.\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
set PYTHONPATH=$PWD
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Celery Worker** (note: `-P solo` is required on Windows):

```powershell
cd backend
.\venv\Scripts\activate
set PYTHONPATH=$PWD
celery -A app.core.celery_app worker -P solo --loglevel=info
```

**Terminal 3 — Celery Beat:**

```powershell
cd backend
.\venv\Scripts\activate
set PYTHONPATH=$PWD
celery -A app.core.celery_app beat --loglevel=info
```

**Terminal 4 — Frontend:**

```powershell
cd frontend
npm install
npx next dev
```

**Terminal 5 — Docs:**

```powershell
cd docs
npm install
npx next dev -p 4000
```

---

## Configuration

All configuration is done from the **Admin Settings** page at [http://localhost:3000/admin](http://localhost:3000/admin).

1. Enter your **GitHub Personal Access Token** (needs `repo` permissions for forking and PR creation).
2. Add **API keys** for your preferred AI providers (OpenAI, Anthropic, Google Gemini, Groq, Vertex AI).
3. Select AI **models** for the Finder, Verifier, and Fixer roles.
4. Turn the **Master Switch** on and hit **Save**.

For a complete reference of all settings, see the [Documentation](http://localhost:4000/configuration).

---

## Project Structure

```
SafeCode/
├── backend/                 # FastAPI + Celery backend
│   ├── app/
│   │   ├── main.py          # REST & WebSocket endpoints
│   │   ├── core/            # Config, database, Celery app
│   │   ├── models/          # SQLAlchemy models
│   │   ├── services/        # AI engine, GitHub, Semgrep, terminal logger
│   │   └── tasks/           # Celery tasks (scanner, beat schedule)
│   ├── alembic/             # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js dashboard
│   ├── src/
│   │   ├── app/             # Pages (dashboard, admin, repositories)
│   │   ├── components/      # Sidebar, Terminal, Charts, Leaderboard
│   │   └── lib/             # Utilities
│   ├── package.json
│   └── Dockerfile
├── docs/                    # Next.js documentation site
│   ├── src/app/             # Pages (overview, architecture, API, config, deployment)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # All services orchestration
├── start_local.sh           # Local dev helper script
└── README.md
```

---

## Documentation

Full documentation is available at [http://localhost:4000](http://localhost:4000) when running locally. It covers:

- **Overview** — How the swarm works, key features, tech stack
- **Architecture** — System diagram, backend/frontend structure, scan pipeline, fallback strategy
- **API Reference** — All REST and WebSocket endpoints with example responses
- **Configuration** — Every setting explained with types, defaults, and descriptions
- **Deployment** — Docker, Mac/Linux, and Windows setup guides

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stats` | Dashboard statistics |
| `GET` | `/api/models` | Per-model usage metrics |
| `GET` | `/api/repositories` | List scanned repositories |
| `GET` | `/api/config` | Get swarm configuration |
| `POST` | `/api/config` | Update swarm configuration |
| `GET` | `/api/charts` | Vulnerability trends (7 days) |
| `GET` | `/api/leaderboard` | Top secured repositories |
| `GET` | `/api/terminal/{id}` | Log entry prompt & response |
| `WS` | `/ws/terminal` | Real-time terminal log stream |

---

*Disclaimer: This tool automatically creates forks and Pull Requests on GitHub. Please use it responsibly and adhere to GitHub's Terms of Service regarding automated actions.*
