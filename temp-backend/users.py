from fastapi import APIRouter, HTTPException
from db import get_all_users, get_articles_by_author

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
def list_users():
    return get_all_users()


@router.get("/{username}")
def user_page(username: str):
    articles = get_articles_by_author(username)
    return {
        "username": username,
        "articles": [dict(a) for a in articles]
    }
