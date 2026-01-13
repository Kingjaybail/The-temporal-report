import "./commentthread.scss";
import { useState, useEffect } from "react";
import { fetchComments, postComment, deleteComment } from "../../util/router";

export default function CommentThread({ articleId, loggedInUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadComments();
  }, [articleId]);

  async function loadComments() {
    try {
      const data = await fetchComments(articleId);
      setComments(data);
    } catch {
      setError("Failed to load comments");
    }
  }

  // Post top-level comment
  async function handlePostRoot() {
    if (!newComment.trim()) return;
    try {
      await postComment(articleId, loggedInUser, newComment, null);
      setNewComment("");
      await loadComments();
    } catch {
      alert("Failed to post comment");
    }
  }

  // Post reply (child comment)
  async function handleReply(parentId, replyText) {
    if (!replyText.trim()) return;
    try {
      await postComment(articleId, loggedInUser, replyText, parentId);
      await loadComments();
    } catch {
      alert("Failed to post reply");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteComment(id, loggedInUser);
      await loadComments();
    } catch {
      alert("Failed to delete comment");
    }
  }

  return (
    <div className="comment-section">
      <h4>Discussion Thread</h4>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <textarea
        placeholder="Write a comment..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        rows={3}
        className="comment-box"
      />
      <button onClick={handlePostRoot} disabled={!loggedInUser}>
        Post Comment
      </button>

      {comments.map((c) => (
        <Comment
          key={c.id}
          comment={c}
          onReply={handleReply}
          onDelete={handleDelete}
          loggedInUser={loggedInUser}
        />
      ))}
    </div>
  );
}

function Comment({ comment, onReply, onDelete, loggedInUser }) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  async function handleReplySubmit() {
    await onReply(comment.id, replyText);
    setReplying(false);
    setReplyText("");
  }

  return (
    <div className="comment">
      <div className="comment-meta">
        <strong>{comment.author}</strong> ·{" "}
        {new Date(comment.created_at).toLocaleString()}
      </div>

      <div className="comment-body">{comment.body}</div>

      <div className="comment-actions">
        {loggedInUser && (
          <button onClick={() => setReplying(!replying)}>
            {replying ? "Cancel" : "Reply"}
          </button>
        )}
        {loggedInUser === comment.author && (
          <button
            style={{ color: "darkred" }}
            onClick={() => onDelete(comment.id)}
          >
            Delete
          </button>
        )}
      </div>

      {replying && (
        <div className="reply-box">
          <textarea
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
          />
          <button onClick={handleReplySubmit}>Reply</button>
        </div>
      )}

      {comment.children?.length > 0 && (
        <div className="comment-children">
          {comment.children.map((child) => (
            <Comment
              key={child.id}
              comment={child}
              onReply={onReply}
              onDelete={onDelete}
              loggedInUser={loggedInUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
