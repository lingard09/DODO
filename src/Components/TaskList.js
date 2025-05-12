import React from "react";
import TaskItem from "./TaskItem";

const TaskList = ({ tasks, toggleComplete, deleteTask, openModal }) => {
  return (
    <div className="todo-list">
      {tasks.length === 0 ? (
        <div className="empty-message">할 일이 없습니다</div>
      ) : (
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            toggleComplete={toggleComplete}
            deleteTask={deleteTask}
            openModal={openModal}
          />
        ))
      )}
    </div>
  );
};

export default TaskList;