"""
Celery tasks for scanning and dispatching bots.
"""
import logging
import random
import string
from celery import shared_task  # type: ignore
from app.core.database import SessionLocal
from app.services.github_service import GitHubService, PullRequestParams
from app.services.ai_engine import AIEngine
from app.services.terminal_logger import TerminalLogger
from app.services.semgrep_service import SemgrepService
from app.services.git_local_service import GitLocalService
from app.models.models import BotConfig, Vulnerability, VulnerabilityStatus

logger = logging.getLogger(__name__)


def get_config_val(db, key, default):
    """Fetches a configuration value from the database."""
    conf = db.query(BotConfig).filter(BotConfig.key == key).first()
    return conf.value if conf else default


# pylint: disable=too-many-locals,too-many-statements,too-many-branches,broad-exception-caught
@shared_task
def scan_repository_task(repo_full_name: str, bot_id: str):
    """Main task to scan a repository, find vulnerabilities, and attempt to fix them."""
    db = SessionLocal()
    temp_dir = f"/tmp/swarm_repos/{repo_full_name.replace('/', '_')}_{random.randint(1000, 9999)}"

    try:
        gh_service = GitHubService(db)
        ai_engine = AIEngine(db)

        TerminalLogger.log(bot_id, "INIT", f"Starting scan for {repo_full_name}")

        # finder_model = get_config_val(db, "finder_model", "gpt-4o-mini")
        fixer_model = get_config_val(db, "fixer_model", "gpt-4o")
        # scan_issues = get_config_val(db, "scan_issues", False)

        if not gh_service.gh:
            TerminalLogger.log(bot_id, "ERROR", "GitHub token not configured")
            return

        repo = gh_service.gh.get_repo(repo_full_name)
        db_repo = gh_service.get_or_create_repo_record(repo)

        # 1. CLONE LOCALLY
        TerminalLogger.log(bot_id, "CLONING", f"Cloning {repo_full_name} for deep analysis...")
        success = GitLocalService.clone_repository(
            repo.clone_url, temp_dir, str(gh_service.token)
        )
        if not success:
            TerminalLogger.log(bot_id, "ERROR", f"Failed to clone {repo_full_name}")
            return

        # 2. RUN SEMGREP
        TerminalLogger.log(bot_id, "SCANNING", "Running high-speed static analysis (Semgrep)...")
        vulns = SemgrepService.scan_directory(temp_dir)

        if not vulns:
            TerminalLogger.log(bot_id, "SUCCESS", f"No vulnerabilities found in {repo_full_name}")
        else:
            TerminalLogger.log(bot_id, "FOUND", f"Static analysis found {len(vulns)} issues.")

        vuln_records = []
        for v in vulns:
            file_path = v["file"].replace(f"{temp_dir}/", "")
            desc = v["message"]
            severity = v["severity"]

            vuln_record = Vulnerability(
                repo_id=db_repo.id,
                file_path=file_path,
                severity=severity,
                description=desc,
                status=VulnerabilityStatus.FOUND
            )
            db.add(vuln_record)
            vuln_records.append((v, vuln_record, file_path, desc, severity))

        if vuln_records:
            db.commit()

        for v, vuln_record, file_path, desc, severity in vuln_records:
            TerminalLogger.log(bot_id, "RAG", f"Extracting context for {file_path}...")
            code_context = SemgrepService.get_file_context(temp_dir, file_path)

            if not code_context:
                continue

            # 3. FIX LOOP (With Sandbox Testing)
            attempts = 0
            max_attempts = 2
            fix_successful = False
            last_error = None
            new_content = code_context

            while attempts < max_attempts and not fix_successful:
                attempts += 1
                TerminalLogger.log(
                    bot_id,
                    "FIXING",
                    f"Attempt {attempts}: Generating patch for {severity} vuln...",
                    model=fixer_model
                )

                fix_res = ai_engine.fix_vulnerability(
                    code_context, desc, model=fixer_model, error_feedback=last_error
                )
                new_content = fix_res.get("fixed_code", code_context)

                if "stats" in fix_res:
                    TerminalLogger.log(
                        bot_id,
                        "COST",
                        "Fix generated",
                        model=fix_res["stats"].get("model", ""),
                        cost=float(fix_res["stats"].get("cost", 0.0)),
                        prompt_used=fix_res.get("prompt"),
                        ai_response=fix_res.get("response")
                    )

                if new_content == code_context:
                    TerminalLogger.log(bot_id, "ERROR", "Fixer failed to alter code.")
                    break

                # Apply fix locally
                GitLocalService.apply_local_fix(temp_dir, file_path, new_content)

                TerminalLogger.log(bot_id, "TESTING", "Running sandbox tests on patched code...")
                test_success, output = GitLocalService.run_sandbox_test(temp_dir)

                if test_success:
                    TerminalLogger.log(bot_id, "SUCCESS", "Sandbox tests passed! Patch verified.")
                    fix_successful = True
                else:
                    last_error = output[:1000]  # Truncate long error logs
                    TerminalLogger.log(
                        bot_id, "FAILED", f"Sandbox tests failed. Error: {last_error[:50]}..."
                    )
                    # Restore original code for next attempt
                    GitLocalService.apply_local_fix(temp_dir, file_path, code_context)

            if fix_successful:
                TerminalLogger.log(bot_id, "PR", "Forking repository and preparing PR...")
                try:
                    forked_repo = gh_service.fork_repository(repo_full_name)
                    branch_name = f"ai-sec-fix-{random.randint(1000, 9999)}"
                    gh_service.create_branch_and_commit(
                        forked_repo, branch_name, file_path, new_content,
                        f"Security Fix: {desc[:50]}"
                    )
                    pr_params = PullRequestParams(
                        original_repo_full_name=repo_full_name,
                        fork_owner=forked_repo.owner.login,
                        branch_name=branch_name,
                        title=f"Security Fix: Automated resolution of {severity} vulnerability",
                        body=(
                            f"This PR was generated automatically by AI Security Bot.\n\n"
                            f"**Issue:** {desc}\n\n**Severity:** {severity.upper()}"
                        )
                    )
                    pr_url = gh_service.create_pull_request(pr_params)
                    vuln_record.status = VulnerabilityStatus.FIXED
                    vuln_record.pr_url = pr_url
                    db.commit()
                    TerminalLogger.log(bot_id, "SUCCESS", f"Created PR: {pr_url}")
                except Exception as e:
                    vuln_record.status = VulnerabilityStatus.FAILED  # type: ignore
                    db.commit()
                    TerminalLogger.log(bot_id, "ERROR", f"Failed to create PR: {str(e)}")

    except Exception as e:
        logger.error("Error in scan_repository_task: %s", str(e))
        TerminalLogger.log(bot_id, "ERROR", f"Fatal error: {str(e)}")
    finally:
        # ABSOLUTELY ESSENTIAL: Clean up the local sandbox to prevent disk exhaustion
        GitLocalService.cleanup_directory(temp_dir)
        db.close()


@shared_task
def discover_and_dispatch():
    """Discover new repositories and dispatch scanner tasks."""
    db = SessionLocal()
    try:
        is_active = get_config_val(db, "is_active", True)
        if not is_active:
            return

        max_agents = int(get_config_val(db, "max_agents", 4))
        target_theme = get_config_val(db, "target_theme", None)
        max_age = int(get_config_val(db, "max_repo_age_days", 30))

        gh_service = GitHubService(db)
        repos = gh_service.search_repositories(
            theme=target_theme, max_age_days=max_age, limit=max_agents
        )

        for i, repo in enumerate(repos):
            bot_id = f"BOT-{i+1}-{random.choice(string.ascii_uppercase)}{random.randint(10, 99)}"
            scan_repository_task.delay(repo.full_name, bot_id)

    finally:
        db.close()
