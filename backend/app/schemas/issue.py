from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field, HttpUrl


class IssueCategory(StrEnum):
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    QUESTION = "question"
    DOCUMENTATION = "documentation"
    DUPLICATE = "duplicate"
    INFO_NEEDED = "info_needed"
    INVALID = "invalid"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class IssueAnalysisRequest(BaseModel):
    title: str = Field(min_length=1)
    body: str | None = None
    labels: list[str] = Field(default_factory=list)


class IssueClassification(BaseModel):
    category: IssueCategory
    confidence: float = Field(ge=0, le=1)
    reason: str
    suggested_action: str
    signals: list[str] = Field(default_factory=list)


class GitHubIssue(BaseModel):
    number: int
    title: str
    state: str
    html_url: HttpUrl
    author: str | None = None
    labels: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    comments: int = 0
    classification: IssueClassification
