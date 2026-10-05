import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"  # harus sebelum import app

import pytest
from fastapi.testclient import TestClient

from app import ratelimit
from app.database import Base, engine
from app.main import app
from app.seed import seed


@pytest.fixture()
def client():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed()
    ratelimit._catatan.clear()
    return TestClient(app)
