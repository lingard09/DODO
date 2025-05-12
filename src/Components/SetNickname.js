import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo(userData);
          // 이미 닉네임이 있으면 불러오기
          if (userData.nickname) {
            setNickname(userData.nickname);
          }
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

    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 사용자 문서 업데이트
      await updateDoc(doc(db, "users", currentUser.uid), {
        nickname: nickname.trim(),
      });

      // 만약 이미 커플 연결이 되어 있다면, couples 문서도 업데이트
      if (userInfo?.coupleCode) {
        const coupleDoc = await getDoc(doc(db, "couples", userInfo.coupleCode));

        if (coupleDoc.exists()) {
          const coupleData = coupleDoc.data();

          // 생성자인지 파트너인지에 따라 다른 필드 업데이트
          if (coupleData.creator === currentUser.uid) {
            await updateDoc(doc(db, "couples", userInfo.coupleCode), {
              creatorNickname: nickname.trim(),
            });
          } else if (coupleData.partner === currentUser.uid) {
            await updateDoc(doc(db, "couples", userInfo.coupleCode), {
              partnerNickname: nickname.trim(),
            });
          }
        }
      }

      // 완료 콜백 호출
      onComplete();
    } catch (error) {
      console.error("닉네임 저장 오류:", error);
      setError("닉네임을 저장하는 중 오류가 발생했습니다.");
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
