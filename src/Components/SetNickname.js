import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./AuthProvider";
import "../Components/styles/Auth.css"; // 기존 스타일 재사용

const SetNickname = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  // 기존 사용자 정보 확인
  useEffect(() => {
    const getUserInfo = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo(userData);
          // 이미 닉네임이 있으면 불러오기
          if (userData.nickname) {
            setNickname(userData.nickname);
          }
        } else {
          console.log("사용자 문서가 존재하지 않음, 초기 문서 생성 필요");
        }
      } catch (error) {
        console.error("사용자 정보 가져오기 오류:", error);
      }
    };

    getUserInfo();
  }, [currentUser]);

  // 닉네임 저장
  const saveNickname = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      // 먼저 문서가 존재하는지 확인
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // 사용자 문서가 존재하지 않으면 새로 생성
        console.log("사용자 문서 생성");
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          nickname: nickname.trim(),
          createdAt: new Date(),
          photoURL: currentUser.photoURL || null,
          role: "unassigned" // 아직 커플 연결이 안 되었으므로 미지정 상태
        });
      } else {
        // 이미 존재하면 업데이트
        console.log("사용자 문서 업데이트");
        await updateDoc(userRef, {
          nickname: nickname.trim(),
          updatedAt: new Date()
        });

        // 만약 이미 커플 연결이 되어 있다면, couples 문서도 업데이트
        if (userInfo?.coupleCode) {
          const coupleRef = doc(db, "couples", userInfo.coupleCode);
          const coupleDoc = await getDoc(coupleRef);

          if (coupleDoc.exists()) {
            const coupleData = coupleDoc.data();

            // 생성자인지 파트너인지에 따라 다른 필드 업데이트
            if (coupleData.creator === currentUser.uid) {
              await updateDoc(coupleRef, {
                creatorNickname: nickname.trim(),
                updatedAt: new Date()
              });
            } else if (coupleData.partner === currentUser.uid) {
              await updateDoc(coupleRef, {
                partnerNickname: nickname.trim(),
                updatedAt: new Date()
              });
            }
          }
        }
      }

      console.log("닉네임 저장 완료");
      // 완료 콜백 호출
      onComplete();
    } catch (error) {
      console.error("닉네임 저장 오류:", error);
      setError(`닉네임을 저장하는 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-main-title">커플 투두리스트</h1>
        <h2 className="auth-title">닉네임 설정</h2>
        <p className="auth-subtitle">상대방에게 표시될 닉네임을 설정해주세요</p>

        <form onSubmit={saveNickname} className="auth-form">
          <div className="form-group">
            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              type="text"
              className="auth-input"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="사용할 닉네임을 입력하세요"
              maxLength={10}
              disabled={loading}
            />
            <small className="form-hint">최대 10자까지 입력 가능합니다</small>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "저장 중..." : "저장하기"}
          </button>

          {userInfo?.nickname && (
            <button
              type="button"
              className="auth-button auth-button-secondary"
              onClick={onComplete}
              disabled={loading}
            >
              건너뛰기
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default SetNickname;