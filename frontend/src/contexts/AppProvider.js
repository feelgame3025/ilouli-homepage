import React from 'react';
import { AuthProvider } from './AuthContext';
import { CommunityProvider } from './CommunityContext';
import { AssetProvider } from './AssetContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <CommunityProvider>
        <AssetProvider>
          {children}
        </AssetProvider>
      </CommunityProvider>
    </AuthProvider>
  );
};

export default AppProvider;
