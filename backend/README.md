# GitHub Issue Analysis Backend

FastAPI service that syncs public GitHub repositories and classifies repository files and issues.

## Run

```powershell
uv run uvicorn app.main:app --reload --port 8000
```

Optional environment:

```powershell
$env:GITHUB_TOKEN="ghp_xxx"
```

Using a token is recommended for higher GitHub API rate limits, but public repositories work without it.

## Main Endpoints

- `GET /api/health`
- `POST /api/repositories/sync`
- `GET /api/repositories`
- `GET /api/repositories/{owner}/{name}`
- `POST /api/issues/analyze`
