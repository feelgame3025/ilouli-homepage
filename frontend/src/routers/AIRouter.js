import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import AIStoryboard from '../features/ai/AIStoryboard';
import AIContentTools from '../features/ai/AIContentTools';
import AIVideoCreator from '../features/ai/AIVideoCreator';
import AudioAnalysis from '../features/ai/AudioAnalysis';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import ProtectedRoute from '../shared/ProtectedRoute';
import SubMenu from '../shared/SubMenu';

const aiMenuItems = [
  { path: '/content-tools', label: '콘텐츠 도구', icon: '✍️' },
  { path: '/audio-analysis', label: '음성 분석', icon: '🎙️' },
  { path: '/storyboard', label: '스토리보드', icon: '📖' },
  { path: '/video-creator', label: '영상 제작', icon: '🎬' },
];

const AIRouter = () => {
  return (
    <>
      <SubMenu items={aiMenuItems} />
      <Routes>
        <Route path="/" element={<Navigate to="/content-tools" replace />} />
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
          path="/video-creator"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.SUBSCRIBER, USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
              <AIVideoCreator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audio-analysis"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.SUBSCRIBER, USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
              <AudioAnalysis />
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
    </>
  );
};

export default AIRouter;
