import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import TestZone from '../components/TestZone';
import FileUpload from '../components/FileUpload';
import Profile from '../components/Profile';
import Login from '../components/Login';
import ProtectedRoute from '../components/ProtectedRoute';

const LabRouter = () => {
  return (
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

export default LabRouter;
