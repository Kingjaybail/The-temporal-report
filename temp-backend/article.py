from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from db import (
    save_draft,
    publish_article,
    get_latest_draft,
    get_articles_paginated,
    update_article,
    get_article_by_id,
    delete_article
)
import uuid
import os

router = APIRouter(prefix="/articles", tags=["articles"])

UPLOAD_DIR = "uploads"
BASE_URL = os.getenv("BASE_URL", "")


class ArticleRequest(BaseModel):
    title: str
    body: str
    author: str

class EditArticleRequest(BaseModel):
    title: str
    body: str
    author: str

class DeleteArticleRequest(BaseModel):
    author: str


@router.get("/")
def list_published_articles(page: int = Query(1, ge=1), limit: int = Query(2, ge=1, le=100),
                            search: str | None = None,sort: str = "created_at", order: str = "desc"):

    result = get_articles_paginated(
        page=page,
        limit=limit,
        search=search,
        sort=sort,
        order=order,
        published_only=True
    )

    return {
        "items": [dict(a) for a in result["items"]],
        "total": result["total"],
        "page": page,
        "limit": limit
    }


@router.get("/{article_id}")
def get_article(article_id: int):
    article = get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return dict(article)


@router.post("/draft")
def save_user_draft(article: ArticleRequest):
    save_draft(article.title, article.body, article.author)
    return {"success": True}


@router.get("/draft/latest/{author}")
def get_latest_user_draft(author: str):
    draft = get_latest_draft(author)
    return dict(draft) if draft else None


@router.post("/publish")
def publish(article: ArticleRequest):
    publish_article(article.title, article.body, article.author)
    return {"success": True}


@router.put("/{article_id}")
def edit_article(article_id: int, article: EditArticleRequest):
    existing = get_article_by_id(article_id)

    if not existing:
        raise HTTPException(status_code=404, detail="Article not found")

    if existing["author"] != article.author:
        raise HTTPException(status_code=403, detail="Not authorized to edit")

    success = update_article(
        article_id,
        article.title,
        article.body,
        article.author
    )

    if not success:
        raise HTTPException(status_code=400, detail="Update failed")

    return {"success": True}


@router.delete("/{article_id}")
def remove_article(article_id: int, req: DeleteArticleRequest):
    success = delete_article(article_id, req.author)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized to delete")
    return {"success": True}


@router.post("/upload-image")
def upload_image(file: UploadFile = File(...)):
    if not BASE_URL:
        raise HTTPException(
            status_code=500,
            detail="BASE_URL not configured"
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as buffer:
        buffer.write(file.file.read())

    return {
        "url": f"{BASE_URL}/uploads/{filename}"
    }