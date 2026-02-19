import os
import sys
import urllib.parse
from fastapi.testclient import TestClient

# Ensure src is importable
ROOT = os.path.dirname(os.path.dirname(__file__))
SRC = os.path.join(ROOT, "src")
if SRC not in sys.path:
    sys.path.insert(0, SRC)

from app import app

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "tester@example.com"

    quoted_activity = urllib.parse.quote(activity, safe="")
    quoted_email = urllib.parse.quote(email, safe="")

    # Ensure clean state (ignore not-found)
    client.delete(f"/activities/{quoted_activity}/participants?email={quoted_email}")

    # Sign up
    resp = client.post(f"/activities/{quoted_activity}/signup?email={quoted_email}")
    assert resp.status_code == 200
    assert email in resp.json().get("message", "")

    # Verify participant present
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    assert email in participants

    # Remove participant
    resp = client.delete(f"/activities/{quoted_activity}/participants?email={quoted_email}")
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Verify removed
    resp = client.get("/activities")
    participants = resp.json()[activity]["participants"]
    assert email not in participants
