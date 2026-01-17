from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_all_users, get_articles_by_author, get_user_with_about, update_user_about, get_unread_comments_for_user, mark_notifications_read

router = APIRouter(prefix="/users", tags=["users"])


class AboutUpdateRequest(BaseModel):
    about: str


@router.get("/")
def list_users():
    return get_all_users()


@router.get("/{username}")
def user_page(username: str):
    user = get_user_with_about(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    articles = get_articles_by_author(username)
    return {
        "username": username,
        "about": user["about"],
        "articles": [dict(a) for a in articles],
    }


@router.put("/{username}/about")
def update_about(username: str, req: AboutUpdateRequest):
    success = update_user_about(username, req.about)
    if not success:
        raise HTTPException(status_code=404, detail="User not found or update failed")
    return {"success": True}


@router.get("/{username}/notifications")
def get_notifications(username: str):
    comments = get_unread_comments_for_user(username)
    return [dict(c) for c in comments]


@router.post("/{username}/notifications/read")
def read_notifications(username: str):
    mark_notifications_read(username)
    return {"success": True}
