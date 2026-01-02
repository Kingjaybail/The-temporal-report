import React from 'react';

const API_BASE = import.meta.env.VITE_REACT_API_URL;

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  return res.json();
}

export async function signupUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Signup failed");
  }

  return res.json();
}

export async function fetchArticles() {
  const res = await fetch(`${API_BASE}/articles`);

  if (!res.ok) {
    throw new Error("Failed to fetch articles");
  }

  return res.json();
}

export async function saveDraft(title, body, author) {
  const res = await fetch(`${API_BASE}/articles/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, author })
  });

  if (!res.ok) {
    throw new Error("Failed to save draft");
  }

  return res.json();
}

export async function publishArticle(title, body, author) {
  const res = await fetch(`${API_BASE}/articles/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body, author })
  });

  if (!res.ok) {
    throw new Error("Failed to publish article");
  }

  return res.json();
}


export async function fetchLatestDraft(author) {
  const res = await fetch(
    `${API_BASE}/articles/draft/latest/${encodeURIComponent(author)}`
  );

  if (!res.ok) {
    throw new Error("Failed to load draft");
  }

  return res.json();
}

export async function fetchArticleById(id) {
  const res = await fetch(`${API_BASE}/articles/${id}`);
  if (!res.ok) throw new Error("Failed to load article");
  return res.json();
}

export async function updateArticle(id, title, body) {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body })
  });

  if (!res.ok) throw new Error("Failed to update article");
  return res.json();
}

export async function deleteArticle(id, author) {
  const res = await fetch(`${API_BASE}/articles/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ author })
  });

  if (!res.ok) {
    throw new Error("Delete failed");
  }

  return res.json();
}


export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export async function fetchUserPage(username) {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error("Failed to load user page");
  return res.json();
}
