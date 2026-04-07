#!/bin/bash
set -e

echo "🐝 Starting AI Security Swarm Locally..."

# 1. Start Redis if not running
if ! pgrep -x "redis-server" > /dev/null
then
    echo "📦 Starting Redis Server..."
    redis-server --daemonize yes
fi

# 2. Setup & Start Backend (FastAPI + Celery)
echo "🐍 Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

echo "🚀 Starting FastAPI Backend..."
export PYTHONPATH=$(pwd)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

echo "⚙️ Starting Celery Worker..."
celery -A app.core.celery_app worker --loglevel=info > celery_worker.log 2>&1 &
WORKER_PID=$!

echo "⏱️ Starting Celery Beat Scheduler..."
celery -A app.core.celery_app beat --loglevel=info > celery_beat.log 2>&1 &
BEAT_PID=$!

# 3. Setup & Start Frontend (Next.js Dashboard)
echo "⚛️ Setting up Frontend Dashboard..."
cd ../frontend
npm install
echo "🖥️ Starting Next.js Dashboard..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# 4. Wait for user termination
echo ""
echo "✅ Swarm Successfully Deployed Locally!"
echo "📊 Dashboard: http://localhost:3000"
echo "🛠️  Admin Config: http://localhost:3000/admin"
echo ""
echo "Press Ctrl+C to stop all services..."

# Trap Ctrl+C to kill all background processes cleanly
trap "echo 'Stopping all services...'; kill $BACKEND_PID $WORKER_PID $BEAT_PID $FRONTEND_PID; exit" INT
wait
