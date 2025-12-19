import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import AIStoryboard from '../components/AIStoryboard';
import AIContentTools from '../components/AIContentTools';
import Profile from '../components/Profile';
import Login from '../components/Login';
import ProtectedRoute from '../components/ProtectedRoute';

const AIRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/storyboard" replace />} />
      <Route
        path="/storyboard"
        element={
          <ProtectedRoute requiredTiers={[USER_TIERS.SUBSCRIBER, USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
            <AIStoryboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/content-tools"
        element={
          <ProtectedRoute requiredTiers={[USER_TIERS.SUBSCRIBER, USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
            <AIContentTools />
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
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default AIRouter;
