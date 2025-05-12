import React, { useState } from "react";
import { useTaskActions } from "../hooks/useTaskActions";
import CommentSection from "./CommentSection";
import ImageSection from "./ImageSection";

const TaskModal = ({ task, closeModal, currentUser, userInfo }) => {
  const [selectedTask, setSelectedTask] = useState(task);
  const { addComment, addImage, deleteImage } = useTaskActions(currentUser, setSelectedTask);

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{selectedTask.text}</h2>
          <button className="modal-close" onClick={closeModal}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* 할일 정보 */}
          <div className="modal-section">
            <h3 className="modal-section-title">기본 정보</h3>
            <div className="modal-info">
              <div className="modal-info-item">
                <span className="modal-info-label">상태</span>
                <span className="modal-info-value">
                  {selectedTask.completed ? "완료" : "미완료"}
                </span>
              </div>
              <div className="modal-info-item">
                <span className="modal-info-label">담당자</span>
                <span className="modal-info-value">
                  {selectedTask.assignee}
                </span>
              </div>
              {selectedTask.dueDate && (
                <div className="modal-info-item">
                  <span className="modal-info-label">마감일</span>
                  <span className="modal-info-value">
                    {selectedTask.dueDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 이미지 섹션 */}
          <ImageSection 
            images={selectedTask.images} 
            taskId={selectedTask.id}
            userInfo={userInfo}
            addImage={addImage}
            deleteImage={deleteImage}
          />

          {/* 댓글 섹션 */}
          <CommentSection 
            comments={selectedTask.comments}
            taskId={selectedTask.id}
            currentUser={currentUser}
            addComment={addComment}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskModal;