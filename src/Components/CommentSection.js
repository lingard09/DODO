import React, { useState } from "react";

const CommentSection = ({ comments = [], taskId, currentUser, addComment }) => {
  const [newComment, setNewComment] = useState("");

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addComment(taskId, newComment);
    setNewComment("");
  };

  return (
    <div className="modal-section">
      <h3 className="modal-section-title">댓글</h3>
      <div className="comment-list">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">
                  {comment.createdBy === currentUser.uid ? "나" : "상대"}
                </span>
                <span className="comment-date">{comment.date}</span>
              </div>
              <p className="comment-text">{comment.text}</p>
            </div>
          ))
        ) : (
          <p>아직 작성된 댓글이 없습니다.</p>
        )}
      </div>

      <div className="comment-form">
        <textarea
          className="comment-input"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="댓글을 입력하세요..."
        ></textarea>

        <button className="todo-button" onClick={handleAddComment}>
          댓글 작성
        </button>
      </div>
    </div>
  );
};

export default CommentSection;