import React, { createContext, useContext, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants/storageKeys';

const AssetContext = createContext(null);

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      if (storedAssets) {
        setAssets(JSON.parse(storedAssets));
      }
    } catch (error) {
      console.error("Failed to load assets from localStorage", error);
      setAssets([]);
    }
    setLoading(false);
  }, []);

  const saveAssets = (newAssets) => {
    try {
      const assetsJson = JSON.stringify(newAssets);
      localStorage.setItem(STORAGE_KEYS.ASSETS, assetsJson);
      setAssets(newAssets);
    } catch (error) {
      console.error("Failed to save assets to localStorage", error);
    }
  };

  const addAsset = (asset) => {
    const newAssets = [asset, ...assets];
    saveAssets(newAssets);
    return asset;
  };

  const deleteAsset = (assetName) => {
    const newAssets = assets.filter(asset => asset.name !== assetName);
    saveAssets(newAssets);
  };

  const getAssets = () => {
    return assets;
  };

  const value = {
    assets,
    loading,
    addAsset,
    deleteAsset,
    getAssets,
  };

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};
