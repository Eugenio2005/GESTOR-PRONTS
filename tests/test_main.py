"""
Basic integration tests for Gestor Prompts IA.
Run with: pytest tests/ -v
"""
import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

# Make sure imports resolve from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.fixture
async def authed_client(client):
    """User session with test credentials from env or defaults."""
    username = os.getenv("TEST_USER", "test@test.com")
    password = os.getenv("TEST_PASS", "test1234")
    resp = await client.post("/api/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        pytest.skip(f"Login failed ({resp.status_code}) — set TEST_USER / TEST_PASS env vars")
    yield client


@pytest.fixture
async def admin_client(client):
    """Admin session with test credentials from env or defaults."""
    username = os.getenv("TEST_ADMIN_USER", "admin")
    password = os.getenv("TEST_ADMIN_PASS", "admin1234")
    resp = await client.post("/api/admin/login", json={"username": username, "password": password})
    if resp.status_code != 200:
        pytest.skip(f"Admin login failed ({resp.status_code}) — set TEST_ADMIN_USER / TEST_ADMIN_PASS env vars")
    yield client


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_login_bad_credentials(client):
    resp = await client.post("/api/login", json={"username": "nobody@x.com", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_login_missing_fields(client):
    resp = await client.post("/api/login", json={})
    assert resp.status_code in (400, 401, 422)


@pytest.mark.anyio
async def test_admin_login_bad_credentials(client):
    resp = await client.post("/api/admin/login", json={"username": "nobody", "password": "wrong"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Unauthenticated access → 401
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_me_requires_auth(client):
    resp = await client.get("/api/me")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_historial_requires_auth(client):
    resp = await client.get("/api/historial")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_limits_requires_auth(client):
    resp = await client.get("/api/me/limits")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_admin_metrics_requires_admin(client):
    resp = await client.get("/api/admin/metrics")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_users_requires_admin(client):
    resp = await client.get("/api/admin/users")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_sections_requires_admin(client):
    resp = await client.get("/api/admin/sections")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_logs_requires_admin(client):
    resp = await client.get("/api/admin/logs")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_audit_requires_admin(client):
    resp = await client.get("/api/admin/audit")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_cleanup_preview_requires_admin(client):
    resp = await client.get("/api/admin/cleanup/preview")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Authenticated user endpoints
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_me_authenticated(authed_client):
    resp = await authed_client.get("/api/me")
    assert resp.status_code == 200
    data = resp.json()
    assert "display_name" in data or "username" in data or "email" in data


@pytest.mark.anyio
async def test_limits_authenticated(authed_client):
    resp = await authed_client.get("/api/me/limits")
    assert resp.status_code == 200
    data = resp.json()
    assert "daily_used" in data
    assert "monthly_used" in data


@pytest.mark.anyio
async def test_historial_authenticated(authed_client):
    resp = await authed_client.get("/api/historial")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "pages" in data


@pytest.mark.anyio
async def test_historial_search(authed_client):
    resp = await authed_client.get("/api/historial?q=test")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_historial_filters(authed_client):
    resp = await authed_client.get("/api/historial?status=ok&page=1")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_sections_list(authed_client):
    resp = await authed_client.get("/api/sections")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


# ---------------------------------------------------------------------------
# Admin endpoints (authenticated as admin)
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_admin_me(admin_client):
    resp = await admin_client.get("/api/admin/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("is_admin") is True


@pytest.mark.anyio
async def test_admin_metrics(admin_client):
    resp = await admin_client.get("/api/admin/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_queries" in data
    assert "total_users" in data


@pytest.mark.anyio
async def test_admin_users_list(admin_client):
    resp = await admin_client.get("/api/admin/users")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_admin_sections_list(admin_client):
    resp = await admin_client.get("/api/admin/sections")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.anyio
async def test_admin_logs(admin_client):
    resp = await admin_client.get("/api/admin/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data


@pytest.mark.anyio
async def test_admin_logs_filter_status(admin_client):
    resp = await admin_client.get("/api/admin/logs?status=ok")
    assert resp.status_code == 200


@pytest.mark.anyio
async def test_admin_audit(admin_client):
    resp = await admin_client.get("/api/admin/audit")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_admin_cleanup_preview(admin_client):
    resp = await admin_client.get("/api/admin/cleanup/preview?days=30")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_admin_cleanup_run_empty(admin_client):
    """Running cleanup with a very short retention should not crash."""
    resp = await admin_client.post("/api/admin/cleanup/run", json={"days": 9999, "exclude_ids": []})
    assert resp.status_code == 200
    data = resp.json()
    assert "deleted" in data
    assert "freed_bytes" in data


@pytest.mark.anyio
async def test_admin_protect_nonexistent(admin_client):
    resp = await admin_client.patch("/api/admin/queries/999999999/protect")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Process endpoint (no file, should fail with no section or bad sid)
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_process_missing_section(authed_client):
    resp = await authed_client.post(
        "/api/process/nonexistent-slug",
        data={"text": "hola"},
    )
    assert resp.status_code in (404, 400, 422)
