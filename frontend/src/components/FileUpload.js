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
  const [selectedUploaded, setSelectedUploaded] = useState(new Set());
  const [selectedServer, setSelectedServer] = useState(new Set());
  const [currentFolder, setCurrentFolder] = useState('');
  const [viewMode, setViewMode] = useState('folder'); // 'grid' | 'folder'
  const [expandedFolders, setExpandedFolders] = useState(new Set(['기본']));
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // 서버 파일 목록 로드
  const loadServerFiles = useCallback(async () => {
    try {
      const response = await api.get('/api/files/list');
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

  const getFileIcon = (type, name) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
    if (type === 'application/zip' || type === 'application/x-zip-compressed' ||
        name?.endsWith('.zip')) return '📦';
    if (type === 'application/x-rar-compressed' || name?.endsWith('.rar')) return '📦';
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
      // 폴더 경로 추출 (webkitRelativePath가 있는 경우)
      const folderPath = file.webkitRelativePath
        ? file.webkitRelativePath.split('/').slice(0, -1).join('/')
        : currentFolder;

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
        folder: folderPath,
        selected: false,
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
  }, [currentFolder]);

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
      if (fileData.folder) {
        formData.append('folder', fileData.folder);
      }

      const response = await api.post('/api/files/upload', formData, {
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
    try {
      await api.delete(`/api/files/${fileId}`);
      setServerFiles((prev) => prev.filter((f) => f.id !== fileId));
      setSelectedServer((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
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

    const items = e.dataTransfer.items;
    const files = [];

    // 폴더 드래그 처리
    if (items) {
      const processEntry = async (entry, path = '') => {
        if (entry.isFile) {
          return new Promise((resolve) => {
            entry.file((file) => {
              // webkitRelativePath를 수동으로 설정
              Object.defineProperty(file, 'webkitRelativePath', {
                value: path + file.name,
                writable: false
              });
              files.push(file);
              resolve();
            });
          });
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          return new Promise((resolve) => {
            reader.readEntries(async (entries) => {
              for (const e of entries) {
                await processEntry(e, path + entry.name + '/');
              }
              resolve();
            });
          });
        }
      };

      const processItems = async () => {
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) {
            await processEntry(entry);
          }
        }
        if (files.length > 0) {
          processAndUploadFiles(files);
        }
      };

      processItems();
    } else {
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        processAndUploadFiles(droppedFiles);
      }
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

  const handleFolderButtonClick = (e) => {
    e.stopPropagation();
    folderInputRef.current?.click();
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedUploaded((prev) => {
      const newSet = new Set(prev);
      newSet.delete(fileId);
      return newSet;
    });
  };

  const handleClearAll = () => {
    if (uploadedFiles.length > 0 && window.confirm('모든 업로드 파일을 삭제하시겠습니까?')) {
      setUploadedFiles([]);
      setSelectedUploaded(new Set());
    }
  };

  // 전체 서버 저장
  const handleSaveAllToServer = async () => {
    const filesToSave = uploadedFiles.filter(
      f => f.status === 'completed' && !f.serverSaved && f.file
    );

    if (filesToSave.length === 0) {
      alert('저장할 파일이 없습니다.');
      return;
    }

    for (const fileData of filesToSave) {
      await handleSaveToServer(fileData);
    }
  };

  // 선택 토글 (업로드)
  const toggleUploadedSelection = (fileId) => {
    setSelectedUploaded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 선택 토글 (서버)
  const toggleServerSelection = (fileId) => {
    setSelectedServer((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // 전체 선택 (업로드)
  const selectAllUploaded = () => {
    if (selectedUploaded.size === uploadedFiles.length) {
      setSelectedUploaded(new Set());
    } else {
      setSelectedUploaded(new Set(uploadedFiles.map(f => f.id)));
    }
  };

  // 전체 선택 (서버)
  const selectAllServer = () => {
    if (selectedServer.size === serverFiles.length) {
      setSelectedServer(new Set());
    } else {
      setSelectedServer(new Set(serverFiles.map(f => f.id)));
    }
  };

  // 선택 삭제 (업로드)
  const deleteSelectedUploaded = () => {
    if (selectedUploaded.size === 0) return;
    if (window.confirm(`선택한 ${selectedUploaded.size}개 파일을 삭제하시겠습니까?`)) {
      setUploadedFiles((prev) => prev.filter(f => !selectedUploaded.has(f.id)));
      setSelectedUploaded(new Set());
    }
  };

  // 선택 삭제 (서버)
  const deleteSelectedServer = async () => {
    if (selectedServer.size === 0) return;
    if (window.confirm(`선택한 ${selectedServer.size}개 파일을 서버에서 삭제하시겠습니까?`)) {
      for (const fileId of selectedServer) {
        await handleDeleteFromServer(fileId);
      }
    }
  };

  // 전체 삭제 (서버)
  const deleteAllServer = async () => {
    if (serverFiles.length === 0) return;
    if (window.confirm(`서버의 모든 파일(${serverFiles.length}개)을 삭제하시겠습니까?`)) {
      for (const file of serverFiles) {
        await handleDeleteFromServer(file.id);
      }
    }
  };

  // 선택 저장 (서버로)
  const saveSelectedToServer = async () => {
    const filesToSave = uploadedFiles.filter(
      f => selectedUploaded.has(f.id) && f.status === 'completed' && !f.serverSaved && f.file
    );

    if (filesToSave.length === 0) {
      alert('저장할 파일이 없습니다.');
      return;
    }

    for (const fileData of filesToSave) {
      await handleSaveToServer(fileData);
    }
    setSelectedUploaded(new Set());
  };

  // 저장 가능한 파일 수
  const pendingFilesCount = uploadedFiles.filter(
    f => f.status === 'completed' && !f.serverSaved
  ).length;

  // 폴더별 그룹화
  const groupedServerFiles = serverFiles.reduce((acc, file) => {
    const folder = file.folder || '기본';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(file);
    return acc;
  }, {});

  const folders = Object.keys(groupedServerFiles).sort((a, b) => {
    if (a === '기본') return -1;
    if (b === '기본') return 1;
    return a.localeCompare(b);
  });

  // 폴더 토글
  const toggleFolder = (folder) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folder)) {
        newSet.delete(folder);
      } else {
        newSet.add(folder);
      }
      return newSet;
    });
  };

  // 폴더 전체 펼치기/접기
  const toggleAllFolders = () => {
    if (expandedFolders.size === folders.length) {
      setExpandedFolders(new Set());
    } else {
      setExpandedFolders(new Set(folders));
    }
  };

  // 폴더 내 파일 전체 선택
  const selectFolderFiles = (folder) => {
    const folderFiles = groupedServerFiles[folder] || [];
    const folderFileIds = folderFiles.map(f => f.id);
    const allSelected = folderFileIds.every(id => selectedServer.has(id));

    setSelectedServer((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        folderFileIds.forEach(id => newSet.delete(id));
      } else {
        folderFileIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
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
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="file-input-hidden"
                webkitdirectory=""
                directory=""
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
                    <p className="dropzone-text">파일 또는 폴더를 드래그하세요</p>
                    <p className="dropzone-hint">이미지, 문서, ZIP 압축파일 지원</p>
                    <div className="dropzone-buttons">
                      <button className="dropzone-btn file-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        📄 파일 선택
                      </button>
                      <button className="dropzone-btn folder-btn" onClick={handleFolderButtonClick}>
                        📁 폴더 선택
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 폴더 경로 입력 (선택적) */}
            <div className="folder-path-input">
              <label>📁 저장 폴더:</label>
              <input
                type="text"
                value={currentFolder}
                onChange={(e) => setCurrentFolder(e.target.value)}
                placeholder="폴더명 입력 (예: 화투/1월)"
              />
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-section">
                <div className="section-header">
                  <div className="header-left">
                    <label className="select-all-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedUploaded.size === uploadedFiles.length && uploadedFiles.length > 0}
                        onChange={selectAllUploaded}
                      />
                      <span>전체 선택</span>
                    </label>
                    <h2>업로드된 파일 ({uploadedFiles.length})</h2>
                  </div>
                  <div className="header-buttons">
                    {selectedUploaded.size > 0 && (
                      <>
                        <button className="save-selected-btn" onClick={saveSelectedToServer}>
                          💾 선택 저장 ({selectedUploaded.size})
                        </button>
                        <button className="delete-selected-btn" onClick={deleteSelectedUploaded}>
                          🗑️ 선택 삭제
                        </button>
                      </>
                    )}
                    {pendingFilesCount > 0 && (
                      <button className="save-all-btn" onClick={handleSaveAllToServer}>
                        💾 전체 저장 ({pendingFilesCount})
                      </button>
                    )}
                    <button className="clear-all-btn" onClick={handleClearAll}>
                      전체 삭제
                    </button>
                  </div>
                </div>

                <div className="files-list">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className={`file-card ${file.status} ${selectedUploaded.has(file.id) ? 'selected' : ''}`}>
                      <div className="file-card-header">
                        <label className="file-checkbox" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedUploaded.has(file.id)}
                            onChange={() => toggleUploadedSelection(file.id)}
                          />
                        </label>
                        <div className="file-preview-small">
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} />
                          ) : (
                            <span className="file-icon">{getFileIcon(file.type, file.name)}</span>
                          )}
                        </div>
                        <div className="file-info">
                          <h3 className="file-name">{file.name}</h3>
                          <div className="file-meta">
                            <span>{formatFileSize(file.size)}</span>
                            <span className="separator">•</span>
                            <span>{formatTime(file.uploadedAt)}</span>
                            {file.folder && (
                              <>
                                <span className="separator">•</span>
                                <span className="folder-badge">📁 {file.folder}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="file-actions">
                          {file.status === 'completed' && !file.serverSaved && (
                            <button
                              className="save-server-btn"
                              onClick={() => handleSaveToServer(file)}
                            >
                              💾 저장
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
            {/* 서버 파일 헤더 */}
            <div className="server-files-header">
              <div className="header-left">
                <label className="select-all-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedServer.size === serverFiles.length && serverFiles.length > 0}
                    onChange={selectAllServer}
                  />
                  <span>전체 선택</span>
                </label>
                <span className="file-count">{serverFiles.length}개 파일 • {folders.length}개 폴더</span>
              </div>
              <div className="header-buttons">
                <div className="view-mode-toggle">
                  <button
                    className={`view-btn-toggle ${viewMode === 'folder' ? 'active' : ''}`}
                    onClick={() => setViewMode('folder')}
                    title="폴더 보기"
                  >
                    📁
                  </button>
                  <button
                    className={`view-btn-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="그리드 보기"
                  >
                    ⊞
                  </button>
                </div>
                {viewMode === 'folder' && folders.length > 1 && (
                  <button className="toggle-folders-btn" onClick={toggleAllFolders}>
                    {expandedFolders.size === folders.length ? '📁 모두 접기' : '📂 모두 펼치기'}
                  </button>
                )}
                {selectedServer.size > 0 && (
                  <button className="delete-selected-btn" onClick={deleteSelectedServer}>
                    🗑️ 선택 삭제 ({selectedServer.size})
                  </button>
                )}
                {serverFiles.length > 0 && (
                  <button className="delete-all-btn" onClick={deleteAllServer}>
                    🗑️ 전체 삭제
                  </button>
                )}
                <button className="refresh-btn" onClick={loadServerFiles}>
                  🔄
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="loading-state">
                <div className="upload-spinner"></div>
                <p>파일 목록 로딩 중...</p>
              </div>
            ) : serverFiles.length === 0 ? (
              <div className="empty-state">
                <p>서버에 저장된 파일이 없습니다.</p>
              </div>
            ) : viewMode === 'folder' ? (
              /* 폴더 뷰 */
              <div className="server-folders-view">
                {folders.map((folder) => {
                  const folderFiles = groupedServerFiles[folder];
                  const isExpanded = expandedFolders.has(folder);
                  const folderFileIds = folderFiles.map(f => f.id);
                  const allSelected = folderFileIds.length > 0 && folderFileIds.every(id => selectedServer.has(id));
                  const someSelected = folderFileIds.some(id => selectedServer.has(id));

                  return (
                    <div key={folder} className={`folder-group ${isExpanded ? 'expanded' : ''}`}>
                      <div className="folder-header" onClick={() => toggleFolder(folder)}>
                        <div className="folder-header-left">
                          <span className="folder-expand-icon">{isExpanded ? '▼' : '▶'}</span>
                          <span className="folder-icon">{isExpanded ? '📂' : '📁'}</span>
                          <span className="folder-name">{folder}</span>
                          <span className="folder-file-count">{folderFiles.length}개 파일</span>
                        </div>
                        <div className="folder-header-right" onClick={(e) => e.stopPropagation()}>
                          <label className="folder-checkbox">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={() => selectFolderFiles(folder)}
                            />
                          </label>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="folder-files-grid">
                          {folderFiles.map((file, index) => (
                            <div
                              key={file.id}
                              className={`server-file-card compact ${selectedServer.has(file.id) ? 'selected' : ''}`}
                            >
                              <label className="server-file-checkbox" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedServer.has(file.id)}
                                  onChange={() => toggleServerSelection(file.id)}
                                />
                              </label>
                              <div className="server-file-preview">
                                {file.mimeType?.startsWith('image/') ? (
                                  <img
                                    src={`https://api.ilouli.com${file.url}`}
                                    alt={file.originalName}
                                  />
                                ) : (
                                  <span className="file-icon-large">{getFileIcon(file.mimeType, file.originalName)}</span>
                                )}
                              </div>
                              <div className="server-file-info">
                                <h3>{file.originalName}</h3>
                                <p className="file-meta">
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <div className="server-file-actions">
                                <a
                                  href={`https://api.ilouli.com${file.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="view-btn"
                                >
                                  👁️
                                </a>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteFromServer(file.id)}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 그리드 뷰 */
              <div className="server-files-grid">
                {serverFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className={`server-file-card ${selectedServer.has(file.id) ? 'selected' : ''}`}
                  >
                    <label className="server-file-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedServer.has(file.id)}
                        onChange={() => toggleServerSelection(file.id)}
                      />
                    </label>
                    <div className="server-file-number">#{index + 1}</div>
                    <div className="server-file-preview">
                      {file.mimeType?.startsWith('image/') ? (
                        <img
                          src={`https://api.ilouli.com${file.url}`}
                          alt={file.originalName}
                        />
                      ) : (
                        <span className="file-icon-large">{getFileIcon(file.mimeType, file.originalName)}</span>
                      )}
                    </div>
                    <div className="server-file-info">
                      <h3>{file.originalName}</h3>
                      <p className="file-meta">
                        {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                      </p>
                      {file.folder && (
                        <p className="folder-badge">📁 {file.folder}</p>
                      )}
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
