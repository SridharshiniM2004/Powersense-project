import React from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types';

interface AdminRouteProps {
  user: User | null;
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};
