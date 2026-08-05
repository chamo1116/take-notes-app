import os
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent


def main() -> None:
    # Vercel sets VERCEL_ENV to "production", "preview", or "development".
    # Preview builds don't have (and shouldn't need) production database
    # credentials, and re-running migrate on every preview branch against a
    # shared database would be unsafe, so only production deploys migrate.
    if os.environ.get("VERCEL_ENV") != "production":
        print("Skipping migrate: not a production deployment.")
        return

    subprocess.run(
        [sys.executable, "manage.py", "migrate", "--noinput"],
        cwd=BACKEND_DIR,
        check=True,
    )


if __name__ == "__main__":
    main()
