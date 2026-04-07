import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from freezegun import freeze_time
from github import GithubException
from app.services.github_service import GitHubService

@freeze_time("2023-10-15 12:00:00")
class TestGitHubServiceSearchRepositories(unittest.TestCase):
    @patch('app.services.github_service.Github')
    def setUp(self, mock_github_class):
        self.mock_db = MagicMock()
        self.mock_db_token = MagicMock()
        self.mock_db_token.value = "fake_token"

        # Setup DB mock chain
        mock_query = MagicMock()
        mock_filter = MagicMock()
        self.mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_filter
        mock_filter.first.return_value = self.mock_db_token

        # Instantiate service and capture the mocked Github client
        self.service = GitHubService(self.mock_db)
        self.mock_gh_client = self.service.gh

        # Reset the db mock to ensure clean state if needed
        self.mock_db.reset_mock()

    def test_search_repositories_with_theme(self):
        # Scenario: theme is provided
        mock_repo1 = MagicMock()
        mock_repo1.full_name = "test/repo1"
        self.mock_gh_client.search_repositories.return_value = [mock_repo1]

        theme = "python"
        max_age_days = 30
        limit = 10

        # Calculate expected date string
        expected_date = (datetime(2023, 10, 15, 12, 0, 0) - timedelta(days=max_age_days)).strftime("%Y-%m-%d")
        expected_query = f"pushed:>{expected_date} topic:{theme}"

        results = self.service.search_repositories(theme=theme, max_age_days=max_age_days, limit=limit)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0], mock_repo1)

        self.mock_gh_client.search_repositories.assert_called_once_with(
            query=expected_query, sort="stars", order="desc"
        )

    def test_search_repositories_without_theme(self):
        # Scenario: theme is None
        mock_repo1 = MagicMock()
        self.mock_gh_client.search_repositories.return_value = [mock_repo1]

        max_age_days = 30
        limit = 10

        expected_date = (datetime(2023, 10, 15, 12, 0, 0) - timedelta(days=max_age_days)).strftime("%Y-%m-%d")
        expected_query = f"pushed:>{expected_date} stars:>100"

        results = self.service.search_repositories(theme=None, max_age_days=max_age_days, limit=limit)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0], mock_repo1)

        self.mock_gh_client.search_repositories.assert_called_once_with(
            query=expected_query, sort="stars", order="desc"
        )

    def test_search_repositories_limit(self):
        # Scenario: API returns more repositories than the limit
        mock_repos = [MagicMock() for _ in range(5)]
        self.mock_gh_client.search_repositories.return_value = mock_repos

        limit = 3
        results = self.service.search_repositories(theme=None, limit=limit)

        self.assertEqual(len(results), limit)
        self.assertEqual(results, mock_repos[:limit])

    def test_search_repositories_no_token(self):
        # Scenario: GitHub token is missing
        # Setting self.gh to None to simulate missing token
        self.service.gh = None

        results = self.service.search_repositories(theme=None)

        self.assertEqual(results, [])

    def test_search_repositories_exception(self):
        # Scenario: API raises an Exception
        self.mock_gh_client.search_repositories.side_effect = GithubException(status=500, data={"message": "Internal error"}, headers={})

        results = self.service.search_repositories(theme="test")

        self.assertEqual(results, [])
        self.mock_gh_client.search_repositories.assert_called_once()
