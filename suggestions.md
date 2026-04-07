# AI Security Swarm - Codebase Suggestions

## N+1 Query during AIEngine Initialization
The `AIEngine.__init__` method loads API keys from the `BotConfig` table. It currently uses a `.filter(BotConfig.key.in_(db_keys)).all()` which is better than doing a query in a loop, but ensuring this isn't called multiple times redundantly or without caching could help. Ensure `AIEngine` is initialized as a singleton or the keys are cached in memory/Redis to prevent this query from running every time the engine is instantiated.

## N+1 Query in Update Config Endpoint
In `backend/app/main.py`, the `update_config` endpoint queries for existing configurations using an `IN` clause: `db.query(BotConfig).filter(BotConfig.key.in_(keys)).all()`. This is good, but later it iterates and updates them individually. To optimize this, you can perform bulk updates using SQLAlchemy's `session.bulk_update_mappings(BotConfig, mapping_list)` instead of doing an ORM attribute update for each instance.

## Repeated Database Commit in Loop
In `backend/app/services/github_service.py` within the `create_branch_and_commit` method or similar Git operations, ensure `db.commit()` is not called inside loops. Instead, accumulate the `db.add()` operations and call `db.commit()` exactly once at the end of the operation/transaction block to significantly improve database write performance.

## Untested get_file_context utility
In `backend/app/services/semgrep_service.py`, the `get_file_context` function is currently lacking robust test coverage for edge cases like symlink traversal or massive files. Create a test in `backend/tests/test_semgrep_service.py` using `unittest.mock.patch('builtins.open')` to simulate different file system responses and permission errors.

## Unused Import in alembic env.py
In `backend/alembic/env.py`, there is an unused import (likely `os` or `sys` if not used fully, or potentially unused SQLAlchemy components depending on recent changes). Review line 1-13 of `alembic/env.py` and remove any modules that are imported but never invoked in the configuration logic. Keep `Base` as it is required for metadata.

## Unused Import 'List' in main.py
In `backend/app/main.py`, the `List` type hint is imported from `typing` but doesn't appear to be used in the top-level definitions of that specific file (as it relies heavily on native lists or Pydantic). Remove `List` from `from typing import Dict, Any, List` (if present) to adhere to PEP8/Flake8 standards.

## Missing timeout handling test for sandbox execution
The execution logic for the sandbox does not have tests ensuring that long-running code is terminated correctly. In your tests directory, create `test_sandbox.py` (which currently doesn't exist) and write a test case that mocks `subprocess.run` to raise a `subprocess.TimeoutExpired` exception to guarantee the application handles infinite loops securely without hanging the Celery worker.

## Unused Import 'json' in main.py
In `backend/app/main.py`, the `json` module is imported but never explicitly used (FastAPI handles JSON serialization automatically via Pydantic). Remove `import json` at the top of the file.

## Unused Import 'timedelta' in main.py
In `backend/app/main.py` (or similar routers), `timedelta` might be imported but not utilized properly, or it is used as `datetime.timedelta`. Ensure if `import timedelta` or `from datetime import timedelta` is there and unused, it is removed to satisfy linting.

## Overly Permissive CORS Policy
In `backend/app/main.py`, the `CORSMiddleware` allows all headers and all methods (`allow_methods=["*"]`, `allow_headers=["*"]`). Update the `allow_methods` to specifically list only the needed HTTP verbs (e.g., `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`) and restrict `allow_headers` to typical headers like `["Content-Type", "Authorization"]` instead of `"*"`.

## N+1 Query in Leaderboard Endpoint
In `backend/app/main.py`, the `/api/leaderboard` endpoint does a query on `Repository`, but then iterates over `r.vulnerabilities` in a list comprehension: `[v for v in r.vulnerabilities if v.status == 'fixed']`. This triggers an N+1 query for the vulnerabilities of each repository. Fix this by utilizing SQLAlchemy's `joinedload` from `sqlalchemy.orm`: `.options(joinedload(Repository.vulnerabilities))` in the initial query.

## Untested update_config endpoint
The `/api/config` update endpoint in `backend/app/main.py` does not have an accompanying unit test in `backend/tests/test_main.py`. Write a test using FastAPI's `TestClient` that sends a POST request with a sample `ConfigUpdate` payload, mocks `db.commit()`, and verifies that the database updates the correct `BotConfig` keys.

## Untested get_dashboard_stats endpoint
While there are some tests for `get_dashboard_stats` in `backend/tests/test_main.py` (`test_get_dashboard_stats_happy_path`), ensure all edge cases are tested, specifically when `func.sum(ModelStat.cost_usd)` returns `None` instead of `0.0`, to guarantee it gracefully handles a lack of model statistics.

## Unsafe Environment Variable Modification
In `backend/app/services/ai_engine.py` (or related test files like `test_ai_engine.py`), ensure `os.environ` is not mutated globally. If environment variables need to be dynamically set for LLM libraries, inject them directly into the client instantiation configurations rather than modifying `os.environ`, which is thread-unsafe and causes side effects.

## Untested get_or_create_repo_record database logic
In `backend/app/services/github_service.py`, the `get_or_create_repo_record` needs deeper testing. Ensure there is a unit test in `backend/tests/test_github_service.py` that verifies the exact scenario where the `Repository` does *not* exist in the database, verifying that `db.add()` and `db.commit()` are correctly invoked with the expected default fields.

## Long Function: '_call_llm_with_fallback'
In `backend/app/services/ai_engine.py`, the `_call_llm_with_fallback` method spans many lines. Refactor this by extracting the provider-specific logic (e.g., a function for OpenAI, another for Anthropic) into separate, smaller helper methods. The main function should just act as a router/switch statement.

## Function with many parameters: 'create_pull_request'
In `backend/app/services/github_service.py`, `create_pull_request` takes a `PullRequestParams` but may be drilling down too many parameters internally. Ensure it only relies on the Pydantic model (`PullRequestParams`) to encapsulate the data.

## Untested run_sandbox_test execution logic
The actual execution logic for the python sandbox needs dedicated testing. Mock the file system and docker/subprocess invocation to ensure that the python execution environment is sandboxed correctly and returns the expected structured output format.

## Function with many parameters: 'create_branch_and_commit'
In `backend/app/services/github_service.py`, `create_branch_and_commit` takes a `GithubRepository` and `CommitData`. Refactor the internal calls to GitHub's API to use a simplified builder pattern or pass the DTO directly down to avoid expanding the parameters across multiple function calls.

## Untested clone_repository function
If `git_local_service.py` has a `clone_repository` function, it lacks unit tests. Write tests using `unittest.mock.patch` for `subprocess.run` to simulate both successful `git clone` executions and Git connection failures/timeouts.

## Function with many parameters: 'log'
In `backend/app/services/terminal_logger.py`, the `log` function might be accepting too many arguments (e.g., `repo_name`, `message`, `level`, etc.). Consider creating a `LogEvent` Pydantic model to encapsulate these parameters and pass a single object instead.

## Untested Semgrep directory scan
In `backend/app/services/semgrep_service.py`, test the `scan_directory` function thoroughly by mocking the Semgrep JSON output via `subprocess.run`. Ensure it handles the case where `subprocess.run` throws an `OSError` (e.g., if Semgrep is not installed on the system).

## Untested search_repositories GitHub integration
In `backend/app/services/github_service.py`, write tests for the `search_repositories` logic. Mock the `PyGithub` client to return a paginated list of repositories and ensure the function iterates over the pages correctly and respects API rate limits.

## Long Function: 'scan_repository_task'
In `backend/app/services/scanner.py`, `scan_repository_task` is likely highly complex (handling cloning, scanning, saving results, LLM analysis). Break this down into smaller sub-tasks: `_clone_repo()`, `_run_scanners()`, `_analyze_results()`, and `_save_report()`. This will vastly improve readability and testability.
