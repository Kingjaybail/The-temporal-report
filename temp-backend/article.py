from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import (save_draft, publish_article, get_latest_draft,
                get_all_articles, update_article, get_article_by_id, delete_article)

router = APIRouter(prefix="/articles", tags=["articles"])


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


@router.post("/draft")
def save_user_draft(article: ArticleRequest):
    print("=== DRAFT SAVE HIT ===")
    save_draft(
        title=article.title,
        body=article.body,
        author=article.author
    )
    return {"success": True}


@router.post("/publish")
def publish(article: ArticleRequest):
    publish_article(
        title=article.title,
        body=article.body,
        author=article.author
    )
    return {"success": True}


@router.get("/")
def list_published_articles():
    articles = get_all_articles(published_only=True)
    return [dict(a) for a in articles]


@router.get("/{article_id}")
def get_article(article_id: int):
    articles = get_all_articles(published_only=False)
    for a in articles:
        if a["id"] == article_id:
            return dict(a)
    return None


@router.get("/draft/latest/{author}")
def get_latest_user_draft(author: str):
    draft = get_latest_draft(author)
    return dict(draft) if draft else None



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
        raise HTTPException(status_code=403, detail="Edit denied")

    return {"success": True}


@router.delete("/{article_id}")
def remove_article(article_id: int, req: DeleteArticleRequest):
    success = delete_article(article_id, req.author)

    if not success:
        raise HTTPException(status_code=403, detail="Not authorized to delete")

    return {"success": True}

