import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login?mode=login" replace />;
  }

  // If a specific role is required, check if user has that role
  // 'customer' and 'admin' are treated as privileged roles
  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'customer' && currentUser.role !== 'admin') {
    // Redirect based on user role
    if (currentUser.role === 'user') {
      return <Navigate to="/customer.html" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;