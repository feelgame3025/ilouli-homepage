import React from 'react';
import { AuthProvider } from './AuthContext';
import { CommunityProvider } from './CommunityContext';
import { AssetProvider } from './AssetContext';
import { NotificationProvider } from './NotificationContext';
import { CalendarProvider } from './CalendarContext';

const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CommunityProvider>
          <AssetProvider>
            <CalendarProvider>
              {children}
            </CalendarProvider>
          </AssetProvider>
        </CommunityProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default AppProvider;
