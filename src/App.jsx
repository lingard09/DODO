// src/App.jsx
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import { AuthProvider, useAuth } from "./Components/AuthProvider";
import Auth from "./Components/Auth";
import CoupleConnect from "./Components/CoupleConnect";
import SetNickname from "./Components/SetNickname";

const AppContent = () => {
  const { currentUser } = useAuth();
  // userInfo 상태 변수를 생략하고 설정 함수만 유지
  const [, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNickname, setHasNickname] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 사용자 정보 및 상태 확인
  useEffect(() => {
    const checkUserInfo = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo(userData); // userInfo 설정은 여전히 필요함

          // 닉네임이 있는지 확인
          if (userData.nickname) {
            setHasNickname(true);
          }

          // 커플 코드가 있는지 확인
          if (userData.coupleCode) {
            setIsConnected(true);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("사용자 정보 확인 오류:", error);
        setLoading(false);
      }
    };

    checkUserInfo();
  }, [currentUser]);

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  if (!currentUser) {
    return <Auth />;
  }

  if (!hasNickname) {
    return <SetNickname onComplete={() => setHasNickname(true)} />;
  }

  if (!isConnected) {
    return <CoupleConnect onComplete={() => setIsConnected(true)} />;
  }

  // CoupleToDoList 컴포넌트 임포트
  const CoupleToDoList = React.lazy(() => import("./Components/Main"));

  return (
    <React.Suspense
      fallback={<div className="loading-container">로딩 중...</div>}
    >
      <CoupleToDoList />
    </React.Suspense>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
