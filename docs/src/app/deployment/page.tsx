export default function DeploymentPage() {
  return (
    <article className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Deployment</h1>
        <p className="text-zinc-400 leading-relaxed">
          Three ways to run SafeCode: Docker Compose (recommended), local setup on Mac/Linux, or local setup on Windows.
        </p>
      </div>

      {/* Docker */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Option A: Docker Compose (Recommended)</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          This is the fastest way. It starts all 7 services (backend, frontend, docs, celery worker, celery beat, Redis, PostgreSQL) with one command.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">1. Clone and start</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`git clone https://github.com/Securiteer/SafeCode.git
cd SafeCode
docker-compose up --build`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">2. Initialize the database (first time only)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`docker-compose exec backend alembic upgrade head`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">3. Open in browser</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`Dashboard:      http://localhost:3000
Admin Settings: http://localhost:3000/admin
Documentation:  http://localhost:4000
API:            http://localhost:8000`}</pre>
          </div>
        </div>
      </section>

      {/* Mac/Linux */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Option B: Local Setup (Mac & Linux)</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Prerequisites: Python 3.11+, Node.js 18+, Redis running locally on port 6379.
        </p>
        <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
          <p className="text-xs text-zinc-500 mb-2 font-medium">Use the helper script</p>
          <pre className="bg-transparent border-none p-0 text-xs">{`git clone https://github.com/Securiteer/SafeCode.git
cd SafeCode
chmod +x start_local.sh
./start_local.sh`}</pre>
          <p className="text-xs text-zinc-500 mt-3">
            This automatically installs dependencies, starts Redis (if needed), launches the backend,
            Celery workers, frontend, and docs server.
          </p>
        </div>
      </section>

      {/* Windows */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Option C: Local Setup (Windows)</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Prerequisites: Python 3.11+, Node.js 18+. Redis requires WSL or a Windows port like Memurai.
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">1. Backend (PowerShell)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`cd backend
python -m virtualenv venv
.\\venv\\Scripts\\activate
pip install -r requirements.txt
alembic upgrade head
set PYTHONPATH=$PWD
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">2. Celery Worker (separate terminal)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`cd backend && .\\venv\\Scripts\\activate
set PYTHONPATH=$PWD
celery -A app.core.celery_app worker -P solo --loglevel=info`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">3. Celery Beat (separate terminal)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`cd backend && .\\venv\\Scripts\\activate
set PYTHONPATH=$PWD
celery -A app.core.celery_app beat --loglevel=info`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">4. Frontend (separate terminal)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`cd frontend
npm install
npx next dev`}</pre>
          </div>
          <div className="p-4 rounded-xl bg-[#111118] border border-white/[0.06]">
            <p className="text-xs text-zinc-500 mb-2 font-medium">5. Docs (separate terminal)</p>
            <pre className="bg-transparent border-none p-0 text-xs">{`cd docs
npm install
npx next dev -p 4000`}</pre>
          </div>
        </div>
      </section>

      {/* Post-setup */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Post-Setup Configuration</h2>
        <ol className="space-y-2 text-sm text-zinc-400 leading-relaxed list-decimal list-inside">
          <li>Open <a href="http://localhost:3000/admin">localhost:3000/admin</a>.</li>
          <li>Enter your <strong className="text-zinc-200">GitHub Personal Access Token</strong> (needs <code>repo</code> permissions).</li>
          <li>Add <strong className="text-zinc-200">API keys</strong> for your preferred AI providers.</li>
          <li>Select AI models for Finder, Verifier, and Fixer roles.</li>
          <li>Toggle the <strong className="text-zinc-200">Master Switch</strong> on and hit Save.</li>
        </ol>
      </section>

      <div className="p-5 rounded-xl bg-amber-500/[0.05] border border-amber-500/10">
        <p className="text-sm text-amber-300/80">
          <strong>⚠ Disclaimer:</strong> This tool automatically creates forks and Pull Requests on GitHub.
          Please use it responsibly and adhere to GitHub's Terms of Service regarding automated actions.
        </p>
      </div>
    </article>
  );
}
