import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './FileUpload.css';

const FileUpload = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [serverFiles, setServerFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'server'
  const fileInputRef = useRef(null);

  // 서버 파일 목록 로드
  const loadServerFiles = useCallback(async () => {
    try {
      const response = await api.get('/files/list');
      setServerFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to load server files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServerFiles();
  }, [loadServerFiles]);

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(date));
  };

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const processAndUploadFiles = useCallback(async (files) => {
    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileData = {
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        preview: null,
        status: 'uploading',
        file: file,
        serverSaved: false,
      };

      // Add file to list immediately with uploading status
      setUploadedFiles((prev) => [fileData, ...prev]);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id ? { ...f, preview: e.target.result } : f
            )
          );
        };
        reader.readAsDataURL(file);
      }

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update status to completed
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'completed' } : f
        )
      );
    }

    setIsUploading(false);
  }, []);

  // 서버에 저장
  const handleSaveToServer = async (fileData) => {
    try {
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'saving' } : f
        )
      );

      const formData = new FormData();
      formData.append('file', fileData.file);

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'saved', serverSaved: true, serverId: response.data.file.id }
              : f
          )
        );
        // 서버 파일 목록 새로고침
        loadServerFiles();
      }
    } catch (error) {
      console.error('Save to server failed:', error);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'error' } : f
        )
      );
    }
  };

  // 서버에서 삭제
  const handleDeleteFromServer = async (fileId) => {
    if (!window.confirm('서버에서 파일을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/files/${fileId}`);
      setServerFiles((prev) => prev.filter((f) => f.id !== fileId));
    } catch (error) {
      console.error('Delete from server failed:', error);
      alert('파일 삭제 실패');
    }
  };

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

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processAndUploadFiles(files);
    }
  }, [processAndUploadFiles]);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processAndUploadFiles(files);
    }
    e.target.value = '';
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
  };

  return (
    <div className="file-upload-container">
      <header className="file-upload-header">
        <h1>{t('fileUpload.title')}</h1>
        <p>{t('fileUpload.subtitle')}</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="file-tabs">
        <button
          className={`file-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          📤 파일 업로드
        </button>
        <button
          className={`file-tab ${activeTab === 'server' ? 'active' : ''}`}
          onClick={() => setActiveTab('server')}
        >
          🗂️ 서버 파일 ({serverFiles.length})
        </button>
      </div>

      <div className="file-upload-content">
        {activeTab === 'upload' && (
          <>
            {/* Drop Zone */}
            <div
              className={`upload-dropzone ${isDragOver ? 'dropzone-active' : ''} ${isUploading ? 'uploading' : ''}`}
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
                {isUploading ? (
                  <>
                    <div className="upload-spinner"></div>
                    <p className="dropzone-text">{t('fileUpload.dropzone.uploading')}</p>
                  </>
                ) : (
                  <>
                    <div className="dropzone-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p className="dropzone-text">{t('fileUpload.dropzone.text')}</p>
                    <p className="dropzone-hint">{t('fileUpload.dropzone.hint')}</p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-section">
                <div className="section-header">
                  <h2>업로드된 파일</h2>
                  <button className="clear-all-btn" onClick={handleClearAll}>
                    전체 삭제
                  </button>
                </div>

                <div className="files-list">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className={`file-card ${file.status}`}>
                      <div className="file-card-header">
                        <div className="file-preview-small">
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} />
                          ) : (
                            <span className="file-icon">{getFileIcon(file.type)}</span>
                          )}
                        </div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <div className="file-meta">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="separator">•</span>
                            <span>{formatTime(file.uploadedAt)}</span>
                          </div>
                        </div>
                        <div className="file-actions">
                          {file.status === 'completed' && !file.serverSaved && (
                            <button
                              className="save-server-btn"
                              onClick={() => handleSaveToServer(file)}
                            >
                              💾 서버 저장
                            </button>
                          )}
                          {file.status === 'saving' && (
                            <span className="status-saving">저장 중...</span>
                          )}
                          {file.status === 'saved' && (
                            <span className="status-saved">✅ 저장됨</span>
                          )}
                          {file.status === 'error' && (
                            <span className="status-error">❌ 오류</span>
                          )}
                          <button
                            className="remove-file-btn"
                            onClick={() => handleRemoveFile(file.id)}
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {file.preview && file.status !== 'uploading' && (
                        <div className="file-preview-large">
                          <img src={file.preview} alt={file.name} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedFiles.length === 0 && (
              <div className="empty-state">
                <p>{t('fileUpload.analysis.waiting')}</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'server' && (
          <div className="server-files-section">
            {isLoading ? (
              <div className="loading-state">
                <div className="upload-spinner"></div>
                <p>파일 목록 로딩 중...</p>
              </div>
            ) : serverFiles.length === 0 ? (
              <div className="empty-state">
                <p>서버에 저장된 파일이 없습니다.</p>
              </div>
            ) : (
              <div className="server-files-grid">
                {serverFiles.map((file) => (
                  <div key={file.id} className="server-file-card">
                    <div className="server-file-preview">
                      {file.mimeType?.startsWith('image/') ? (
                        <img
                          src={`https://api.ilouli.com${file.url}`}
                          alt={file.originalName}
                        />
                      ) : (
                        <span className="file-icon-large">{getFileIcon(file.mimeType)}</span>
                      )}
                    </div>
                    <div className="server-file-info">
                      <h3>{file.originalName}</h3>
                      <p className="file-meta">
                        {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                    <div className="server-file-actions">
                      <a
                        href={`https://api.ilouli.com${file.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-btn"
                      >
                        👁️ 보기
                      </a>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteFromServer(file.id)}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
