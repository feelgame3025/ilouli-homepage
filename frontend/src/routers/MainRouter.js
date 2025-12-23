import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../features/main/LandingPage';
import About from '../features/main/About';
import Login from '../features/auth/Login';
import Profile from '../features/auth/Profile';
import ProtectedRoute from '../shared/ProtectedRoute';

const MainRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default MainRouter;
