import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!currentUser) {
    const search = location.search; // e.g. "?table=5"
    const redirectPath = `/login${search ? search + '&' : '?'}mode=login`;
    return <Navigate to={redirectPath} replace />;
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