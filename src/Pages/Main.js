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
import Profile from "../Components/Profile";
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

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 불필요한 getImageUrl 함수 제거

  // 할일 목록 실시간 동기화
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

  // 새 할일 추가
  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !userInfo?.coupleCode) return;

    try {
      console.log("할 일 추가 시도:", {
        text: newTask,
        assignee: newAssignee,
        dueDate: newDueDate,
      });

      const taskData = {
        text: newTask,
        completed: false,
        assignee: newAssignee, // 상태 값 사용
        dueDate: newDueDate || "",
        comments: [],
        images: [],
        coupleCode: userInfo.coupleCode,
        createdAt: new Date(),
        createdBy: currentUser.uid,
      };

      await addDoc(collection(db, "tasks"), taskData);

      setNewTask("");
      setNewDueDate("");
      // 필요에 따라 담당자 초기화
      // setNewAssignee('둘 다');
    } catch (error) {
      console.error("할 일 추가 오류:", error);
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
  // 모달 열기 시 이미지 URL 업데이트 함수 추가
  const openModal = async (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);

    // 이미지 URL 업데이트
    if (task.images && task.images.length > 0) {
      try {
        // 이미지 URL이 alt=media 파라미터를 가지고 있지 않은 경우 새 URL 가져오기
        const updatedImages = await Promise.all(
          task.images.map(async (image) => {
            // URL이 이미 올바른 형식인지 확인
            if (image.url && image.url.includes("alt=media")) {
              return image;
            }

            // path가 있으면 새 다운로드 URL 가져오기
            if (image.path) {
              try {
                const imageRef = ref(storage, image.path);
                const newUrl = await getDownloadURL(imageRef);
                console.log(`이미지 ${image.id} URL 업데이트됨:`, newUrl);
                return { ...image, url: newUrl };
              } catch (err) {
                console.error(`이미지 ${image.id} URL 업데이트 실패:`, err);
                return image;
              }
            }
            return image;
          })
        );

        // 업데이트된 이미지가 있으면 상태 업데이트
        if (JSON.stringify(updatedImages) !== JSON.stringify(task.images)) {
          console.log("이미지 URL이 업데이트되었습니다");
          setSelectedTask({
            ...task,
            images: updatedImages,
          });

          // Firestore에도 업데이트 (선택 사항)
          try {
            const taskRef = doc(db, "tasks", task.id);
            await updateDoc(taskRef, { images: updatedImages });
          } catch (updateErr) {
            console.error("Firestore 이미지 URL 업데이트 실패:", updateErr);
          }
        }
      } catch (error) {
        console.error("이미지 URL 업데이트 중 오류 발생:", error);
      }
    }
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
          // 댓글 작성자를 '나' 또는 '상대'로 저장하지 않고 작성자의 uid를 저장
          createdBy: currentUser.uid,
          date: new Date().toISOString().split("T")[0],
        };

        await updateDoc(taskRef, {
          comments: [...(taskData.comments || []), newCommentObj],
          updatedAt: new Date(),
        });

        setNewComment("");

        // 선택된 task 업데이트
        setSelectedTask({
          ...selectedTask,
          comments: [...(selectedTask.comments || []), newCommentObj],
        });
      }
    } catch (error) {
      console.error("댓글 추가 오류:", error);
    }
  };

  const optimizeImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // 캔버스에 이미지 그리기 (크기 줄이기)
          const canvas = document.createElement("canvas");

          // 최대 크기 지정 (e.g., 800x600)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;

          let width = img.width;
          let height = img.height;

          // 비율 유지하면서 크기 조정
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // WebP 형식으로 변환 (지원되는 브라우저에서)
          const format = "image/jpeg";
          const quality = 0.7; // 70% 품질 (파일 크기 감소)

          canvas.toBlob(
            (blob) => {
              // 새 파일 이름 생성
              const optimizedFile = new File([blob], file.name, {
                type: format,
              });
              resolve(optimizedFile);
            },
            format,
            quality
          );
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
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
      // 0. 이미지 최적화
      const optimizedImage = await optimizeImage(newImage);

      // 1. 파일 참조 생성
      const imageName = `${Date.now()}_${optimizedImage.name}`;
      const imagePath = `images/${userInfo.coupleCode}/${imageName}`;
      const imageRef = ref(storage, imagePath);

      // 2. 이미지 업로드
      await uploadBytes(imageRef, optimizedImage);

      // 3. 다운로드 URL 가져오기 - 여기가 중요!
      const downloadUrl = await getDownloadURL(imageRef);
      console.log("생성된 다운로드 URL:", downloadUrl); // 디버깅용

      // 4. Firestore에 이미지 정보 저장 (URL 포함)
      const taskRef = doc(db, "tasks", selectedTask.id);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const newImageObj = {
          id: Date.now().toString(),
          url: downloadUrl, // ← 다운로드 URL 저장
          name: newImage.name,
          path: imagePath,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
        };

        await updateDoc(taskRef, {
          images: [...(taskData.images || []), newImageObj],
          updatedAt: new Date(),
        });

        // 5. UI 업데이트
        setSelectedTask({
          ...selectedTask,
          images: [...(selectedTask.images || []), newImageObj],
        });

        setNewImage(null);

        // 파일 입력 초기화
        const fileInput = document.getElementById("imageUpload");
        if (fileInput) fileInput.value = "";
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      alert("이미지 업로드에 실패했습니다: " + error.message);
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
                          <img
                            src={image.url}
                            alt={image.name}
                            onError={(e) => {
                              console.error("이미지 로딩 실패:", image.url);
                              e.target.src =
                                "https://via.placeholder.com/150?text=이미지+로딩+실패";

                              // 이미지 로딩 실패 시 URL 업데이트 시도 (선택 사항)
                              if (image.path) {
                                (async () => {
                                  try {
                                    const imageRef = ref(storage, image.path);
                                    const newUrl = await getDownloadURL(
                                      imageRef
                                    );

                                    // 새 URL로 이미지 다시 로드 시도
                                    if (newUrl !== image.url) {
                                      e.target.src = newUrl;

                                      // 상태 업데이트
                                      setSelectedTask((prevTask) => {
                                        const updatedImages =
                                          prevTask.images.map((img) =>
                                            img.id === image.id
                                              ? { ...img, url: newUrl }
                                              : img
                                          );
                                        return {
                                          ...prevTask,
                                          images: updatedImages,
                                        };
                                      });
                                    }
                                  } catch (err) {
                                    console.error(
                                      "이미지 URL 재시도 실패:",
                                      err
                                    );
                                  }
                                })();
                              }
                            }}
                          />
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
                            {/* 작성자 uid와 현재 사용자 uid 비교하여 '나' 또는 '상대'로 표시 */}
                            {comment.createdBy === currentUser.uid
                              ? "나"
                              : "상대"}
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
