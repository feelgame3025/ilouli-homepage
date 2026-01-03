import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { USER_TIERS } from '../contexts/AuthContext';
import FamilySpace from '../features/family/FamilySpace';
import FamilyCalendar from '../features/family/FamilyCalendar';
import Profile from '../features/auth/Profile';
import Login from '../features/auth/Login';
import ProtectedRoute from '../shared/ProtectedRoute';
import SubMenu from '../shared/SubMenu';

const menuItems = [
  { path: '/', label: '가족 공간', icon: '🏠' },
  { path: '/calendar', label: '캘린더', icon: '📅' },
];

const FamilyRouter = () => {
  return (
    <>
      <SubMenu items={menuItems} />
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
          path="/calendar"
          element={
            <ProtectedRoute requiredTiers={[USER_TIERS.FAMILY, USER_TIERS.ADMIN]}>
              <FamilyCalendar />
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

export default FamilyRouter;
