import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './TestLab.css';

const TestLab = () => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [editingLabelId, setEditingLabelId] = useState(null);
  const [fileCounter, setFileCounter] = useState(1);
  const fileInputRef = useRef(null);
  const labelInputRef = useRef(null);

  // 파일 타입에 따른 아이콘 반환
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word') || file.type.includes('document')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return '📽️';
    return '📁';
  };

  // 파일 크기 포맷팅
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 파일 처리 함수
  const processFiles = useCallback((newFiles) => {
    const fileArray = Array.from(newFiles);
    let currentCounter = fileCounter;

    const processedFiles = fileArray.map((file) => {
      const fileNumber = currentCounter++;
      const fileData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileNumber: fileNumber,
        label: `파일 #${fileNumber}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending', // pending, uploading, completed, error
        preview: null,
        uploadProgress: 0,
      };

      // 이미지 파일인 경우 미리보기 생성
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, preview: e.target.result } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      return fileData;
    });

    setFileCounter(currentCounter);
    setFiles((prev) => [...prev, ...processedFiles]);
  }, [fileCounter]);

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const selectedFiles = e.target.files;
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    e.target.value = '';
  };

  // 드롭존 클릭 핸들러
  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  // 체크박스 선택 핸들러
  const handleSelectFile = (fileId) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  // 단일 파일 삭제
  const handleRemoveFile = (fileId) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  // 선택된 파일 삭제
  const handleRemoveSelected = () => {
    setFiles((prev) => prev.filter((f) => !selectedFiles.has(f.id)));
    setSelectedFiles(new Set());
  };

  // 업로드 시뮬레이션
  const simulateUpload = (fileId) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: 'uploading', uploadProgress: 0 } : f
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, status: 'completed', uploadProgress: 100 }
              : f
          )
        );
      } else {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, uploadProgress: Math.round(progress) } : f
          )
        );
      }
    }, 200);
  };

  // 단일 파일 업로드
  const handleUploadFile = (fileId) => {
    simulateUpload(fileId);
  };

  // 선택된 파일 업로드
  const handleUploadSelected = () => {
    selectedFiles.forEach((fileId) => {
      const file = files.find((f) => f.id === fileId);
      if (file && file.status === 'pending') {
        simulateUpload(fileId);
      }
    });
  };

  // 모든 파일 업로드
  const handleUploadAll = () => {
    files.forEach((file) => {
      if (file.status === 'pending') {
        simulateUpload(file.id);
      }
    });
  };

  // 라벨 편집 시작
  const handleStartEditLabel = (fileId) => {
    setEditingLabelId(fileId);
    setTimeout(() => {
      labelInputRef.current?.focus();
      labelInputRef.current?.select();
    }, 0);
  };

  // 라벨 변경
  const handleLabelChange = (fileId, newLabel) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, label: newLabel } : f
      )
    );
  };

  // 라벨 편집 완료
  const handleFinishEditLabel = () => {
    setEditingLabelId(null);
  };

  // 라벨 편집 키보드 핸들러
  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleFinishEditLabel();
    } else if (e.key === 'Escape') {
      handleFinishEditLabel();
    }
  };

  return (
    <div className="test-lab-container">
      <header className="test-lab-header">
        <h1>{t('testLab.title')}</h1>
        <p>{t('testLab.subtitle')}</p>
      </header>

      <div className="test-lab-content">
        {/* 드래그 앤 드롭 영역 */}
        <div
          className={`dropzone ${isDragOver ? 'dropzone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropzoneClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="file-input-hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <div className="dropzone-content">
            <div className="dropzone-icon">📂</div>
            <p className="dropzone-text">
              {t('testLab.dropzone.text', '파일을 여기에 드래그하거나 클릭하여 선택하세요')}
            </p>
            <p className="dropzone-hint">
              {t('testLab.dropzone.hint', '이미지, PDF, Word, Excel, PowerPoint 파일 지원')}
            </p>
          </div>
        </div>

        {/* 파일 목록 */}
        {files.length > 0 && (
          <div className="file-list-container">
            <div className="file-list-header">
              <div className="file-list-title">
                <h3>{t('testLab.fileList.title', '업로드 파일 목록')}</h3>
                <span className="file-count">{files.length}개 파일</span>
              </div>
              <div className="file-list-actions">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFiles.size === files.length && files.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>{t('testLab.fileList.selectAll', '전체 선택')}</span>
                </label>
                {selectedFiles.size > 0 && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleUploadSelected}
                    >
                      {t('testLab.fileList.uploadSelected', '선택 업로드')} ({selectedFiles.size})
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={handleRemoveSelected}
                    >
                      {t('testLab.fileList.deleteSelected', '선택 삭제')}
                    </button>
                  </>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleUploadAll}
                >
                  {t('testLab.fileList.uploadAll', '전체 업로드')}
                </button>
              </div>
            </div>

            <div className="file-list">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`file-item ${selectedFiles.has(file.id) ? 'selected' : ''}`}
                >
                  <div className="file-number">
                    <span className="number-badge">#{file.fileNumber}</span>
                  </div>

                  <div className="file-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => handleSelectFile(file.id)}
                    />
                  </div>

                  <div className="file-preview">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} />
                    ) : (
                      <span className="file-icon">{getFileIcon(file)}</span>
                    )}
                  </div>

                  <div className="file-info">
                    <div className="file-label-row">
                      {editingLabelId === file.id ? (
                        <input
                          ref={labelInputRef}
                          type="text"
                          className="label-input"
                          value={file.label}
                          onChange={(e) => handleLabelChange(file.id, e.target.value)}
                          onBlur={handleFinishEditLabel}
                          onKeyDown={handleLabelKeyDown}
                        />
                      ) : (
                        <span
                          className="file-label"
                          onClick={() => handleStartEditLabel(file.id)}
                          title={t('testLab.label.clickToEdit', '클릭하여 라벨 수정')}
                        >
                          {file.label}
                          <span className="edit-icon">✏️</span>
                        </span>
                      )}
                    </div>
                    <p className="file-name" title={file.name}>{file.name}</p>
                    <p className="file-meta">
                      {formatFileSize(file.size)} • {file.type || 'Unknown'}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="upload-progress">
                        <div
                          className="upload-progress-bar"
                          style={{ width: `${file.uploadProgress}%` }}
                        />
                        <span className="upload-progress-text">{file.uploadProgress}%</span>
                      </div>
                    )}
                  </div>

                  <div className="file-status">
                    {file.status === 'pending' && (
                      <span className="status-badge status-pending">
                        {t('testLab.status.pending', '대기중')}
                      </span>
                    )}
                    {file.status === 'uploading' && (
                      <span className="status-badge status-uploading">
                        {t('testLab.status.uploading', '업로드중')}
                      </span>
                    )}
                    {file.status === 'completed' && (
                      <span className="status-badge status-completed">
                        {t('testLab.status.completed', '완료')}
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="status-badge status-error">
                        {t('testLab.status.error', '오류')}
                      </span>
                    )}
                  </div>

                  <div className="file-actions">
                    {file.status === 'pending' && (
                      <button
                        className="btn btn-icon"
                        onClick={() => handleUploadFile(file.id)}
                        title={t('testLab.actions.upload', '업로드')}
                      >
                        ⬆️
                      </button>
                    )}
                    <button
                      className="btn btn-icon btn-danger"
                      onClick={() => handleRemoveFile(file.id)}
                      title={t('testLab.actions.delete', '삭제')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 업로드 완료된 파일 결과 미리보기 */}
        {files.some((f) => f.status === 'completed' && f.preview) && (
          <div className="upload-results">
            <h3>{t('testLab.results.title', '업로드 완료된 이미지')}</h3>
            <div className="results-grid">
              {files
                .filter((f) => f.status === 'completed' && f.preview)
                .map((file) => (
                  <div key={file.id} className="result-item">
                    <div className="result-number">#{file.fileNumber}</div>
                    <img src={file.preview} alt={file.name} />
                    <p className="result-label">{file.label}</p>
                    <p className="result-name">{file.name}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestLab;
