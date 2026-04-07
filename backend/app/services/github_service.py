"""
Service for interacting with the GitHub API.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Any
from github import Github, GithubException
from github.Repository import Repository as GithubRepository
from sqlalchemy.orm import Session
from app.models.models import Repository, BotConfig
from app.core.config import settings

logger = logging.getLogger(__name__)


class GitHubService:
    """Service to handle interactions with GitHub."""

    def __init__(self, db: Session):
        self.db = db
        # Fetch token from DB first, fallback to env
        db_token = db.query(BotConfig).filter(BotConfig.key == "github_token").first()
        self.token = str(db_token.value) if db_token and db_token.value else settings.GITHUB_TOKEN
        self.gh = Github(self.token) if self.token else None

    def search_repositories(
        self,
        theme: Optional[str] = None,
        max_age_days: int = 30,
        limit: int = 10
    ) -> List[GithubRepository]:
        """Search for repositories on GitHub based on criteria."""
        if not self.gh:
            logger.error("GitHub token not configured.")
            return []

        date_limit = datetime.now() - timedelta(days=max_age_days)
        date_str = date_limit.strftime("%Y-%m-%d")

        query = f"pushed:>{date_str}"
        if theme:
            query += f" topic:{theme}"
        else:
            query += " stars:>100"

        try:
            repos = self.gh.search_repositories(query=query, sort="stars", order="desc")

            results: List[GithubRepository] = []
            for repo in repos:
                results.append(repo)
                if len(results) >= limit:
                    break

            return results
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error searching repositories: %s", str(e))
            return []

    def get_or_create_repo_record(self, repo: GithubRepository) -> Repository:
        """Get an existing repository from the DB or create a new one."""
        db_repo = self.db.query(Repository).filter(Repository.full_name == repo.full_name).first()
        themes = repo.get_topics()

        if not db_repo:
            db_repo = Repository(
                full_name=repo.full_name,
                stars=int(repo.stargazers_count),
                themes=list(themes)
            )
            self.db.add(db_repo)
        else:
            setattr(db_repo, 'stars', int(repo.stargazers_count))
            setattr(db_repo, 'themes', list(themes))

        self.db.commit()
        self.db.refresh(db_repo)
        return db_repo

    def fork_repository(self, repo_full_name: str) -> GithubRepository:
        """Fork a repository into the authenticated user's account."""
        if not self.gh:
            raise ValueError("GitHub token not configured.")

        repo = self.gh.get_repo(repo_full_name)
        try:
            user = self.gh.get_user()
            forked_repo = user.create_fork(repo)  # type: ignore
            return forked_repo
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error forking %s: %s", repo_full_name, str(e))
            raise

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def create_branch_and_commit(
        self,
        forked_repo: GithubRepository,
        branch_name: str,
        file_path: str,
        new_content: str,
        commit_message: str
    ):
        """Create a new branch and commit a file change."""
        source_branch = forked_repo.default_branch
        ref = forked_repo.get_git_ref(f"heads/{source_branch}")

        try:
            forked_repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=ref.object.sha)
        except GithubException as e:
            if e.status != 422:
                raise

        try:
            contents: Any = forked_repo.get_contents(file_path, ref=branch_name)
            forked_repo.update_file(
                contents.path, commit_message, new_content, contents.sha, branch=branch_name
            )
        except GithubException as e:
            if e.status == 404:
                forked_repo.create_file(file_path, commit_message, new_content, branch=branch_name)
            else:
                raise

    # pylint: disable=too-many-arguments,too-many-positional-arguments
    def create_pull_request(
        self,
        original_repo_full_name: str,
        fork_owner: str,
        branch_name: str,
        title: str,
        body: str
    ) -> str:
        """Create a pull request on the original repository."""
        if not self.gh:
            raise ValueError("GitHub token not configured.")

        repo = self.gh.get_repo(original_repo_full_name)
        head = f"{fork_owner}:{branch_name}"
        base = repo.default_branch

        try:
            pr = repo.create_pull(title=title, body=body, head=head, base=base)
            return str(pr.html_url)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error creating PR for %s: %s", original_repo_full_name, str(e))
            raise

    def get_open_issues(self, repo_full_name: str, limit: int = 5) -> List[Any]:
        """Fetch open issues for a repository."""
        if not self.gh:
            return []
        try:
            repo = self.gh.get_repo(repo_full_name)
            # Fetch open issues that are not pull requests
            issues = repo.get_issues(state="open", sort="created", direction="desc")
            results = []
            for issue in issues:
                if not issue.pull_request:
                    results.append(issue)
                if len(results) >= limit:
                    break
            return results
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Error fetching issues for %s: %s", repo_full_name, str(e))
            return []
