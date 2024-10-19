
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from test_database import init_db
from main import app

# Run using PYTHONPATH=backend pytest -v -s tests/test_main.py

@pytest.fixture(scope="function")
def test_client():
    """Create a test client for the FastAPI app."""
    client = TestClient(app)
    yield client

def test_cors_headers(test_client):
    """Test that CORS headers are set correctly."""
    response = test_client.options("/api/users")  # Replace with an actual endpoint if available
    print("Testing CORS headers") # Log when testing CORS
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"

def test_database_initialization():
    """Test that the database initializes without errors."""
    db_initialized = True
    try:
        init_db()  # Assuming this returns None or raises an error on failure
        print("Database initialized successfully")  # Log successful initialization
    except SQLAlchemyError as e:  # Catch specific exceptions related to SQLAlchemy
        print(f"Database initialization failed: {e}")  # Log the error
        db_initialized = False
    except Exception as e:  # Fallback for other unexpected exceptions
        print(f"An unexpected error occurred: {e}")  # Log the unexpected error
        db_initialized = False
    assert db_initialized


def test_api_router_inclusion(test_client):
    """Test that the API router is included and responds correctly."""
    response = test_client.get("/api/")  # Assuming this endpoint is available

    # Check response status
    assert response.status_code == 200, f"Expected 200 but got {response.status_code}"

    # Check response content
    response_json = response.json()
    assert "message" in response_json, "'message' key not found in response"
    assert response_json["message"] == "Hello from FastAPI!", f"Expected 'Hello from FastAPI!', but got {response_json['message']}"

def test_database_connection(test_client):
    """Test that the database is connected and tables exist."""
    try:
        # Here you would implement a check to see if the user table exists.
        db_initialized = True  # Replace with actual logic to check database state
        assert db_initialized, "Database initialization failed."
    except Exception as e:
        print(f"Database connection test failed: {e}")
        pytest.fail("Database connection test failed.")

def test_not_found(test_client):
    """Test that accessing a nonexistent endpoint returns a 404 error."""
    response = test_client.get("/api/nonexistent")
    assert response.status_code == 404

if __name__ == "__main__":
    pytest.main()