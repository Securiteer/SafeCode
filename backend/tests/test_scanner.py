from unittest.mock import MagicMock, patch
from app.tasks.scanner import _attempt_fix

@patch('app.tasks.scanner.TerminalLogger.log')
def test_attempt_fix_success_first_try(mock_logger_log):
    bot_id = "BOT-1"
    ai_engine = MagicMock()
    # Mocking the AI engine to return a fixed code
    ai_engine.fix_vulnerability.return_value = {"fixed_code": "new fixed content"}
    fixer_model = "gpt-4"
    code_context = "bad code here"
    desc = "bad vulnerability"
    severity = "high"
    temp_dir = "/tmp/dir"
    file_path = "test.py"

    with patch('app.tasks.scanner.GitLocalService') as mock_git:
        # Mock successful test run on the first try
        mock_git.run_sandbox_test.return_value = (True, "All tests passed")

        success, content = _attempt_fix(
            bot_id, ai_engine, fixer_model, code_context, desc, severity, temp_dir, file_path
        )

        assert success is True
        assert content == "new fixed content"
        assert ai_engine.fix_vulnerability.call_count == 1
        mock_git.apply_local_fix.assert_called_once_with(temp_dir, file_path, "new fixed content")

@patch('app.tasks.scanner.TerminalLogger.log')
def test_attempt_fix_fails_all_attempts(mock_logger_log):
    bot_id = "BOT-1"
    ai_engine = MagicMock()
    ai_engine.fix_vulnerability.return_value = {"fixed_code": "new fixed content"}
    fixer_model = "gpt-4"
    code_context = "bad code here"
    desc = "bad vulnerability"
    severity = "high"
    temp_dir = "/tmp/dir"
    file_path = "test.py"

    with patch('app.tasks.scanner.GitLocalService') as mock_git:
        # Mock failed test runs on all attempts
        mock_git.run_sandbox_test.return_value = (False, "Tests failed")

        success, content = _attempt_fix(
            bot_id, ai_engine, fixer_model, code_context, desc, severity, temp_dir, file_path
        )

        assert success is False
        assert content == "new fixed content"
        # Should have tried twice (max_attempts = 2)
        assert ai_engine.fix_vulnerability.call_count == 2
        # Apply fix should be called twice with new code and twice to restore original
        assert mock_git.apply_local_fix.call_count == 4

@patch('app.tasks.scanner.TerminalLogger.log')
def test_attempt_fix_ai_returns_same_code(mock_logger_log):
    bot_id = "BOT-1"
    ai_engine = MagicMock()
    code_context = "bad code here"
    # AI fails to alter code, returning same code context
    ai_engine.fix_vulnerability.return_value = {"fixed_code": code_context}
    fixer_model = "gpt-4"
    desc = "bad vulnerability"
    severity = "high"
    temp_dir = "/tmp/dir"
    file_path = "test.py"

    with patch('app.tasks.scanner.GitLocalService') as mock_git:
        success, content = _attempt_fix(
            bot_id, ai_engine, fixer_model, code_context, desc, severity, temp_dir, file_path
        )

        assert success is False
        assert content == code_context
        # The loop should break immediately without calling GitLocalService
        assert ai_engine.fix_vulnerability.call_count == 1
        mock_git.apply_local_fix.assert_not_called()
        mock_git.run_sandbox_test.assert_not_called()
