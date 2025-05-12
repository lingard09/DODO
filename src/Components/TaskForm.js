import React, { useState } from "react";

const TaskForm = ({ addTask, userInfo, coupleInfo }) => {
  const [newTask, setNewTask] = useState("");
  const [newAssignee, setNewAssignee] = useState("우리");
  const [newDueDate, setNewDueDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    addTask(newTask, newAssignee, newDueDate);
    setNewTask("");
    setNewDueDate("");
    // setNewAssignee("우리"); // 필요에 따라 담당자 초기화
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="todo-input-group">
        <input
          type="text"
          className="todo-input"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="할 일을 입력하세요..."
        />
        <button type="submit" className="todo-button">
          추가
        </button>
      </div>

      <div className="todo-form-options">
        <div className="form-group">
          <label className="form-label">담당자</label>
          <select
            className="form-select"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
          >
            <option value="나">
              {userInfo.role === "creator"
                ? coupleInfo.creatorNickname
                : coupleInfo.partnerNickname || "나"}
              (나)
            </option>
            <option value="상대">
              {userInfo.role === "creator"
                ? coupleInfo.partnerNickname || "상대방"
                : coupleInfo.creatorNickname}
              (상대)
            </option>
            <option value="우리">우리</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">마감일</label>
          <input
            type="date"
            className="form-date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
      </div>
    </form>
  );
};

export default TaskForm;