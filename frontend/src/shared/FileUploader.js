import React, { useState, useRef, useCallback } from 'react';
import { formatFileSize, validateImageFile, validateVideoFile, readFileAsDataURL } from '../utils/file';
import './FileUploader.css';

/**
 * FileUploader - 재사용 가능한 파일 업로드 컴포넌트
 *
 * @param {Object} props
 * @param {string} props.accept - 허용 파일 타입 (예: "image/*", ".pdf,.doc")
 * @param {boolean} props.multiple - 다중 선택 허용
 * @param {number} props.maxSize - 최대 파일 크기 (bytes, 기본: 10MB)
 * @param {number} props.maxFiles - 최대 파일 수 (기본: 10)
 * @param {function} props.onSelect - 파일 선택 콜백 function(files)
 * @param {function} props.onError - 에러 콜백 function(error)
 * @param {boolean} props.preview - 이미지 미리보기 표시 (기본: true)
 * @param {boolean} props.disabled - 비활성화
 * @param {boolean} props.dragDrop - 드래그앤드롭 지원 (기본: true)
 */
const FileUploader = ({
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  onSelect,
  onError,
  preview = true,
  disabled = false,
  dragDrop = true,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // 파일 타입에 따른 아이콘 반환
  const getFileIcon = (type, name) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.startsWith('video/')) return '🎥';
    if (type?.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    if (type?.includes('powerpoint') || type?.includes('presentation')) return '📽️';
    if (type === 'application/zip' || type === 'application/x-zip-compressed' || name?.endsWith('.zip')) return '📦';
    return '📁';
  };

  // 파일 타입 검증
  const validateFileType = (file) => {
    if (accept === '*') return { isValid: true, errors: [] };

    const acceptTypes = accept.split(',').map(t => t.trim());
    const errors = [];

    // MIME 타입 또는 확장자 검증
    const isValid = acceptTypes.some(acceptType => {
      if (acceptType.startsWith('.')) {
        // 확장자 검증
        return file.name.toLowerCase().endsWith(acceptType.toLowerCase());
      } else if (acceptType.includes('/*')) {
        // 와일드카드 MIME 타입 (예: image/*)
        const baseType = acceptType.split('/')[0];
        return file.type.startsWith(baseType + '/');
      } else {
        // 정확한 MIME 타입
        return file.type === acceptType;
      }
    });

    if (!isValid) {
      errors.push(`지원하지 않는 파일 형식입니다. (허용: ${accept})`);
    }

    return { isValid, errors };
  };

  // 파일 크기 검증
  const validateFileSize = (file) => {
    const errors = [];

    if (file.size > maxSize) {
      errors.push(`파일 크기가 너무 큽니다. (최대 ${formatFileSize(maxSize)})`);
    }

    return { isValid: errors.length === 0, errors };
  };

  // 파일 검증 (통합)
  const validateFile = (file) => {
    const typeValidation = validateFileType(file);
    const sizeValidation = validateFileSize(file);

    const errors = [...typeValidation.errors, ...sizeValidation.errors];
    return { isValid: errors.length === 0, errors };
  };

  // 파일 처리
  const processFiles = useCallback(async (files) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    const fileArray = Array.from(files);

    // 최대 파일 수 검증
    const totalFiles = selectedFiles.length + fileArray.length;
    if (totalFiles > maxFiles) {
      if (onError) {
        onError(`최대 ${maxFiles}개 파일까지 선택할 수 있습니다.`);
      }
      setIsProcessing(false);
      return;
    }

    const processedFiles = [];
    const validationErrors = [];

    for (const file of fileArray) {
      // 파일 검증
      const validation = validateFile(file);

      if (!validation.isValid) {
        validationErrors.push({
          fileName: file.name,
          errors: validation.errors,
        });
        continue;
      }

      // 파일 데이터 생성
      const fileData = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: null,
      };

      // 이미지 미리보기 생성
      if (preview && file.type.startsWith('image/')) {
        try {
          const dataUrl = await readFileAsDataURL(file);
          fileData.preview = dataUrl;
        } catch (error) {
          console.error('Preview generation failed:', error);
        }
      }

      processedFiles.push(fileData);
    }

    // 검증 에러 처리
    if (validationErrors.length > 0 && onError) {
      const errorMessage = validationErrors
        .map(err => `${err.fileName}: ${err.errors.join(', ')}`)
        .join('\n');
      onError(errorMessage);
    }

    // 파일 추가
    if (processedFiles.length > 0) {
      const newFiles = multiple
        ? [...selectedFiles, ...processedFiles]
        : processedFiles;

      setSelectedFiles(newFiles);

      // 콜백 호출
      if (onSelect) {
        onSelect(newFiles.map(f => f.file));
      }
    }

    setIsProcessing(false);
  }, [disabled, isProcessing, selectedFiles, maxFiles, multiple, preview, onSelect, onError]);

  // 드래그앤드롭 핸들러
  const handleDragOver = useCallback((e) => {
    if (!dragDrop || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [dragDrop, disabled]);

  const handleDragLeave = useCallback((e) => {
    if (!dragDrop || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, [dragDrop, disabled]);

  const handleDrop = useCallback((e) => {
    if (!dragDrop || disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [dragDrop, disabled, processFiles]);

  // 파일 선택 핸들러
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    e.target.value = '';
  };

  // 파일 삭제
  const handleRemoveFile = (fileId) => {
    const newFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(newFiles);

    if (onSelect) {
      onSelect(newFiles.map(f => f.file));
    }
  };

  // 모두 삭제
  const handleClearAll = () => {
    setSelectedFiles([]);
    if (onSelect) {
      onSelect([]);
    }
  };

  // 업로드 영역 클릭
  const handleUploadAreaClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`file-uploader ${disabled ? 'disabled' : ''}`}>
      {/* 업로드 영역 */}
      <div
        className={`upload-area ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          {isProcessing ? (
            <>
              <div className="upload-spinner"></div>
              <p className="upload-text">파일 처리 중...</p>
            </>
          ) : (
            <>
              <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="upload-text">
                {dragDrop ? '파일을 드래그하거나 클릭하여 선택하세요' : '클릭하여 파일을 선택하세요'}
              </p>
              <p className="upload-hint">
                {accept === '*' ? '모든 파일 형식' : accept}
                {' • '}
                최대 {formatFileSize(maxSize)}
                {multiple && ` • 최대 ${maxFiles}개`}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 선택된 파일 목록 */}
      {selectedFiles.length > 0 && (
        <div className="files-section">
          <div className="files-header">
            <span className="files-count">선택된 파일: {selectedFiles.length}개</span>
            <button
              className="clear-all-btn"
              onClick={handleClearAll}
              disabled={disabled}
            >
              모두 삭제
            </button>
          </div>

          <div className="files-list">
            {selectedFiles.map((fileData) => (
              <div key={fileData.id} className="file-item">
                {/* 미리보기 또는 아이콘 */}
                <div className="file-preview">
                  {fileData.preview ? (
                    <img src={fileData.preview} alt={fileData.name} />
                  ) : (
                    <span className="file-icon">{getFileIcon(fileData.type, fileData.name)}</span>
                  )}
                </div>

                {/* 파일 정보 */}
                <div className="file-info">
                  <h4 className="file-name">{fileData.name}</h4>
                  <p className="file-meta">
                    {formatFileSize(fileData.size)}
                    {fileData.type && (
                      <>
                        <span className="separator">•</span>
                        <span>{fileData.type.split('/')[1]?.toUpperCase()}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* 삭제 버튼 */}
                <button
                  className="remove-file-btn"
                  onClick={() => handleRemoveFile(fileData.id)}
                  disabled={disabled}
                  aria-label={`${fileData.name} 삭제`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
