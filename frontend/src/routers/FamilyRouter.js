import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import FamilySpace from '../features/family/FamilySpace';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import ProtectedRoute from '../shared/ProtectedRoute';

const FamilyRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
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
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default FamilyRouter;
