import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";

export const useTaskData = (currentUser) => {
  const [tasks, setTasks] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [coupleInfo, setCoupleInfo] = useState(null);
  const [loading, setLoading] = useState(true);

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

    // 리스너 설정
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
  }, [userInfo]);

  // 새 할일 추가
  const addTask = async (text, assignee, dueDate) => {
    if (!text.trim() || !userInfo?.coupleCode) return;

    try {
      console.log("할 일 추가 시도:", {
        text,
        assignee,
        dueDate,
      });

      const taskData = {
        text,
        completed: false,
        assignee,
        dueDate: dueDate || "",
        comments: [],
        images: [],
        coupleCode: userInfo.coupleCode,
        createdAt: new Date(),
        createdBy: currentUser.uid,
      };

      await addDoc(collection(db, "tasks"), taskData);
    } catch (error) {
      console.error("할 일 추가 오류:", error);
    }
  };

  // 다른 필요한 기능들은 useTaskActions 훅으로 분리

  return {
    tasks,
    userInfo,
    coupleInfo,
    loading,
    addTask,
    toggleComplete: (taskId) => useTaskActions().toggleComplete(taskId), 
    deleteTask: (taskId) => useTaskActions().deleteTask(taskId)
  };
};

// 이 함수는 useTaskData에서 임시로 사용하기 위한 함수입니다.
// 실제 구현은 useTaskActions 훅에 있습니다.
const useTaskActions = () => {
  return {
    toggleComplete: () => {},
    deleteTask: () => {}
  };
};