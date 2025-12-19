import React from 'react';
import { AuthProvider } from './AuthContext';
import { CommunityProvider } from './CommunityContext';
import { AssetProvider } from './AssetContext';
import { NotificationProvider } from './NotificationContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CommunityProvider>
          <AssetProvider>
            {children}
          </AssetProvider>
        </CommunityProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProvider;
