import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { USER_TIERS } from './contexts/AuthContext';
import AppProvider from './contexts/AppProvider';
import NavigationBar from './components/NavigationBar';
import LandingPage from './components/LandingPage';
import AIStoryboard from './components/AIStoryboard';
import FamilySpace from './components/FamilySpace';
import Profile from './components/Profile';
import Login from './components/Login';
import Signup from './components/Signup';
import Admin from './components/Admin';
import TestZone from './components/TestZone';
import FileUpload from './components/FileUpload';
import Community from './components/Community';
import About from './components/About';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AppProvider>
        <div className="App">
          <NavigationBar />
          <main className="main-content">
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/storyboard"
              element={
                <ProtectedRoute requiredTiers={[USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
                  <AIStoryboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/family"
              element={
                <ProtectedRoute requiredTiers={[USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
                  <FamilySpace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            {/* Admin Lab Routes */}
            <Route
              path="/admin-lab/test-zone"
              element={
                <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN, USER_TIERS.FAMILY]}>
                  <TestZone />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-lab/file-upload"
              element={
                <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN, USER_TIERS.FAMILY]}>
                  <FileUpload />
                </ProtectedRoute>
              }
            />
            {/* Community Routes */}
            <Route path="/community" element={<Community />} />
            <Route path="/community/announcements" element={<Community defaultTab="announcements" />} />
            <Route path="/community/free-board" element={<Community defaultTab="community" />} />
            <Route path="/about" element={<About />} />
          </Routes>
          </main>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
