import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { signOut } from "firebase/auth";
import { db, storage, auth } from "../firebase/config";
import { useAuth } from "../Components/AuthProvider";
import "./styles/Main.css";

const Main = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [coupleInfo, setCoupleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 기존 상태 유지
  const [newTask, setNewTask] = useState("");
  const [newAssignee, setNewAssignee] = useState("둘 다");
  const [newDueDate, setNewDueDate] = useState("");
  const [filter, setFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [commentAuthor, setCommentAuthor] = useState("");

  useEffect(() => {
    if (!userInfo?.coupleCode) return;

    console.log("할 일 목록 리스너 설정 중...");

    // 쿼리 설정
    const q = query(
      collection(db, "tasks"),
      where("coupleCode", "==", userInfo.coupleCode),
      orderBy("createdAt", "desc")
    );

    // 리스너 설정 - 즉시 콜백 실행 옵션 추가
    const unsubscribe = onSnapshot(
      q,
      { includeMetadataChanges: true },
      (snapshot) => {
        console.log(
          "스냅샷 수신:",
          snapshot.docs.length,
          "건, 소스:",
          snapshot.metadata.fromCache ? "캐시" : "서버"
        );

        // 서버에서 데이터를 받았을 때만 UI 업데이트
        if (!snapshot.metadata.hasPendingWrites) {
          const taskList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTasks(taskList);
        }
      },
      (error) => {
        console.error("할 일 목록 리스너 오류:", error);
      }
    );
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [userInfo, db]);

  // 사용자 및 커플 정보 불러오기
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserInfo = async () => {
      try {
        // 사용자 정보 불러오기
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo(userData);
          setCommentAuthor(userData.role === "creator" ? "내가" : "상대방");

          // 커플 정보 불러오기
          if (userData.coupleCode) {
            const coupleDoc = await getDoc(
              doc(db, "couples", userData.coupleCode)
            );

            if (coupleDoc.exists()) {
              setCoupleInfo(coupleDoc.data());
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("정보 불러오기 오류:", error);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [currentUser]);

  // 할일 목록 실시간 동기화
  useEffect(() => {
    if (!userInfo?.coupleCode) return;

    // Firestore 쿼리 설정
    const q = query(
      collection(db, "tasks"),
      where("coupleCode", "==", userInfo.coupleCode),
      orderBy("createdAt", "desc")
    );

    // 실시간 리스너 설정
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTasks(taskList);
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [userInfo]);

  // 새 할일 추가
  // 새 할일 추가
  const addTask = async (e) => {
    e.preventDefault();
    console.log("할 일 추가 시도:", {
      newTask,
      newAssignee,
      newDueDate,
      userInfo,
    });

    if (!newTask.trim()) {
      console.log("할 일 내용이 비어 있습니다.");
      return;
    }

    if (!userInfo?.coupleCode) {
      console.log("커플 코드가 없습니다.");
      return;
    }

    try {
      console.log("Firestore에 할 일 추가 시도...");
      const taskData = {
        text: newTask,
        completed: false,
        assignee: newAssignee,
        dueDate: newDueDate || "",
        comments: [],
        images: [],
        coupleCode: userInfo.coupleCode,
        createdAt: new Date(),
        createdBy: currentUser.uid,
      };
      console.log("추가할 데이터:", taskData);

      const docRef = await addDoc(collection(db, "tasks"), taskData);
      console.log("할 일 추가 성공!", docRef.id);

      setNewTask("");
      setNewDueDate("");
    } catch (error) {
      console.error("할 일 추가 오류 세부 정보:", error);
      console.error("오류 코드:", error.code);
      console.error("오류 메시지:", error.message);
      alert(`할 일 추가 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  // 할일 완료 상태 토글
  const toggleComplete = async (e, taskId) => {
    e.stopPropagation();

    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        await updateDoc(taskRef, {
          completed: !taskDoc.data().completed,
          updatedAt: new Date(),
          updatedBy: currentUser.uid,
        });
      }
    } catch (error) {
      console.error("완료 상태 변경 오류:", error);
    }
  };

  // 할일 삭제
  const deleteTask = async (e, taskId) => {
    e.stopPropagation();

    if (!window.confirm("정말로 이 할일을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("할일 삭제 오류:", error);
    }
  };

  // 모달 열기
  const openModal = async (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setNewComment("");
    setNewImage(null);
  };

  // 댓글 추가
  const addComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;

    try {
      const taskRef = doc(db, "tasks", selectedTask.id);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const newCommentObj = {
          id: Date.now().toString(),
          text: newComment,
          author: commentAuthor,
          date: new Date().toISOString().split("T")[0],
          createdBy: currentUser.uid,
        };

        await updateDoc(taskRef, {
          comments: [...taskData.comments, newCommentObj],
          updatedAt: new Date(),
        });

        setNewComment("");

        // 선택된 task 업데이트
        setSelectedTask({
          ...selectedTask,
          comments: [...selectedTask.comments, newCommentObj],
        });
      }
    } catch (error) {
      console.error("댓글 추가 오류:", error);
    }
  };

  // 이미지 업로드
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const addImage = async (e) => {
    e.preventDefault();
    if (!newImage || !selectedTask || !userInfo?.coupleCode) return;

    try {
      // 스토리지에 이미지 업로드
      const imageRef = ref(
        storage,
        `images/${userInfo.coupleCode}/${Date.now()}_${newImage.name}`
      );

      await uploadBytes(imageRef, newImage);
      const imageUrl = await getDownloadURL(imageRef);

      // Firestore에 이미지 정보 저장
      const taskRef = doc(db, "tasks", selectedTask.id);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const newImageObj = {
          id: Date.now().toString(),
          url: imageUrl,
          name: newImage.name,
          path: imageRef.fullPath,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
        };

        await updateDoc(taskRef, {
          images: [...taskData.images, newImageObj],
          updatedAt: new Date(),
        });

        // 선택된 task 업데이트
        setSelectedTask({
          ...selectedTask,
          images: [...selectedTask.images, newImageObj],
        });

        setNewImage(null);

        // 파일 입력 초기화
        const fileInput = document.getElementById("imageUpload");
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
    }
  };

  // 이미지 삭제
  const deleteImage = async (imageId) => {
    if (!selectedTask) return;

    try {
      const image = selectedTask.images.find((img) => img.id === imageId);

      if (image) {
        // 스토리지에서 이미지 파일 삭제
        const imageRef = ref(storage, image.path);
        await deleteObject(imageRef);

        // Firestore에서 이미지 정보 삭제
        const taskRef = doc(db, "tasks", selectedTask.id);
        const taskDoc = await getDoc(taskRef);

        if (taskDoc.exists()) {
          const filteredImages = taskDoc
            .data()
            .images.filter((img) => img.id !== imageId);

          await updateDoc(taskRef, {
            images: filteredImages,
            updatedAt: new Date(),
          });

          // 선택된 task 업데이트
          setSelectedTask({
            ...selectedTask,
            images: selectedTask.images.filter((img) => img.id !== imageId),
          });
        }
      }
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
    }
  };

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
      filteredTasks = filteredTasks.filter((task) => task.assignee === "내가");
    } else if (filter === "partner") {
      filteredTasks = filteredTasks.filter(
        (task) => task.assignee === "상대방"
      );
    } else if (filter === "both") {
      filteredTasks = filteredTasks.filter((task) => task.assignee === "둘 다");
    }

    // 날짜별 정렬
    return filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  const filteredTasks = getFilteredTasks();

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>우리의 투두리스트</h1>
        {coupleInfo && (
          <div className="couple-info">
            <span>
              {userInfo.role === "creator"
                ? coupleInfo.partnerEmail || "대기 중..."
                : coupleInfo.creatorEmail}{" "}
              님과 연결됨
            </span>
            <button className="logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <form className="todo-form" onSubmit={addTask}>
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
              <option value="내가">내가</option>
              <option value="상대방">상대방</option>
              <option value="둘 다">둘 다</option>
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

      {/* 필터 버튼 */}
      <div className="filter-container">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          전체
        </button>
        <button
          className={`filter-button ${filter === "active" ? "active" : ""}`}
          onClick={() => setFilter("active")}
        >
          미완료
        </button>
        <button
          className={`filter-button ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          완료
        </button>
        <button
          className={`filter-button ${filter === "mine" ? "active" : ""}`}
          onClick={() => setFilter("mine")}
        >
          내가
        </button>
        <button
          className={`filter-button ${filter === "partner" ? "active" : ""}`}
          onClick={() => setFilter("partner")}
        >
          상대방
        </button>
        <button
          className={`filter-button ${filter === "both" ? "active" : ""}`}
          onClick={() => setFilter("both")}
        >
          둘 다
        </button>
      </div>

      {/* 할일 목록 */}
      <div className="todo-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-message">할 일이 없습니다</div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`todo-item ${task.completed ? "completed" : ""}`}
              onClick={() => openModal(task)}
            >
              <div className="todo-item-left">
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={task.completed}
                  onChange={(e) => toggleComplete(e, task.id)}
                />
                <div className="todo-content">
                  <span className="todo-text">{task.text}</span>
                  <div className="todo-meta">
                    <span
                      className={`todo-tag ${
                        task.assignee === "내가"
                          ? "tag-me"
                          : task.assignee === "상대방"
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
                onClick={(e) => deleteTask(e, task.id)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* 통계 정보 */}
      <div className="todo-stats">
        총 {tasks.length}개 중 {tasks.filter((t) => t.completed).length}개 완료
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedTask && (
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
              <div className="modal-section">
                <h3 className="modal-section-title">이미지</h3>
                <div className="image-section">
                  {selectedTask.images && selectedTask.images.length > 0 ? (
                    <div className="image-preview">
                      {selectedTask.images.map((image) => (
                        <div key={image.id} className="image-item">
                          <img src={image.url} alt={image.name} />
                          <button
                            className="image-delete"
                            onClick={() => deleteImage(image.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>아직 업로드된 이미지가 없습니다.</p>
                  )}

                  <div className="image-upload">
                    <label className="file-input-label" htmlFor="imageUpload">
                      이미지 선택
                    </label>
                    <input
                      type="file"
                      id="imageUpload"
                      className="file-input"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {newImage && (
                      <>
                        <span className="file-name">{newImage.name}</span>
                        <button className="todo-button" onClick={addImage}>
                          업로드
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div className="modal-section">
                <h3 className="modal-section-title">댓글</h3>
                <div className="comment-list">
                  {selectedTask.comments && selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">
                            {comment.author}
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
                  <div className="form-group">
                    <label className="form-label">작성자</label>
                    <select
                      className="form-select"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                    >
                      <option value="내가">내가</option>
                      <option value="상대방">상대방</option>
                    </select>
                  </div>

                  <textarea
                    className="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                  ></textarea>

                  <button className="todo-button" onClick={addComment}>
                    댓글 작성
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;
