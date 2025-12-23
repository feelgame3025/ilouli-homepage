import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssets } from '../../contexts/AssetContext';
import './AssetLibrary.css';

const AssetLibrary = () => {
  const { t } = useTranslation();
  const { assets, addAsset, deleteAsset } = useAssets();
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const processFiles = (files) => {
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const newAsset = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result, // This is a DataURL
          createdAt: new Date().toISOString(),
        };
        addAsset(newAsset);
      };
      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDelete = (assetName) => {
    if (window.confirm(t('assetLibrary.confirmDelete', { name: assetName }))) {
      deleteAsset(assetName);
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="asset-library-container">
      <h2>{t('assetLibrary.title')}</h2>

      <div className="upload-area" onClick={handleUploadAreaClick}>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <div className="upload-icon">📤</div>
        <p>{t('assetLibrary.dropzone')}</p>
      </div>

      <div className="asset-grid">
        {assets.map(asset => (
          <div key={asset.name} className="asset-card">
            <div className="asset-preview">
              {asset.type.startsWith('image/') ? (
                <img src={asset.content} alt={asset.name} />
              ) : (
                <div className="file-icon">📄</div>
              )}
            </div>
            <div className="asset-info">
              <p title={asset.name}>{asset.name}</p>
              <p className="asset-size">{formatBytes(asset.size)}</p>
            </div>
            <button
              className="delete-asset-btn"
              onClick={() => handleDelete(asset.name)}
              title={t('assetLibrary.delete')}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetLibrary;
