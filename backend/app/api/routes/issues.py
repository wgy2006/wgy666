from fastapi import APIRouter

from app.schemas.issue import IssueAnalysisRequest, IssueClassification
from app.services.issue_classifier import IssueClassifier

router = APIRouter(prefix="/issues", tags=["issues"])


@router.post("/analyze", response_model=IssueClassification)
async def analyze_issue(payload: IssueAnalysisRequest) -> IssueClassification:
    return IssueClassifier().classify(
        title=payload.title,
        body=payload.body,
        labels=payload.labels,
    )
