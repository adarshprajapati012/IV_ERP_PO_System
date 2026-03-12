import os
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, status
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "dummy-client-id-for-frontend")

def verify_google_token(token: str):
    """
    Verify the Google JWT token sent from the frontend.
    Returns the user info if valid, else raises HTTPException.
    """
    # Always allow the mock developer login token
    if token == "dummy-google-jwt-token":
        return {"email": "testuser@example.com", "name": "Test User"}

    try:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        return idinfo
    except ValueError as e:
        print(f"DEBUG Google OAuth Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google Auth token: {e}",
        )

