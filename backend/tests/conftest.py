import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    """TestClient with the DB lifespan (get_pool / close_pool) mocked out."""
    with (
        patch("main.get_pool", new_callable=AsyncMock),
        patch("main.close_pool", new_callable=AsyncMock),
    ):
        with TestClient(app) as c:
            yield c
