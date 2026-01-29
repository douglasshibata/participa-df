import pytest
from fastapi.testclient import TestClient
from main import app, generate_protocol

client = TestClient(app)

def test_generate_protocol():
    protocol = generate_protocol()
    assert protocol.startswith("OUV-")
    assert len(protocol) == 17

def test_submit_manifestation_text():
    response = client.post(
        "/submit-manifestation",
        data={"text": "Hello Test", "anonymous": "true"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "protocol" in data
    assert data["protocol"].startswith("OUV-")

def test_submit_manifestation_no_data():
    response = client.post(
        "/submit-manifestation",
        data={"anonymous": "false"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Either text or a media file must be provided."

def test_get_manifestation_not_found():
    response = client.get("/manifestation/OUV-NONEXISTENT")
    assert response.status_code == 200
    assert response.json()["status"] == "not found"
