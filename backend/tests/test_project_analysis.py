"""Focused tests for the non-AI project structure analysis rules."""

from datetime import datetime, timezone

from app.schemas.repository import (
    CategorySummary,
    ClassifiedFile,
    FileCategory,
    RepositoryIdentity,
    RepositorySnapshot,
    RepositoryStats,
)
from app.services.project_analysis import ProjectAnalysisService


def _snapshot(
    *,
    languages: dict[str, int],
    primary_language: str | None,
    files: list[ClassifiedFile] | None = None,
) -> RepositorySnapshot:
    sample_files = files or []
    category_counts: dict[str, int] = {}
    for file in sample_files:
        category_counts[file.category.value] = category_counts.get(file.category.value, 0) + 1

    return RepositorySnapshot(
        identity=RepositoryIdentity(
            owner="course-team",
            name="sample",
            full_name="course-team/sample",
            html_url="https://github.com/course-team/sample",
            default_branch="main",
        ),
        stats=RepositoryStats(
            primary_language=primary_language,
            languages=languages,
        ),
        files=sample_files,
        file_categories=[
            CategorySummary(category=category, count=count)
            for category, count in category_counts.items()
        ],
        synced_at=datetime.now(timezone.utc),
    )


def test_tiny_web_language_share_does_not_make_python_project_full_stack() -> None:
    snapshot = _snapshot(
        languages={"Python": 3_936_948, "JavaScript": 1_066, "HTML": 235, "CSS": 25},
        primary_language="Python",
    )

    analysis = ProjectAnalysisService().analyze(snapshot)

    assert analysis.project_type == "Python backend or tooling project"


def test_meaningful_python_and_frontend_shares_are_full_stack() -> None:
    snapshot = _snapshot(
        languages={"Python": 700_000, "TypeScript": 300_000},
        primary_language="Python",
    )

    analysis = ProjectAnalysisService().analyze(snapshot)

    assert analysis.project_type == "Full-stack project: Python backend plus web frontend"


def test_entry_candidates_only_include_source_files_outside_example_and_test_directories() -> None:
    snapshot = _snapshot(
        languages={"Python": 1_000},
        primary_language="Python",
        files=[
            ClassifiedFile(path="backend/app.py", category=FileCategory.SOURCE),
            ClassifiedFile(path="docs/example/main.py", category=FileCategory.SOURCE),
            ClassifiedFile(path="tests/app.py", category=FileCategory.SOURCE),
            ClassifiedFile(path="examples/server.py", category=FileCategory.SOURCE),
            ClassifiedFile(path="notes/main.py", category=FileCategory.DOCUMENTATION),
        ],
    )

    analysis = ProjectAnalysisService().analyze(snapshot)

    assert [file.path for file in analysis.entry_files] == ["backend/app.py"]
