import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import TestZone from '../features/lab/TestZone';
import FileUpload from '../features/lab/FileUpload';
import Games from '../features/lab/Games';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import ProtectedRoute from '../shared/ProtectedRoute';
import SubMenu from '../shared/SubMenu';

const labMenuItems = [
  { path: '/test-zone', label: '테스트 존', icon: '🧪' },
  { path: '/file-upload', label: '파일 업로드', icon: '📁' },
  { path: '/games', label: '게임', icon: '🎮' },
];

const LabRouter = () => {
  return (
    <>
      <SubMenu items={labMenuItems} />
      <Routes>
        <Route path="/" element={<Navigate to="/test-zone" replace />} />
        <Route
          path="/test-zone"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN, USER_TIERS.FAMILY]}>
              <TestZone />
            </ProtectedRoute>
          }
        />
        <Route
          path="/file-upload"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN, USER_TIERS.FAMILY]}>
              <FileUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN, USER_TIERS.FAMILY]}>
              <Games />
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

export default LabRouter;
