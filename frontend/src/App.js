import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppProvider from './contexts/AppProvider';
import NavigationBar from './components/NavigationBar';
import { getCurrentHost, HOSTS, HOST_INFO } from './utils/hostConfig';

// Routers
import MainRouter from './routers/MainRouter';
import AIRouter from './routers/AIRouter';
import CommunityRouter from './routers/CommunityRouter';
import FamilyRouter from './routers/FamilyRouter';
import AdminRouter from './routers/AdminRouter';
import LabRouter from './routers/LabRouter';

import './App.css';

function App() {
  const currentHost = getCurrentHost();

  // 호스트에 따른 페이지 타이틀 설정
  useEffect(() => {
    const hostInfo = HOST_INFO[currentHost];
    if (hostInfo) {
      document.title = hostInfo.title;
    }
  }, [currentHost]);

  // 호스트에 따른 라우터 선택
  const renderRouter = () => {
    switch (currentHost) {
      case HOSTS.AI:
        return <AIRouter />;
      case HOSTS.COMMUNITY:
        return <CommunityRouter />;
      case HOSTS.FAMILY:
        return <FamilyRouter />;
      case HOSTS.ADMIN:
        return <AdminRouter />;
      case HOSTS.LAB:
        return <LabRouter />;
      case HOSTS.MAIN:
      default:
        return <MainRouter />;
    }
  };

  return (
    <Router>
      <AppProvider>
        <div className="App" data-host={currentHost}>
          <NavigationBar />
          <main className="main-content">
            {renderRouter()}
          </main>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
