// src/Components/CoupleConnect.jsx 수정
import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthProvider';
import '../Components/styles/Auth.css'

const CoupleConnect = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [coupleCode, setCoupleCode] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 사용자 정보 확인
  useEffect(() => {
    const checkUserInfo = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
          
          // 이미 커플 코드가 있으면 완료 처리
          if (userDoc.data().coupleCode) {
            onComplete();
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('사용자 정보 확인 오류:', error);
        setLoading(false);
      }
    };

    checkUserInfo();
  }, [currentUser, onComplete]);

  // 새 커플 코드 생성
  const generateCode = async () => {
    if (!currentUser) return;

    try {
      setError('');
      
      // 닉네임 확인
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let nickname = '익명';
      
      if (userDoc.exists() && userDoc.data().nickname) {
        nickname = userDoc.data().nickname;
      }
      
      // 6자리 랜덤 코드 생성
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // couples 컬렉션에 문서 생성
      await setDoc(doc(db, 'couples', code), {
        creator: currentUser.uid,
        creatorEmail: currentUser.email,
        creatorNickname: nickname,
        partner: null,
        partnerEmail: null,
        partnerNickname: null,
        createdAt: new Date()
      });
      
      // users 컬렉션에 사용자 정보 업데이트
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        nickname: nickname,
        coupleCode: code,
        role: 'creator'
      }, { merge: true });
      
      setCoupleCode(code);
      setUserInfo({ coupleCode: code, role: 'creator', nickname });
    } catch (error) {
      console.error('코드 생성 오류:', error);
      setError('코드 생성 중 오류가 발생했습니다');
    }
  };

  // 기존 커플 코드로 연결
  const connectWithCode = async () => {
    if (!currentUser || !coupleCode.trim()) return;

    try {
      setError('');
      
      // 닉네임 확인
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      let nickname = '익명';
      
      if (userDoc.exists() && userDoc.data().nickname) {
        nickname = userDoc.data().nickname;
      }
      
      const coupleDoc = await getDoc(doc(db, 'couples', coupleCode.trim().toUpperCase()));
      
      if (!coupleDoc.exists()) {
        setError('존재하지 않는 커플 코드입니다');
        return;
      }
      
      const coupleData = coupleDoc.data();
      
      // 이미 파트너가 있는 경우
      if (coupleData.partner) {
        setError('이미 사용 중인 커플 코드입니다');
        return;
      }
      
      // 자신이 만든 코드인 경우
      if (coupleData.creator === currentUser.uid) {
        setError('자신이 만든 코드입니다. 파트너에게 코드를 공유하세요');
        return;
      }
      
      // couples 컬렉션 업데이트
      await updateDoc(doc(db, 'couples', coupleCode.trim().toUpperCase()), {
        partner: currentUser.uid,
        partnerEmail: currentUser.email,
        partnerNickname: nickname
      });
      
      // users 컬렉션에 사용자 정보 추가
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: currentUser.email,
        nickname: nickname,
        coupleCode: coupleCode.trim().toUpperCase(),
        role: 'partner'
      }, { merge: true });
      
      setUserInfo({ 
        coupleCode: coupleCode.trim().toUpperCase(), 
        role: 'partner',
        nickname
      });
      
      onComplete();
    } catch (error) {
      console.error('커플 연결 오류:', error);
      setError('연결 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return <div className="loading-container">로딩 중...</div>;
  }

  // 이미 커플 코드가 있는 경우
  if (userInfo?.coupleCode) {
    return (
      <div className="couple-connected">
        <h2>연결 완료!</h2>
        <p>커플 코드: <strong>{userInfo.coupleCode}</strong></p>
        <button onClick={onComplete}>투두리스트로 이동</button>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">커플 연결하기</h2>
        
        <div className="connect-options">
          <div className="connect-option">
            <h3>새로운 연결 시작하기</h3>
            <p>새 커플 코드를 생성하고 파트너와 공유하세요.</p>
            <button 
              className="auth-button"
              onClick={generateCode}
            >
              코드 생성하기
            </button>
            
            {coupleCode && (
              <div className="code-display">
                <p>당신의 커플 코드:</p>
                <h4>{coupleCode}</h4>
                <p>이 코드를 파트너에게 공유하세요!</p>
              </div>
            )}
          </div>
          
          <div className="connect-option">
            <h3>기존 연결에 참여하기</h3>
            <p>파트너에게 받은 커플 코드를 입력하세요.</p>
            <div className="code-input">
              <input 
                type="text" 
                value={coupleCode}
                onChange={(e) => setCoupleCode(e.target.value)}
                placeholder="커플 코드 입력"
                className="auth-input"
              />
              <button 
                className="auth-button"
                onClick={connectWithCode}
              >
                연결하기
              </button>
            </div>
          </div>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default CoupleConnect;