import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./styles/Profile.css";

const Profile = ({ onClose }) => {
  const { currentUser } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [coupleInfo, setCoupleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 편집 필드
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 사용자 정보 로드
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo(userData);
          setNickname(userData.nickname || "");
          
          // 커플 정보 로드
          if (userData.coupleCode) {
            const coupleDoc = await getDoc(doc(db, "couples", userData.coupleCode));
            if (coupleDoc.exists()) {
              setCoupleInfo(coupleDoc.data());
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("프로필 정보 로딩 오류:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  // 프로필 이미지 변경 처리
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  // 프로필 저장
  const saveProfile = async () => {
    if (!userInfo) return;
    
    try {
      let photoURL = userInfo.photoURL;
      
      // 이미지 업로드 처리
      if (profileImage) {
        const imagePath = `profileImages/${currentUser.uid}/${Date.now()}_${profileImage.name}`;
        const imageRef = ref(storage, imagePath);
        
        await uploadBytes(imageRef, profileImage);
        photoURL = await getDownloadURL(imageRef);
      }
      
      // 사용자 문서 업데이트
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        nickname: nickname.trim() || userInfo.nickname,
        photoURL: photoURL,
        updatedAt: new Date()
      });
      
      // 커플 문서 업데이트 (역할에 따라 필드 결정)
      if (userInfo.coupleCode) {
        const coupleRef = doc(db, "couples", userInfo.coupleCode);
        
        if (userInfo.role === "creator") {
          await updateDoc(coupleRef, {
            creatorNickname: nickname.trim() || userInfo.nickname,
            creatorPhotoURL: photoURL,
            updatedAt: new Date()
          });
        } else {
          await updateDoc(coupleRef, {
            partnerNickname: nickname.trim() || userInfo.nickname,
            partnerPhotoURL: photoURL,
            updatedAt: new Date()
          });
        }
      }
      
      // 편집 모드 종료
      setIsEditing(false);
      
      // 데이터 다시 로드
      const updatedUserDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (updatedUserDoc.exists()) {
        setUserInfo(updatedUserDoc.data());
      }
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      alert("프로필 저장 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return <div className="profile-modal">로딩 중...</div>;
  }

  return (
    <div className="profile-backdrop" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>프로필</h2>
          <button className="profile-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="profile-content">
          {/* 프로필 이미지 섹션 */}
          <div className="profile-image-section">
            <div className="profile-image-container">
              <img 
                src={imagePreview || userInfo?.photoURL || "https://via.placeholder.com/150"} 
                alt="프로필" 
                className="profile-image"
              />
              {isEditing && (
                <label htmlFor="profile-upload" className="image-upload-label">
                  사진 변경
                </label>
              )}
              {isEditing && (
                <input 
                  type="file" 
                  id="profile-upload" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                />
              )}
            </div>
          </div>
          
          {/* 프로필 정보 섹션 */}
          <div className="profile-info-section">
            {isEditing ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>닉네임</label>
                  <input 
                    type="text" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
                <div className="profile-edit-buttons">
                  <button 
                    className="profile-cancel-btn" 
                    onClick={() => {
                      setIsEditing(false);
                      setNickname(userInfo?.nickname || "");
                      setProfileImage(null);
                      setImagePreview(null);
                    }}
                  >
                    취소
                  </button>
                  <button 
                    className="profile-save-btn" 
                    onClick={saveProfile}
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="profile-info-item">
                  <span className="profile-info-label">이메일</span>
                  <span className="profile-info-value">{currentUser?.email}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">닉네임</span>
                  <span className="profile-info-value">{userInfo?.nickname || "설정되지 않음"}</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">커플 코드</span>
                  <span className="profile-info-value">{userInfo?.coupleCode || "없음"}</span>
                </div>
                {coupleInfo && (
                  <div className="profile-info-item">
                    <span className="profile-info-label">파트너</span>
                    <span className="profile-info-value">
                      {userInfo?.role === "creator" 
                        ? coupleInfo?.partnerNickname || "아직 없음" 
                        : coupleInfo?.creatorNickname}
                    </span>
                  </div>
                )}
                <button 
                  className="profile-edit-btn" 
                  onClick={() => setIsEditing(true)}
                >
                  프로필 수정
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;