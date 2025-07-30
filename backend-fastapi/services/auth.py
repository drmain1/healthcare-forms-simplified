from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .firebase_admin import verify_id_token  # Correctly import from our centralized service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependency to get the current user from a Firebase ID token.
    Relies on the centralized `verify_id_token` function.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        decoded_token = verify_id_token(token)
        return decoded_token
    except ValueError as e:
        # Catch the specific error from our verifier and raise a standard HTTP exception
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
