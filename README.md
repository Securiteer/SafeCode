# AI Security Swarm 🐝🛡️

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-purple.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![LiteLLM](https://img.shields.io/badge/LiteLLM-supported-green.svg)

Welcome to **AI Security Swarm**! A fully autonomous, multi-agent AI system designed to run 24/7. It continuously scours GitHub for popular and active repositories, runs high-speed static analysis, verifies findings with AI, and **automatically submits Pull Requests with fixed code**.

🌍 **Live Local Dashboard:** [http://localhost:3000](http://localhost:3000)

---

## ⚡ Key Features

- **Multi-Agent Workflow:**
  - **Finder Agent (Semgrep + Context):** Clones codebases locally and uses lightning-fast static analysis (Semgrep) to pinpoint vulnerabilities.
  - **Verifier Agent:** Acts as a strict quality gate, reviewing the Finder's discoveries using a fast LLM to drastically reduce false positives.
  - **Fixer Agent (High IQ):** Rewrites the vulnerable code locally to generate a secure patch.
- **The Sandbox Testing Loop 🧪:** The Swarm doesn't just guess! It applies the AI's fix locally and attempts to run the repository's test suite. If the test fails, it feeds the error back to the AI for a second attempt before opening a PR!
- **GitHub Issue Fixer 🐛:** The swarm can be configured to autonomously find open GitHub Issues on repositories, read the codebase context, and submit PRs resolving them.
- **Intelligent Quota Fallback 🔄:** Supply multiple API keys for each provider (OpenAI, Anthropic, Gemini, Groq, Vertex). If one key hits a rate limit, the Swarm rolls over to the next. If all exhaust, it randomly shifts to a different provider to maintain 100% uptime.
- **Real-Time Live Terminals 💻:** Watch the swarm work in real-time through WebSocket-powered terminal logs. **Click any log** to instantly view the exact prompt and response the AI processed!
- **Beautiful Analytics 📊:** Featuring a dark glassmorphism UI, real-time charts tracking vulnerabilities over 7 days, and a Top Secured Repositories Leaderboard.

## 🛠 Tech Stack

- **Backend:** FastAPI, Python, SQLAlchemy, PostgreSQL, Redis, Celery (for 24/7 background tasks)
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons
- **AI Routing:** LiteLLM (Supports 100+ Models natively)
- **Static Analysis:** Semgrep

---

## 🚀 Setup & Installation

You can run the AI Security Swarm either fully containerized via **Docker** (Recommended) or **Locally** directly on your machine. You **do not** need to manually manage `.env` files; you configure everything directly from the gorgeous frontend Admin dashboard!

### 🐳 Option A: Docker Compose (Recommended - Mac/Linux/Windows)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Securiteer/SafeCode.git
   cd SafeCode
   ```

2. **Run the Application:**
   ```bash
   docker-compose up --build
   ```

3. **Initialize the Database:**
   In a separate terminal window, run the initial database migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

### 💻 Option B: Local Setup (Mac & Linux Without Docker)

*Prerequisites: Python 3.11+, Node.js 18+, and Redis running locally on default port 6379.*

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Securiteer/SafeCode.git
   cd SafeCode
   ```

2. **Use the Helper Script (Fastest):**
   ```bash
   chmod +x start_local.sh
   ./start_local.sh
   ```
   *This will automatically install dependencies, start Redis (if needed), launch the backend, Celery workers, and the frontend server simultaneously.*

### 🪟 Option C: Local Setup (Windows localhost Without Docker)

*Prerequisites: Python 3.11+ and Node.js 18+ installed on Windows. Celery requires Redis as a message broker. Native Redis does not officially support Windows, so you must install Redis via WSL (Windows Subsystem for Linux) or install a Windows port like Memurai.*

1. **Clone the repository:**
   Open PowerShell or Git Bash:
   ```powershell
   git clone https://github.com/Securiteer/SafeCode.git
   cd SafeCode
   ```

2. **Setup Backend (FastAPI & Celery):**
   Open a PowerShell terminal for your backend:
   ```powershell
   cd backend
   python -m virtualenv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt

   # Initialize the local SQLite database
   alembic upgrade head

   # Start the FastAPI server
   set PYTHONPATH=$PWD
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Start the Windows Celery Workers:**
   Open two *new* separate PowerShell windows, activate the environment (`.\venv\Scripts\activate`) in each, and run:

   **Terminal A (The Worker):** Note the `-P solo` flag, which is strictly required to run Celery locally on Windows!
   ```powershell
   cd backend
   set PYTHONPATH=$PWD
   celery -A app.core.celery_app worker -P solo --loglevel=info
   ```

   **Terminal B (The Scheduler):**
   ```powershell
   cd backend
   set PYTHONPATH=$PWD
   celery -A app.core.celery_app beat --loglevel=info
   ```

4. **Setup Frontend (Next.js):**
   Open a final PowerShell window:
   ```powershell
   cd frontend
   npm install
   # Launch Next.js
   npx next dev
   ```

### ⚙️ Final Configuration Step (All Platforms)
1. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).
2. Go to the **Admin Settings** tab.
3. Enter your **GitHub Personal Access Token** (needs `repo` permissions to allow forking and opening PRs).
4. Add your **API Keys** for your preferred AI providers.
5. Select your models from the searchable dropdown, turn the master switch **ON**, and hit Save to launch the swarm!

---

## 📚 Documentation Site

For an in-depth dive into the architecture, fallback strategies, and how to add new AI agents, please visit our dedicated documentation website located in the `docs/` folder!

To run the docs locally, navigate to the `docs` folder, install the dependencies with `npm install`, and then run `npx next dev` to launch the documentation server on your local machine.

---

*Disclaimer: This tool automatically creates forks and Pull Requests on GitHub. Please use it responsibly and adhere to GitHub's Terms of Service regarding automated actions and spam.*
