import React, { useState } from "react";
import { storage } from "../firebase/config";
import { ref } from "firebase/storage";

const ImageSection = ({ images = [], taskId, userInfo, addImage, deleteImage }) => {
  const [newImage, setNewImage] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage(e.target.files[0]);
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImage) return;
    
    await addImage(taskId, newImage, userInfo.coupleCode);
    setNewImage(null);
    
    // 파일 입력 초기화
    const fileInput = document.getElementById("imageUpload");
    if (fileInput) fileInput.value = "";
  };

  const handleDeleteImage = (imageId) => {
    deleteImage(taskId, imageId);
  };

  return (
    <div className="modal-section">
      <h3 className="modal-section-title">이미지</h3>
      <div className="image-section">
        {images && images.length > 0 ? (
          <div className="image-preview">
            {images.map((image) => (
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
                          // 여기서는 getDownloadURL 구현이 별도의 훅에 있어 실제 URL을 얻지 않음
                          console.log("이미지 URL 재로딩 시도", imageRef);
                        } catch (err) {
                          console.error("이미지 URL 재시도 실패:", err);
                        }
                      })();
                    }
                  }}
                />
                <button
                  className="image-delete"
                  onClick={() => handleDeleteImage(image.id)}
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
              <button className="todo-button" onClick={handleAddImage}>
                업로드
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageSection;