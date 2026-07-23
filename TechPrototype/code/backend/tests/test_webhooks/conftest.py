"""Hook into settings so webhook tests always use the in-memory store."""
import os

os.environ.pop("DATABASE_URL", None)

# Patch the app settings immediately when this module loads.
import importlib
import app.core.config
cfg = app.core.config
cfg.settings.database_url = None

# Force storage re-init.
import app.storage
importlib.reload(app.storage)
