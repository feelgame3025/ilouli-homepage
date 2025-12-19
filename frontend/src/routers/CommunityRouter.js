import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Community from '../components/Community';
import Profile from '../components/Profile';
import Login from '../components/Login';
import Signup from '../components/Signup';
import ProtectedRoute from '../components/ProtectedRoute';

const CommunityRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/announcements" replace />} />
      <Route path="/announcements" element={<Community defaultTab="announcements" />} />
      <Route path="/free-board" element={<Community defaultTab="community" />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  );
};

export default CommunityRouter;
