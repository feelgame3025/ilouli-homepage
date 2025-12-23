import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import Admin from '../features/admin/Admin';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import Signup from '../features/auth/Signup';
import ProtectedRoute from '../shared/ProtectedRoute';

const AdminRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN]}>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <ProtectedRoute requiredTiers={[USER_TIERS.ADMIN]}>
            <Signup />
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

export default AdminRouter;
