import unittest
from unittest.mock import patch, MagicMock
import os
import subprocess
from app.services.git_local_service import GitLocalService

class TestGitLocalService(unittest.TestCase):
    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_js(self, mock_run, mock_exists):
        # Scenario: Detect package.json and run JS tests successfully
        mock_exists.side_effect = lambda path: path.endswith("package.json")

        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "Test passed"
        mock_run.return_value = mock_process

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(output, "Test passed")
        mock_run.assert_called_once_with(["npm", "test"], cwd="/tmp/fake-dir", capture_output=True, text=True, timeout=60, check=False)

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_python_pytest_ini(self, mock_run, mock_exists):
        # Scenario: Detect pytest.ini and run Python tests successfully
        mock_exists.side_effect = lambda path: path.endswith("pytest.ini")

        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "Pytest passed"
        mock_run.return_value = mock_process

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(output, "Pytest passed")
        mock_run.assert_called_once_with(["pytest"], cwd="/tmp/fake-dir", capture_output=True, text=True, timeout=60, check=False)

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_python_tests_dir(self, mock_run, mock_exists):
        # Scenario: Detect tests directory and run Python tests successfully
        mock_exists.side_effect = lambda path: path.endswith("tests")

        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = "Pytest passed"
        mock_run.return_value = mock_process

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(output, "Pytest passed")
        mock_run.assert_called_once_with(["pytest"], cwd="/tmp/fake-dir", capture_output=True, text=True, timeout=60, check=False)

    @patch('app.services.git_local_service.os.path.exists')
    def test_run_sandbox_test_no_framework(self, mock_exists):
        # Scenario: No test framework detected
        mock_exists.return_value = False

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertTrue(success)
        self.assertEqual(output, "No test framework detected. Assuming success.")

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_failure(self, mock_run, mock_exists):
        # Scenario: Test execution fails (non-zero return code)
        mock_exists.side_effect = lambda path: path.endswith("package.json")

        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stderr = "Test failed"
        mock_run.return_value = mock_process

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(output, "Test failed")

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_timeout(self, mock_run, mock_exists):
        # Scenario: Test execution times out
        mock_exists.side_effect = lambda path: path.endswith("package.json")
        mock_run.side_effect = subprocess.TimeoutExpired(cmd=["npm", "test"], timeout=60)

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(output, "Tests timed out after 60 seconds.")

    @patch('app.services.git_local_service.os.path.exists')
    @patch('app.services.git_local_service.subprocess.run')
    def test_run_sandbox_test_exception(self, mock_run, mock_exists):
        # Scenario: Unexpected exception during test execution
        mock_exists.side_effect = lambda path: path.endswith("package.json")
        mock_run.side_effect = Exception("Unexpected error")

        success, output = GitLocalService.run_sandbox_test("/tmp/fake-dir")

        self.assertFalse(success)
        self.assertEqual(output, "Unexpected error")
