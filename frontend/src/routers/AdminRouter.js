import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import Admin from '../components/Admin';
import Profile from '../components/Profile';
import Login from '../components/Login';
import Signup from '../components/Signup';
import ProtectedRoute from '../components/ProtectedRoute';

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
