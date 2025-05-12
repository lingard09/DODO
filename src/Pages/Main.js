import React, { useState, useEffect } from 'react';
import './styles/Main.css'; // CSS 파일 import

const Main = () => {
  // 초기 상태 설정
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('coupleTasks');
    return savedTasks ? JSON.parse(savedTasks) : [
      { 
        id: 1, 
        text: '영화 데이트 하기', 
        completed: false, 
        assignee: '둘 다', 
        dueDate: '2025-05-20',
        comments: [
          { id: 101, text: '해리포터 보고 싶어요!', author: '내가', date: '2025-05-11' }
        ],
        images: []
      },
      { 
        id: 2, 
        text: '기념일 선물 준비하기', 
        completed: false, 
        assignee: '내가', 
        dueDate: '2025-05-25',
        comments: [],
        images: []
      },
      { 
        id: 3, 
        text: '함께 요리 만들기', 
        completed: true, 
        assignee: '둘 다', 
        dueDate: '2025-05-10',
        comments: [
          { id: 102, text: '파스타 맛있었어요!', author: '상대방', date: '2025-05-10' }
        ],
        images: []
      }
    ];
  });
  
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('둘 다');
  const [newDueDate, setNewDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [commentAuthor, setCommentAuthor] = useState('내가');
  
  // 로컬 스토리지에 상태 저장
  useEffect(() => {
    localStorage.setItem('coupleTasks', JSON.stringify(tasks));
  }, [tasks]);
  
  // 새 할일 추가
  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    const newTaskObj = {
      id: Date.now(),
      text: newTask,
      completed: false,
      assignee: newAssignee,
      dueDate: newDueDate || '',
      comments: [],
      images: []
    };
    
    setTasks([...tasks, newTaskObj]);
    setNewTask('');
    setNewDueDate('');
  };
  
  // 할일 완료 상태 토글
  const toggleComplete = (e, id) => {
    e.stopPropagation(); // 이벤트 버블링 중지하여 모달이 열리지 않게 함
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };
  
  // 할일 삭제
  const deleteTask = (e, id) => {
    e.stopPropagation(); // 이벤트 버블링 중지
    setTasks(tasks.filter(task => task.id !== id));
  };
  
  // 모달 열기
  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setNewComment('');
    setNewImage(null);
  };
  
  // 코멘트 추가
  const addComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    
    const newCommentObj = {
      id: Date.now(),
      text: newComment,
      author: commentAuthor,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === selectedTask.id 
        ? { 
            ...task, 
            comments: [...task.comments, newCommentObj]
          } 
        : task
    );
    
    setTasks(updatedTasks);
    setSelectedTask({...selectedTask, comments: [...selectedTask.comments, newCommentObj]});
    setNewComment('');
  };
  
  // 이미지 처리
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImage(file);
    }
  };
  
  // 이미지 추가
  const addImage = (e) => {
    e.preventDefault();
    if (!newImage || !selectedTask) return;
    
    // 실제로는 서버에 업로드하고 URL을 받아와야 하지만, 
    // 여기서는 로컬 미리보기로 구현
    const imageUrl = URL.createObjectURL(newImage);
    
    const newImageObj = {
      id: Date.now(),
      url: imageUrl,
      name: newImage.name
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === selectedTask.id 
        ? { 
            ...task, 
            images: [...task.images, newImageObj]
          } 
        : task
    );
    
    setTasks(updatedTasks);
    setSelectedTask({...selectedTask, images: [...selectedTask.images, newImageObj]});
    setNewImage(null);
    
    // 파일 입력 초기화
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = '';
  };
  
  // 이미지 삭제
  const deleteImage = (imageId) => {
    const updatedTasks = tasks.map(task => 
      task.id === selectedTask.id 
        ? { 
            ...task, 
            images: task.images.filter(img => img.id !== imageId)
          } 
        : task
    );
    
    setTasks(updatedTasks);
    setSelectedTask({
      ...selectedTask, 
      images: selectedTask.images.filter(img => img.id !== imageId)
    });
  };
  
  // 할일 필터링
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    if (filter === 'completed') {
      filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (filter === 'active') {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (filter === 'mine') {
      filteredTasks = filteredTasks.filter(task => task.assignee === '내가');
    } else if (filter === 'partner') {
      filteredTasks = filteredTasks.filter(task => task.assignee === '상대방');
    } else if (filter === 'both') {
      filteredTasks = filteredTasks.filter(task => task.assignee === '둘 다');
    }
    
    // 날짜별 정렬
    return filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };
  
  const filteredTasks = getFilteredTasks();
  
  return (
    <div className="todo-container">
      <div className="todo-header">
        <h1>우리의 투두리스트</h1>
      </div>
      
      {/* 입력 폼 */}
      <form className="todo-form" onSubmit={addTask}>
        <div className="todo-input-group">
          <input
            type="text"
            className="todo-input"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="할 일을 입력하세요..."
          />
          <button type="submit" className="todo-button">추가</button>
        </div>
        
        <div className="todo-form-options">
          <div className="form-group">
            <label className="form-label">담당자</label>
            <select
              className="form-select"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            >
              <option value="내가">내가</option>
              <option value="상대방">상대방</option>
              <option value="둘 다">둘 다</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">마감일</label>
            <input
              type="date"
              className="form-date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
        </div>
      </form>
      
      {/* 필터 버튼 */}
      <div className="filter-container">
        <button 
          className={`filter-button ${filter === 'all' ? 'active' : ''}`} 
          onClick={() => setFilter('all')}
        >
          전체
        </button>
        <button 
          className={`filter-button ${filter === 'active' ? 'active' : ''}`} 
          onClick={() => setFilter('active')}
        >
          미완료
        </button>
        <button 
          className={`filter-button ${filter === 'completed' ? 'active' : ''}`} 
          onClick={() => setFilter('completed')}
        >
          완료
        </button>
        <button 
          className={`filter-button ${filter === 'mine' ? 'active' : ''}`} 
          onClick={() => setFilter('mine')}
        >
          내가
        </button>
        <button 
          className={`filter-button ${filter === 'partner' ? 'active' : ''}`} 
          onClick={() => setFilter('partner')}
        >
          상대방
        </button>
        <button 
          className={`filter-button ${filter === 'both' ? 'active' : ''}`} 
          onClick={() => setFilter('both')}
        >
          둘 다
        </button>
      </div>
      
      {/* 할일 목록 */}
      <div className="todo-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-message">할 일이 없습니다</div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`todo-item ${task.completed ? 'completed' : ''}`}
              onClick={() => openModal(task)}
            >
              <div className="todo-item-left">
                <input
                  type="checkbox"
                  className="todo-checkbox"
                  checked={task.completed}
                  onChange={(e) => toggleComplete(e, task.id)}
                />
                <div className="todo-content">
                  <span className="todo-text">{task.text}</span>
                  <div className="todo-meta">
                    <span className={`todo-tag ${
                      task.assignee === '내가' ? 'tag-me' : 
                      task.assignee === '상대방' ? 'tag-partner' : 'tag-both'
                    }`}>
                      {task.assignee}
                    </span>
                    {task.dueDate && (
                      <span className="todo-tag tag-date">
                        {task.dueDate}
                      </span>
                    )}
                    {task.comments.length > 0 && (
                      <span className="todo-tag">
                        댓글 {task.comments.length}
                      </span>
                    )}
                    {task.images.length > 0 && (
                      <span className="todo-tag">
                        사진 {task.images.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                className="todo-delete"
                onClick={(e) => deleteTask(e, task.id)}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* 통계 정보 */}
      <div className="todo-stats">
        총 {tasks.length}개 중 {tasks.filter(t => t.completed).length}개 완료
      </div>
      
      {/* 상세 모달 */}
      {isModalOpen && selectedTask && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedTask.text}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {/* 할일 정보 */}
              <div className="modal-section">
                <h3 className="modal-section-title">기본 정보</h3>
                <div className="modal-info">
                  <div className="modal-info-item">
                    <span className="modal-info-label">상태</span>
                    <span className="modal-info-value">
                      {selectedTask.completed ? '완료' : '미완료'}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="modal-info-label">담당자</span>
                    <span className="modal-info-value">{selectedTask.assignee}</span>
                  </div>
                  {selectedTask.dueDate && (
                    <div className="modal-info-item">
                      <span className="modal-info-label">마감일</span>
                      <span className="modal-info-value">{selectedTask.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 이미지 섹션 */}
              <div className="modal-section">
                <h3 className="modal-section-title">이미지</h3>
                <div className="image-section">
                  {selectedTask.images.length > 0 ? (
                    <div className="image-preview">
                      {selectedTask.images.map(image => (
                        <div key={image.id} className="image-item">
                          <img src={image.url} alt={image.name} />
                          <button 
                            className="image-delete"
                            onClick={() => deleteImage(image.id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>아직 업로드된 이미지가 없습니다.</p>
                  )}
                  
                  <form onSubmit={addImage} className="image-upload">
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
                      <span className="file-name">{newImage.name}</span>
                    )}
                    {newImage && (
                      <button type="submit" className="todo-button">
                        업로드
                      </button>
                    )}
                  </form>
                </div>
              </div>
              
              {/* 댓글 섹션 */}
              <div className="modal-section">
                <h3 className="modal-section-title">댓글</h3>
                <div className="comment-list">
                  {selectedTask.comments.length > 0 ? (
                    selectedTask.comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{comment.author}</span>
                          <span className="comment-date">{comment.date}</span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p>아직 작성된 댓글이 없습니다.</p>
                  )}
                </div>
                
                <form onSubmit={addComment} className="comment-form">
                  <div className="form-group">
                    <label className="form-label">작성자</label>
                    <select
                      className="form-select"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                    >
                      <option value="내가">내가</option>
                      <option value="상대방">상대방</option>
                    </select>
                  </div>
                  
                  <textarea
                    className="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                  ></textarea>
                  
                  <button type="submit" className="todo-button">
                    댓글 작성
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Main;