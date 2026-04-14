from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from backend.app.main import create_application


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    application = create_application()
    with TestClient(application) as test_client:
        yield test_client
