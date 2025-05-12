import React from "react";

const TaskItem = ({ task, toggleComplete, deleteTask, openModal }) => {
  const handleToggle = (e) => {
    e.stopPropagation();
    toggleComplete(task.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  return (
    <div
      className={`todo-item ${task.completed ? "completed" : ""}`}
      onClick={() => openModal(task)}
    >
      <div className="todo-item-left">
        <input
          type="checkbox"
          className="todo-checkbox"
          checked={task.completed}
          onChange={handleToggle}
        />
        <div className="todo-content">
          <span className="todo-text">{task.text}</span>
          <div className="todo-meta">
            <span
              className={`todo-tag ${
                task.assignee === "나"
                  ? "tag-me"
                  : task.assignee === "상대"
                  ? "tag-partner"
                  : "tag-both"
              }`}
            >
              {task.assignee}
            </span>
            {task.dueDate && (
              <span className="todo-tag tag-date">{task.dueDate}</span>
            )}
            {task.comments && task.comments.length > 0 && (
              <span className="todo-tag">
                댓글 {task.comments.length}
              </span>
            )}
            {task.images && task.images.length > 0 && (
              <span className="todo-tag">
                사진 {task.images.length}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        className="todo-delete"
        onClick={handleDelete}
      >
        ✕
      </button>
    </div>
  );
};

export default TaskItem;