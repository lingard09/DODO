import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase/config";

export const useTaskActions = (currentUser, setSelectedTask = null) => {
  // 할일 완료 상태 토글
  const toggleComplete = async (taskId) => {
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
  const deleteTask = async (taskId) => {
    if (!window.confirm("정말로 이 할일을 삭제하시겠습니까?")) return;

    try {
      await deleteDoc(doc(db, "tasks", taskId));
    } catch (error) {
      console.error("할일 삭제 오류:", error);
    }
  };

  // 댓글 추가
  const addComment = async (taskId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const newCommentObj = {
          id: Date.now().toString(),
          text: commentText,
          createdBy: currentUser.uid,
          date: new Date().toISOString().split("T")[0],
        };

        await updateDoc(taskRef, {
          comments: [...(taskData.comments || []), newCommentObj],
          updatedAt: new Date(),
        });

        // 선택된 task 업데이트 (if setSelectedTask is provided)
        if (setSelectedTask) {
          setSelectedTask((prevTask) => ({
            ...prevTask,
            comments: [...(prevTask.comments || []), newCommentObj],
          }));
        }
      }
    } catch (error) {
      console.error("댓글 추가 오류:", error);
    }
  };

  // 이미지 최적화
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

          // JPEG 형식으로 변환
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

  // 이미지 추가
  const addImage = async (taskId, imageFile, coupleCode) => {
    if (!imageFile || !coupleCode) return;

    try {
      // 이미지 최적화
      const optimizedImage = await optimizeImage(imageFile);

      // 파일 참조 생성
      const imageName = `${Date.now()}_${optimizedImage.name}`;
      const imagePath = `images/${coupleCode}/${imageName}`;
      const imageRef = ref(storage, imagePath);

      // 이미지 업로드
      await uploadBytes(imageRef, optimizedImage);

      // 다운로드 URL 가져오기
      const downloadUrl = await getDownloadURL(imageRef);
      console.log("생성된 다운로드 URL:", downloadUrl);

      // Firestore에 이미지 정보 저장
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const newImageObj = {
          id: Date.now().toString(),
          url: downloadUrl,
          name: imageFile.name,
          path: imagePath,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
        };

        await updateDoc(taskRef, {
          images: [...(taskData.images || []), newImageObj],
          updatedAt: new Date(),
        });

        // 선택된 task 업데이트
        if (setSelectedTask) {
          setSelectedTask((prevTask) => ({
            ...prevTask,
            images: [...(prevTask.images || []), newImageObj],
          }));
        }
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      alert("이미지 업로드에 실패했습니다: " + error.message);
    }
  };

  // 이미지 삭제
  const deleteImage = async (taskId, imageId) => {
    try {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);

      if (!taskDoc.exists()) return;

      const taskData = taskDoc.data();
      const image = taskData.images.find((img) => img.id === imageId);

      if (!image) return;

      // 스토리지에서 이미지 파일 삭제
      const imageRef = ref(storage, image.path);
      await deleteObject(imageRef);

      // Firestore에서 이미지 정보 삭제
      const filteredImages = taskData.images.filter((img) => img.id !== imageId);

      await updateDoc(taskRef, {
        images: filteredImages,
        updatedAt: new Date(),
      });

      // 선택된 task 업데이트
      if (setSelectedTask) {
        setSelectedTask((prevTask) => ({
          ...prevTask,
          images: prevTask.images.filter((img) => img.id !== imageId),
        }));
      }
    } catch (error) {
      console.error("이미지 삭제 오류:", error);
    }
  };

  return {
    toggleComplete,
    deleteTask,
    addComment,
    addImage,
    deleteImage,
  };
};