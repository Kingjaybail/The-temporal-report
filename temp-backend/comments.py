from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import (create_comment, get_comments_for_article, delete_comment, build_comment_tree)

router = APIRouter(prefix="/comments", tags=["comments"])


class CommentCreate(BaseModel):
    article_id: int
    author: str
    body: str
    parent_id: int | None = None


class CommentDelete(BaseModel):
    author: str


@router.post("/")
def post_comment(c: CommentCreate):
    create_comment(
        c.article_id,
        c.author,
        c.body,
        c.parent_id
    )
    return {"success": True}


@router.get("/article/{article_id}")
def get_article_comments(article_id: int):
    comments = get_comments_for_article(article_id)
    return build_comment_tree(comments)


@router.delete("/{comment_id}")
def remove_comment(comment_id: int, req: CommentDelete):
    if not delete_comment(comment_id, req.author):
        raise HTTPException(status_code=403, detail="Not authorized")
    return {"success": True}
