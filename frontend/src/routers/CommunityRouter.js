import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Community from '../features/community/Community';
import Games from '../features/lab/Games';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import ProtectedRoute from '../shared/ProtectedRoute';

const CommunityRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/announcements" replace />} />
      <Route path="/announcements" element={<Community defaultTab="announcements" />} />
      <Route path="/free-board" element={<Community defaultTab="community" />} />
      <Route path="/games" element={<Games />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default CommunityRouter;
