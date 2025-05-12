import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase/config";
import logo from "../Assets/logo.png";
import google from "../Assets/google.svg";

import "./styles/Auth.css";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return false;
    }

    if (!password.trim()) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }

    if (!isLogin && password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }

    return true;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        // 로그인
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // 회원가입
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error("인증 오류:", error);

      // 에러 메시지 사용자 친화적으로 변환
      if (error.code === "auth/invalid-email") {
        setError("유효하지 않은 이메일 형식입니다.");
      } else if (error.code === "auth/user-not-found") {
        setError("등록되지 않은 이메일입니다.");
      } else if (error.code === "auth/wrong-password") {
        setError("비밀번호가 일치하지 않습니다.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("이미 사용 중인 이메일입니다.");
      } else if (error.code === "auth/weak-password") {
        setError("비밀번호는 최소 6자 이상이어야 합니다.");
      } else {
        setError("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 로그인 처리 함수
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // 성공적으로 로그인되면 AuthProvider에서 처리됨
    } catch (error) {
      console.error("Google 로그인 오류:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setError("로그인 창이 닫혔습니다. 다시 시도해주세요.");
      } else if (error.code === "auth/cancelled-popup-request") {
        // 사용자가 여러 번 클릭한 경우 - 오류 메시지 표시하지 않음
      } else {
        setError("Google 로그인에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          {/* 로고 이미지가 있다면 여기에 추가 */}
          <img src={logo} alt="커플 투두리스트 로고" />
        </div>

        <h1 className="auth-main-title">커플 투두리스트</h1>
        <p className="auth-subtitle">함께 만드는 우리만의 계획</p>

        <h2 className="auth-title">{isLogin ? "로그인" : "회원가입"}</h2>

        <form onSubmit={handleAuth} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "비밀번호" : "6자 이상의 비밀번호"}
              disabled={loading}
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <div className="social-login">
          <div className="social-divider">
            <div className="divider-line"></div>
            <span className="divider-text">또는</span>
            <div className="divider-line"></div>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="social-buttons">
            <button
              type="button"
              className="social-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <img src={google} alt="Google" width="24" height="24" />
            </button>
          </div>
        </div>

        <p className="auth-toggle">
          {isLogin ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="toggle-button"
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
