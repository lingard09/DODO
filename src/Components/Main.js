import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { useAuth } from "./AuthProvider";
import Profile from "./Profile";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import FilterButtons from "./FilterButtons";
import TaskModal from "./TaskModal";
import { useTaskData } from "../hooks/UseTaskData";
import "./styles/Main.css";

const Main = () => {
  const { currentUser } = useAuth();
  const {
    tasks,
    userInfo,
    coupleInfo,
    loading,
    addTask,
    toggleComplete,
    deleteTask,
  } = useTaskData(currentUser);

  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("로그아웃 오류:", error);
    }
  };

  // 필터링된 할일 목록 가져오기
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];

    if (filter === "completed") {
      filteredTasks = filteredTasks.filter((task) => task.completed);
    } else if (filter === "active") {
      filteredTasks = filteredTasks.filter((task) => !task.completed);
    } else if (filter === "mine") {
      filteredTasks = filteredTasks.filter((task) => task.assignee === "나");
    } else if (filter === "partner") {
      filteredTasks = filteredTasks.filter((task) => task.assignee === "상대");
    } else if (filter === "both") {
      filteredTasks = filteredTasks.filter((task) => task.assignee === "우리");
    }

    // 날짜별 정렬
    return filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  // 모달 열기
  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  // coupleInfo가 없을 때 예외 처리
  if (!coupleInfo) {
    return <div className="loading">커플 정보를 불러오는 중...</div>;
  }

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>우리의 두두 아카이브</h1>
        {coupleInfo && (
          <div className="couple-info">
            <span>
              {userInfo.role === "creator"
                ? coupleInfo.partnerNickname || "대기 중..."
                : coupleInfo.creatorNickname}{" "}
              님과 연결됨
            </span>
            <button
              className="profile-button"
              onClick={() => setIsProfileOpen(true)}
            >
              프로필
            </button>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* 프로필 모달 */}
      {isProfileOpen && <Profile onClose={() => setIsProfileOpen(false)} />}

      {/* 입력 폼 */}
      <TaskForm addTask={addTask} userInfo={userInfo} coupleInfo={coupleInfo} />

      {/* 필터 버튼 */}
      <FilterButtons filter={filter} setFilter={setFilter} />

      {/* 할일 목록 */}
      <TaskList
        tasks={filteredTasks}
        toggleComplete={toggleComplete}
        deleteTask={deleteTask}
        openModal={openModal}
      />

      {/* 통계 정보 */}
      <div className="todo-stats">
        총 {tasks.length}개 중 {tasks.filter((t) => t.completed).length}개 완료
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          closeModal={closeModal}
          currentUser={currentUser}
          userInfo={userInfo}
        />
      )}
    </div>
  );
};

export default Main;
