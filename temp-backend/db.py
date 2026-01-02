import sqlite3
from pathlib import Path

DB_PATH = Path("temporal.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    # USERS TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    # ARTICLES TABLE
    cur.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            author TEXT NOT NULL,
            published INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def get_user(username):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cur.fetchone()
    conn.close()
    return user


def create_user(username, password):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (username, password)
    )
    conn.commit()
    conn.close()


def save_draft(title, body, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM articles WHERE author = ? AND published = 0",
        (author,)
    )
    existing = cur.fetchone()

    if existing:
        cur.execute(
            """
            UPDATE articles
            SET title = ?, body = ?, created_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (title, body, existing["id"])
        )
    else:
        # Create new draft
        cur.execute(
            """
            INSERT INTO articles (title, body, author, published)
            VALUES (?, ?, ?, 0)
            """,
            (title, body, author)
        )

    conn.commit()
    conn.close()


def publish_article(title, body, author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO articles (title, body, author, published)
        VALUES (?, ?, ?, 1)
        """,
        (title, body, author)
    )
    conn.commit()
    conn.close()


def get_all_articles(published_only=False):
    conn = get_db()
    cur = conn.cursor()

    if published_only:
        cur.execute(
            "SELECT * FROM articles WHERE published = 1 ORDER BY created_at DESC"
        )
    else:
        cur.execute("SELECT * FROM articles ORDER BY created_at DESC")

    rows = cur.fetchall()
    conn.close()
    return rows


def get_latest_draft(author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM articles
        WHERE author = ? AND published = 0
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (author,)
    )
    row = cur.fetchone()
    conn.close()
    return row


def update_article(article_id, title, body, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE articles
        SET title = ?, body = ?, created_at = CURRENT_TIMESTAMP
        WHERE id = ? AND author = ? AND published = 1
        """,
        (title, body, article_id, author)
    )

    updated = cur.rowcount
    conn.commit()
    conn.close()

    return updated > 0


def get_article_by_id(article_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM articles WHERE id = ?",
        (article_id,)
    )
    row = cur.fetchone()
    conn.close()
    return row


def delete_article(article_id, author):
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM articles
        WHERE id = ? AND author = ? AND published = 1
        """,
        (article_id, author)
    )

    deleted = cur.rowcount
    conn.commit()
    conn.close()

    return deleted > 0


def get_all_users():
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT username FROM users ORDER BY username COLLATE NOCASE ASC"
    )
    rows = cur.fetchall()
    conn.close()
    return [row["username"] for row in rows]


def get_articles_by_author(author):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT * FROM articles
        WHERE author = ? AND published = 1
        ORDER BY created_at DESC
        """,
        (author,)
    )
    rows = cur.fetchall()
    conn.close()
    return rows
