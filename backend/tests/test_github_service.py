import unittest
from unittest.mock import patch, MagicMock
from app.services.github_service import GitHubService
from app.models.models import Repository, BotConfig
from github.Repository import Repository as GithubRepository

class TestGitHubService(unittest.TestCase):
    @patch('app.services.github_service.Github')
    def setUp(self, mock_github):
        # Mock DB session
        self.mock_db = MagicMock()

        # Configure the first query to return a mock BotConfig for __init__
        mock_bot_config = MagicMock()
        mock_bot_config.value = "fake_token"
        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_bot_config

        self.service = GitHubService(self.mock_db)

    def test_get_or_create_repo_record_create_new(self):
        # Reset mock_db to clear __init__ calls
        self.mock_db.reset_mock()

        # Scenario: DB does not have the repository
        self.mock_db.query.return_value.filter.return_value.first.return_value = None

        # Mock GithubRepository input
        mock_repo = MagicMock(spec=GithubRepository)
        mock_repo.full_name = "test/new-repo"
        mock_repo.stargazers_count = 100
        mock_repo.get_topics.return_value = ["python", "testing"]

        result = self.service.get_or_create_repo_record(mock_repo)

        # Verify db.add was called with a new Repository object
        self.mock_db.add.assert_called_once()
        added_repo = self.mock_db.add.call_args[0][0]
        self.assertIsInstance(added_repo, Repository)
        self.assertEqual(added_repo.full_name, "test/new-repo")
        self.assertEqual(added_repo.stars, 100)
        self.assertEqual(added_repo.themes, ["python", "testing"])

        # Verify commit and refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(added_repo)
        self.assertEqual(result, added_repo)

    def test_get_or_create_repo_record_update_existing(self):
        # Reset mock_db to clear __init__ calls
        self.mock_db.reset_mock()

        # Scenario: DB already has the repository
        mock_existing_repo = MagicMock(spec=Repository)
        mock_existing_repo.full_name = "test/existing-repo"
        mock_existing_repo.stars = 50
        mock_existing_repo.themes = ["old_topic"]

        self.mock_db.query.return_value.filter.return_value.first.return_value = mock_existing_repo

        # Mock GithubRepository input with new data
        mock_repo = MagicMock(spec=GithubRepository)
        mock_repo.full_name = "test/existing-repo"
        mock_repo.stargazers_count = 150
        mock_repo.get_topics.return_value = ["new_topic"]

        result = self.service.get_or_create_repo_record(mock_repo)

        # Verify db.add was NOT called
        self.mock_db.add.assert_not_called()

        # Verify existing repo attributes were updated
        self.assertEqual(mock_existing_repo.stars, 150)
        self.assertEqual(mock_existing_repo.themes, ["new_topic"])

        # Verify commit and refresh
        self.mock_db.commit.assert_called_once()
        self.mock_db.refresh.assert_called_once_with(mock_existing_repo)
        self.assertEqual(result, mock_existing_repo)

    def test_search_repositories(self):
        self.service.gh = MagicMock()
        mock_repo = MagicMock(spec=GithubRepository)
        mock_repo.full_name = "test/search"
        self.service.gh.search_repositories.return_value = [mock_repo]

        repos = self.service.search_repositories(theme="python", limit=1)
        self.assertEqual(len(repos), 1)
        self.assertEqual(repos[0].full_name, "test/search")

        self.service.gh.search_repositories.assert_called_once()
        args, kwargs = self.service.gh.search_repositories.call_args
        self.assertIn("topic:python", kwargs['query'])
