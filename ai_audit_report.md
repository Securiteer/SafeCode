# AI Security Swarm - Comprehensive Codebase Audit Report

## 1. Security & Credentials
* **Hardcoded Keys / Secrets**
  * `backend/app/core/config.py`: Default local testing URLs and standard defaults are present. `GITHUB_TOKEN` is loaded from the environment or overridden by DB config, but its use in cloning logs must ensure redaction.
  * `backend/app/services/git_local_service.py`: Implements a basic string `.replace(token, "********")` for redaction during cloning error output, which may fail to redact if the token appears in varying formats or encodings in subprocess output.
* **Database Injection Risks**
  * No immediate raw SQL execution was found; SQLAlchemy ORM is used consistently across the backend APIs.
* **Input Validation / API Security**
  * `backend/app/main.py`: No strict input validation (e.g., using explicit Pydantic fields rather than `Dict[str, Any]` for configuration updates) on the `/api/config` endpoint. Any arbitrary key-value pair can be injected into the `BotConfig` table.
* **XSS / Frontend Injection Risks**
  * The frontend relies heavily on mapping data directly into components (`frontend/src/app/page.tsx`, `frontend/src/components/Terminal.tsx`).
  * Ensure that API-returned logs/prompts (which come from LLMs) in the Terminal inspector are properly sanitized if ever rendered as HTML. Currently, they are rendered in `<pre>` blocks as text, which is safe, but any future rich-text formatting needs careful handling.

## 2. Performance & Optimization
* **Backend Database Queries**
  * `backend/app/main.py`: `get_dashboard_stats` executes 5 separate `.count()` and `.scalar()` queries synchronously. This can be optimized using a single database round-trip or caching (Redis).
  * `backend/app/main.py`: `/api/repositories` uses `.offset(skip).limit(limit)`, which becomes slow for large offsets. A cursor-based pagination would be more performant.
* **N+1 Query Patterns**
  * `backend/app/main.py`: In `get_leaderboard()`, the query fetches `Repository` joined with `Vulnerability`, but then loops in Python doing `[v for v in r.vulnerabilities]`. This will trigger a lazy load query for *every* repository if not eagerly loaded via `.options(joinedload(...))`.
* **Frontend State & Polling**
  * `frontend/src/app/page.tsx`: Uses `setInterval` for polling `/api/stats` and `/api/models` every 30 seconds. A WebSocket connection (like the one used for the Terminal) or Server-Sent Events (SSE) would reduce unnecessary network overhead.

## 3. Code Quality, Best Practices & Architecture
* **Error Handling & Exceptions**
  * Throughout `backend/app/services/` (`ai_engine.py`, `git_local_service.py`, `semgrep_service.py`): Extensive use of `except Exception as e:` (broad exception catching). This masks specific errors (like connection timeouts vs API format changes) making debugging difficult.
* **Asynchronous Operations**
  * `backend/app/main.py`: The application uses FastAPI, but most database operations and API endpoints are synchronous (`def` instead of `async def`), and the database setup (`app/core/database.py`) uses the synchronous `psycopg2` driver. This limits FastAPI's concurrency capabilities.
  * The WebSocket implementation `websocket_terminal` mixes `asyncio` with synchronous ORM calls or requires special handling for Redis async `aioredis`.
* **Resource Leaks / Management**
  * `backend/app/services/semgrep_service.py`: `get_file_context` opens files but handles errors loosely.
  * `backend/app/services/git_local_service.py`: Uses `shutil.rmtree` but could leave orphaned temp directories if the process crashes abruptly before the `finally` block in `scan_repository_task` is reached.
* **Magic Numbers & Hardcoding**
  * `backend/app/services/ai_engine.py`: Hardcoded fallback model names (`gpt-4o-mini`, `claude-3-haiku-20240307`, etc.). These should be configurable or pulled from the database to avoid stale configurations if providers update model names.
* **Unused Code / Imports**
  * `backend/app/main.py`: Imports `WebSocketDisconnect`, but the generic `except WebSocketDisconnect:` contains a bare `pass`, silently dropping disconnect logic.
* **Test Isolation**
  * `backend/tests/`: Using `.clear()` on `app.dependency_overrides` is good, but managing dependencies via `pytest.fixture` with `yield` is standard to prevent test state leakage.

## 4. Bugs & Functionality Improvements
* **Missing Features / Edge Cases**
  * `backend/app/tasks/scanner.py`: The `scanner` task forks the original repo and creates a branch, but it does not check if an identical branch/PR already exists. This will cause Github API errors (e.g. `422 Unprocessable Entity`) on repeated scans of the same repo.
  * `backend/app/services/github_service.py`: `create_branch_and_commit` catches status `422` but silently passes, meaning subsequent updates might fail if the base SHA is out of sync.
* **Frontend Warnings**
  * Next.js `Image` component is not utilized; relying on pure DOM nodes or Lucide React icons.
  * `Charts.tsx`: The AreaChart requires a `key` prop on mapped elements if customized, though `recharts` handles this internally mostly.

## 5. Missing Files & Broken Links
* **Alembic / Migrations**
  * `backend/alembic/env.py` mentions `from app.models.models import Base  # noqa: E402`, ensuring models are registered. However, any new models added need to ensure they are explicitly imported in `models.py` or `env.py`.
* **Documentation**
  * The `docs/` outline Docker deployment (`docker-compose exec backend alembic upgrade head`), but does not mention how to handle environment variables for `.env` if required, besides defaults.

## 6. Suggestions for Next Mission
1. **Refactor Database Layer**: Migrate to `asyncpg` and SQLAlchemy's async engine to fully leverage FastAPI's async capabilities.
2. **Implement Proper Pagination**: Update frontend and backend to use cursor-based pagination for `Repositories`.
3. **Enhance GitHub PR Logic**: Add duplicate PR checking and graceful handling of existing branches in `github_service.py`.
4. **Fix N+1 Query**: Eagerly load relationships in `get_leaderboard` and `get_dashboard_stats`.
5. **Strengthen Exception Handling**: Replace `Exception` with specific exceptions (e.g., `subprocess.CalledProcessError`, `httpx.RequestError`).