"""
Service for local git operations and sandbox testing.
"""
import subprocess
import logging
import os
import shutil

logger = logging.getLogger(__name__)


class GitLocalService:
    """Handles git operations and running tests locally."""

    @staticmethod
    def clone_repository(repo_url: str, dest_dir: str, token: str) -> bool:
        """
        Clones a repository securely using the provided token to a local directory.
        """
        def redact(text: str) -> str:
            if not text:
                return text
            if not token:
                return text
            return text.replace(token, "********")

        try:
            # Construct URL with token
            url = repo_url.replace("https://", f"https://{token}@")
            cmd = ["git", "clone", "--depth", "1", url, dest_dir]

            result = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if result.returncode != 0:
                logger.error("Git clone failed: %s", redact(result.stderr))
                return False
            return True
        except subprocess.TimeoutExpired as e:
            logger.error("Clone timed out: %s", redact(str(e)))
            return False
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Exception during clone: %s", redact(str(e)))
            return False

    @staticmethod
    def cleanup_directory(directory_path: str):
        """
        Deletes the local repository completely.
        """
        try:
            if os.path.exists(directory_path):
                shutil.rmtree(directory_path)
                logger.info("Cleaned up %s", directory_path)
        except Exception as e:  # pylint: disable=broad-exception-caught
            logger.error("Failed to cleanup %s: %s", directory_path, str(e))

    @staticmethod
    def run_sandbox_test(directory_path: str) -> tuple[bool, str]:
        """
        Attempts to run a basic test in the directory within 60 seconds.
        Returns (success_boolean, output_or_error_string).
        """
        try:
            # Determine if JS or Python
            if os.path.exists(os.path.join(directory_path, "package.json")):
                cmd = ["npm", "test"]
            elif os.path.exists(os.path.join(directory_path, "pytest.ini")) or os.path.exists(
                os.path.join(directory_path, "tests")
            ):
                cmd = ["pytest"]
            else:
                return True, "No test framework detected. Assuming success."

            logger.info("Running sandbox test: %s in %s", ' '.join(cmd), directory_path)
            result = subprocess.run(
                cmd, cwd=directory_path, capture_output=True, text=True, timeout=60, check=False
            )

            if result.returncode == 0:
                return True, result.stdout
            return False, result.stderr or result.stdout

        except subprocess.TimeoutExpired:
            return False, "Tests timed out after 60 seconds."
        except Exception as e:  # pylint: disable=broad-exception-caught
            return False, str(e)

    @staticmethod
    def apply_local_fix(directory_path: str, file_path: str, new_content: str):
        """Writes the fixed code locally so it can be tested before PR"""
        full_path = os.path.join(directory_path, file_path)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
