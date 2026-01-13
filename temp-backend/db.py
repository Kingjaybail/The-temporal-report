import psycopg2
import psycopg2.extras
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable not set")


def get_db():
    return psycopg2.connect(
        DATABASE_URL,
        cursor_factory=psycopg2.extras.RealDictCursor
    )


def init_db():
    conn = get_db()
    cur = conn.cursor()

    # USERS TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            about TEXT DEFAULT ''
        )
    """)

    # ARTICLES TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            author TEXT NOT NULL,
            published BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            article_id INTEGER NOT NULL
            REFERENCES articles(id) ON DELETE CASCADE,
            author TEXT NOT NULL,
            body TEXT NOT NULL,
            parent_id INTEGER
            REFERENCES comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.commit()
    cur.close()
    conn.close()


def get_user(username):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM users WHERE username = %s",
        (username,)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def create_user(username, password):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (username, password) VALUES (%s, %s)",
        (username, password)
    )
    conn.commit()
    cur.close()
    conn.close()


def save_draft(title, body, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id FROM articles
        WHERE author = %s AND published = FALSE
        """,
        (author,)
    )
    existing = cur.fetchone()

    if existing:
        cur.execute(
            """
            UPDATE articles
            SET title = %s,
                body = %s,
                created_at = NOW()
            WHERE id = %s
            """,
            (title, body, existing["id"])
        )
    else:
        cur.execute(
            """
            INSERT INTO articles (title, body, author, published)
            VALUES (%s, %s, %s, FALSE)
            """,
            (title, body, author)
        )

    conn.commit()
    cur.close()
    conn.close()


def publish_article(title, body, author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO articles (title, body, author, published)
        VALUES (%s, %s, %s, TRUE)
        """,
        (title, body, author)
    )
    conn.commit()
    cur.close()
    conn.close()


def get_articles_paginated(page=1,limit=5,search=None, sort="created_at", order="desc", published_only=True):
    conn = get_db()
    cur = conn.cursor()

    offset = (page - 1) * limit
    where = "WHERE published = TRUE" if published_only else "WHERE TRUE"

    params = []

    if search:
        where += " AND (title ILIKE %s OR body ILIKE %s)"
        params.extend([f"%{search}%", f"%{search}%"])

    order = "DESC" if order.lower() == "desc" else "ASC"
    sort = sort if sort in ("created_at", "title", "author") else "created_at"

    cur.execute(
        f"""
        SELECT COUNT(*) FROM articles {where}
        """,
        params
    )
    total = cur.fetchone()["count"]

    cur.execute(
        f"""
        SELECT *
        FROM articles
        {where}
        ORDER BY {sort} {order}
        LIMIT %s OFFSET %s
        """,
        params + [limit, offset]
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()

    return {
        "items": rows,
        "total": total
    }



def get_latest_draft(author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM articles
        WHERE author = %s AND published = FALSE
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (author,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def update_article(article_id, title, body, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE articles
        SET title = %s,
            body = %s,
            created_at = NOW()
        WHERE id = %s
          AND author = %s
          AND published = TRUE
        """,
        (title, body, article_id, author)
    )

    updated = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return updated > 0


def get_article_by_id(article_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM articles WHERE id = %s",
        (article_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row


def delete_article(article_id, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM articles
        WHERE id = %s
          AND author = %s
          AND published = TRUE
        """,
        (article_id, author)
    )

    deleted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return deleted > 0


def get_all_users():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT username
        FROM users
        ORDER BY username COLLATE "C" ASC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [row["username"] for row in rows]


def get_articles_by_author(author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM articles
        WHERE author = %s
          AND published = TRUE
        ORDER BY created_at DESC
        """,
        (author,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def create_comment(article_id, author, body, parent_id=None):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO comments (article_id, author, body, parent_id)
        VALUES (%s, %s, %s, %s)
        """,
        (article_id, author, body, parent_id)
    )

    conn.commit()
    cur.close()
    conn.close()


def get_comments_for_article(article_id):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT *
        FROM comments
        WHERE article_id = %s
        ORDER BY created_at ASC
        """,
        (article_id,)
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows


def delete_comment(comment_id, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM comments
        WHERE id = %s AND author = %s
        """,
        (comment_id, author)
    )

    deleted = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()

    return deleted > 0


def build_comment_tree(comments):
    by_id = {c["id"]: dict(c, children=[]) for c in comments}
    roots = []

    for c in by_id.values():
        if c["parent_id"]:
            parent = by_id.get(c["parent_id"])
            if parent:
                parent["children"].append(c)
        else:
            roots.append(c)

    return roots


def get_user_with_about(username):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT username, about FROM users WHERE username = %s",
        (username,)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


def update_user_about(username, about):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET about = %s WHERE username = %s",
        (about, username)
    )
    conn.commit()
    updated = cur.rowcount
    cur.close()
    conn.close()
    return updated > 0
