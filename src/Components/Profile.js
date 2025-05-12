import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../Components/AuthProvider';

const Profile = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const getUserInfo = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().nickname) {
          setNickname(userDoc.data().nickname);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error);
      }
    };

    getUserInfo();
  }, [currentUser]);

  const updateProfile = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // 사용자 정보 가져오기
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      
      const userData = userDoc.data();
      
      // 사용자 문서 업데이트
      await updateDoc(doc(db, 'users', currentUser.uid), {
        nickname: nickname.trim()
      });
      
      // 커플 문서 업데이트
      if (userData.coupleCode) {
        const coupleDoc = await getDoc(doc(db, 'couples', userData.coupleCode));
        
        if (coupleDoc.exists()) {
          if (userData.role === 'creator') {
            await updateDoc(doc(db, 'couples', userData.coupleCode), {
              creatorNickname: nickname.trim()
            });
          } else {
            await updateDoc(doc(db, 'couples', userData.coupleCode), {
              partnerNickname: nickname.trim()
            });
          }
        }
      }
      
      setSuccess(true);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setError('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">프로필 수정</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={updateProfile}>
            <div className="form-group">
              <label htmlFor="profile-nickname">닉네임</label>
              <input
                id="profile-nickname"
                type="text"
                className="auth-input"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                maxLength={10}
                disabled={loading}
              />
              <small className="form-hint">
                최대 10자까지 입력 가능합니다
              </small>
            </div>
            
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">프로필이 업데이트되었습니다.</p>}
            
            <button
              type="submit"
              className="todo-button"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;