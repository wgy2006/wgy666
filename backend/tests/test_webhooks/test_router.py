"""Integration tests for the webhook HTTP endpoint."""

import hashlib
import hmac

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client():
    """FastAPI TestClient without webhook secret (dev mode)."""
    app = create_app()
    return TestClient(app)


# ---------------------------------------------------------------------------
# Dev mode (no secret)
# ---------------------------------------------------------------------------

def test_post_github_webhook_dev_mode(client):
    """Dev mode: no secret configured, any payload is accepted."""
    payload = {
        "action": "opened",
        "issue": {"title": "Bug: crash", "body": "traceback", "number": 1, "labels": []},
        "repository": {"full_name": "owner/repo"},
    }
    resp = client.post(
        "/api/webhooks/github",
        json=payload,
        headers={"X-GitHub-Event": "issues", "X-GitHub-Delivery": "dev-001"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_post_webhook_missing_event_header(client):
    """Missing X-GitHub-Event header → 422 (FastAPI validation)."""
    resp = client.post("/api/webhooks/github", json={})
    assert resp.status_code == 422


def test_post_webhook_invalid_json(client):
    """Non-JSON body → 400."""
    resp = client.post(
        "/api/webhooks/github",
        content=b"not json",
        headers={"Content-Type": "application/json", "X-GitHub-Event": "issues"},
    )
    assert resp.status_code == 400


def test_post_webhook_unknown_event(client):
    """Unknown event type is silently accepted (returns 200)."""
    payload = {"action": "opened", "issue": {"number": 1}}
    resp = client.post(
        "/api/webhooks/github",
        json=payload,
        headers={"X-GitHub-Event": "some_unknown_event", "X-GitHub-Delivery": "unk-001"},
    )
    assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Production mode (with secret)
# ---------------------------------------------------------------------------

@pytest.fixture
def secured_client(monkeypatch):
    """FastAPI TestClient with a configured webhook secret."""
    monkeypatch.setenv("GITHUB_WEBHOOK_SECRET", "mysecret")
    # Re-create settings & app after patching the env var.
    # Pydantic-settings reads env at import time, so force reload.
    from app.core.config import settings
    settings.github_webhook_secret = "mysecret"
    app = create_app()
    return TestClient(app)


def test_post_webhook_correct_signature(secured_client):
    """Valid HMAC-SHA256 signature → 200."""
    payload = b'{"action":"opened","issue":{"title":"Bug","body":"err","number":1},"repository":{"full_name":"o/r"}}'
    secret = "mysecret"
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    resp = secured_client.post(
        "/api/webhooks/github",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-GitHub-Event": "issues",
            "X-Hub-Signature-256": f"sha256={digest}",
        },
    )
    assert resp.status_code == 200


def test_post_webhook_wrong_signature(secured_client):
    """Invalid HMAC-SHA256 signature → 400."""
    payload = b'{"action":"opened","issue":{"title":"Bug","body":"err","number":1},"repository":{"full_name":"o/r"}}'
    resp = secured_client.post(
        "/api/webhooks/github",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-GitHub-Event": "issues",
            "X-Hub-Signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
        },
    )
    assert resp.status_code == 400


def test_post_webhook_missing_signature_with_secret(secured_client):
    """Secret configured but no signature header → 400."""
    payload = {"action": "opened", "issue": {"title": "Bug", "body": "err", "number": 1}}
    resp = secured_client.post(
        "/api/webhooks/github",
        json=payload,
        headers={"X-GitHub-Event": "issues"},
    )
    assert resp.status_code == 400


def test_post_webhook_non_opened_issue_with_secret(secured_client):
    """Non-'opened' actions are accepted (200) but silently ignored."""
    payload = b'{"action":"closed","issue":{"title":"Fixed","body":"done","number":1},"repository":{"full_name":"o/r"}}'
    secret = "mysecret"
    digest = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    resp = secured_client.post(
        "/api/webhooks/github",
        content=payload,
        headers={
            "Content-Type": "application/json",
            "X-GitHub-Event": "issues",
            "X-Hub-Signature-256": f"sha256={digest}",
        },
    )
    assert resp.status_code == 200
