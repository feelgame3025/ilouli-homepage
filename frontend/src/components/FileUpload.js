import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './FileUpload.css';

const FileUpload = () => {
  const { t } = useTranslation();
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileCounter, setFileCounter] = useState(1);
  const fileInputRef = useRef(null);

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
    }).format(date);
  };

  const processAndUploadFiles = useCallback(async (files) => {
    setIsUploading(true);
    const fileArray = Array.from(files);
    let currentNumber = fileCounter;

    for (const file of fileArray) {
      const fileNumber = currentNumber++;
      const fileData = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileNumber: fileNumber,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        preview: null,
        status: 'uploading',
        analysisResult: null,
      };

      setFileCounter(currentNumber);

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

      // Simulate upload and AI analysis
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update status to analyzing
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'analyzing' } : f
        )
      );

      // Simulate AI analysis
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Generate mock analysis result
      const analysisResult = generateMockAnalysis(file);

      // Update with completed analysis
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id
            ? { ...f, status: 'completed', analysisResult }
            : f
        )
      );
    }

    setIsUploading(false);
  }, [fileCounter]);

  const generateMockAnalysis = (file) => {
    if (file.type.startsWith('image/')) {
      return {
        type: 'image',
        description: `이미지 파일 "${file.name}"이 업로드되었습니다.`,
        details: [
          `파일 크기: ${formatFileSize(file.size)}`,
          `파일 형식: ${file.type}`,
          '분석: 이미지가 성공적으로 업로드되었습니다. AI 분석을 위해 준비되었습니다.',
        ],
      };
    } else if (file.type === 'application/pdf') {
      return {
        type: 'document',
        description: `PDF 문서 "${file.name}"이 업로드되었습니다.`,
        details: [
          `파일 크기: ${formatFileSize(file.size)}`,
          '분석: PDF 문서가 성공적으로 업로드되었습니다.',
        ],
      };
    } else {
      return {
        type: 'file',
        description: `파일 "${file.name}"이 업로드되었습니다.`,
        details: [
          `파일 크기: ${formatFileSize(file.size)}`,
          `파일 형식: ${file.type || '알 수 없음'}`,
        ],
      };
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

      <div className="file-upload-content">
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

        {/* Uploaded Files & Analysis */}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files-section">
            <div className="section-header">
              <h2>{t('fileUpload.analysis.title')}</h2>
              <button className="clear-all-btn" onClick={handleClearAll}>
                전체 삭제
              </button>
            </div>

            <div className="files-list">
              {uploadedFiles.map((file) => (
                <div key={file.id} className={`file-card ${file.status}`}>
                  <div className="file-card-header">
                    <div className="file-number-badge">#{file.fileNumber}</div>
                    <div className="file-preview-small">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} />
                      ) : (
                        <span className="file-icon">{getFileIcon(file.type)}</span>
                      )}
                    </div>
                    <div className="file-info">
                      <h3 className="file-name">#{file.fileNumber} {file.name}</h3>
                      <div className="file-meta">
                        <span>{formatFileSize(file.size)}</span>
                        <span className="separator">•</span>
                        <span>{formatTime(file.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="file-status-badge">
                      {file.status === 'uploading' && (
                        <span className="status-uploading">업로드 중</span>
                      )}
                      {file.status === 'analyzing' && (
                        <span className="status-analyzing">분석 중</span>
                      )}
                      {file.status === 'completed' && (
                        <span className="status-completed">완료</span>
                      )}
                    </div>
                    <button
                      className="remove-file-btn"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      ×
                    </button>
                  </div>

                  {file.status === 'completed' && file.analysisResult && (
                    <div className="analysis-result">
                      <p className="analysis-description">
                        {file.analysisResult.description}
                      </p>
                      <ul className="analysis-details">
                        {file.analysisResult.details.map((detail, idx) => (
                          <li key={idx}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {file.status === 'analyzing' && (
                    <div className="analyzing-indicator">
                      <div className="analyzing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span>{t('fileUpload.analysis.analyzing')}</span>
                    </div>
                  )}

                  {file.preview && file.status === 'completed' && (
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
      </div>
    </div>
  );
};

export default FileUpload;
