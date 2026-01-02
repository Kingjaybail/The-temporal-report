from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_user, create_user

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    user = get_user(req.username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "success": True,
        "user": req.username
    }


@router.post("/signup")
def signup(req: LoginRequest):
    if get_user(req.username):
        raise HTTPException(status_code=400, detail="User already exists")

    create_user(req.username, req.password)

    return {
        "success": True,
        "user": req.username
    }
