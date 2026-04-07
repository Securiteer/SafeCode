import unittest
from unittest.mock import patch, MagicMock, mock_open
from app.services.semgrep_service import SemgrepService

class TestSemgrepService(unittest.TestCase):
    @patch('subprocess.run')
    def test_scan_directory_exception(self, mock_run):
        # Scenario: subprocess.run raises an Exception
        mock_run.side_effect = Exception("Semgrep error")

        result = SemgrepService.scan_directory("/tmp/fake-path")

        self.assertEqual(result, [])
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_failed_no_stdout(self, mock_run):
        # Scenario: subprocess.run returns a non-zero exit code with no stdout
        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stdout = ""
        mock_process.stderr = "Error: some internal error"
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        self.assertEqual(result, [])
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_success(self, mock_run):
        # Happy path scenario
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = '{"results": [{"path": "main.py", "start": {"line": 10}, "extra": {"message": "SQL injection", "severity": "ERROR"}}]}'
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        expected = [{
            "file": "main.py",
            "line": 10,
            "message": "SQL injection",
            "severity": "error"
        }]
        self.assertEqual(result, expected)
        mock_run.assert_called_once()

    @patch('os.path.exists')
    @patch('os.path.getsize')
    @patch('builtins.open', new_callable=unittest.mock.mock_open, read_data="file content here")
    def test_get_file_context_success(self, mock_open, mock_getsize, mock_exists):
        mock_exists.return_value = True
        mock_getsize.return_value = 1000
        result = SemgrepService.get_file_context("/fake/dir", "test.py")

        self.assertEqual(result, "file content here")
        mock_open.assert_called_once_with("/fake/dir/test.py", 'r', encoding='utf-8', errors='ignore')

    @patch('os.path.exists')
    @patch('os.path.getsize')
    @patch('builtins.open')
    def test_get_file_context_exception(self, mock_open, mock_getsize, mock_exists):
        mock_exists.return_value = True
        mock_getsize.return_value = 1000
        mock_open.side_effect = Exception("File read error")

        result = SemgrepService.get_file_context("/fake/dir", "test.py")

        self.assertEqual(result, "")
        mock_open.assert_called_once_with("/fake/dir/test.py", 'r', encoding='utf-8', errors='ignore')

    def test_get_file_context_traversal(self):
        # Attempt directory traversal out of bounds
        result = SemgrepService.get_file_context("/fake/dir", "../../../etc/passwd")
        self.assertEqual(result, "")

    @patch('os.path.exists')
    @patch('os.path.getsize')
    def test_get_file_context_massive_file(self, mock_getsize, mock_exists):
        mock_exists.return_value = True
        mock_getsize.return_value = 3 * 1024 * 1024  # 3 MB

        result = SemgrepService.get_file_context("/fake/dir", "massive.log")
        self.assertEqual(result, "")

    @patch('subprocess.run')
    def test_scan_directory_invalid_json(self, mock_run):
        # Scenario: subprocess.run returns invalid JSON
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = '{"results": [{"path": "main.py", "start": {"line": 10}, '
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        self.assertEqual(result, [])
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_findings_with_nonzero_exit(self, mock_run):
        # Scenario: subprocess.run returns a non-zero exit code but with stdout
        mock_process = MagicMock()
        mock_process.returncode = 1
        mock_process.stdout = '{"results": [{"path": "main.py", "start": {"line": 10}, "extra": {"message": "SQL injection", "severity": "ERROR"}}]}'
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        expected = [{
            "file": "main.py",
            "line": 10,
            "message": "SQL injection",
            "severity": "error"
        }]
        self.assertEqual(result, expected)
        mock_run.assert_called_once()

    @patch('subprocess.run')
    def test_scan_directory_missing_fields(self, mock_run):
        # Scenario: JSON results with missing fields
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_process.stdout = '{"results": [{}]}'
        mock_run.return_value = mock_process

        result = SemgrepService.scan_directory("/tmp/fake-path")

        expected = [{
            "file": None,
            "line": None,
            "message": None,
            "severity": "warning"
        }]
        self.assertEqual(result, expected)
        mock_run.assert_called_once()
