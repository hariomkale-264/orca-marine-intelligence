import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredSession, getCurrentUser, setStoredSession } from '../services/authService.ts';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const session = getStoredSession();

  // Verify session validity against server in the background
  useEffect(() => {
    if (session?.token) {
      getCurrentUser().then((res) => {
        if (res.error) {
          setStoredSession(null);
          window.location.href = '/login';
        }
      }).catch(() => {
        // network issue - don't interrupt active session if server is temporarily unreachable
      });
    }
  }, [session?.token]);

  if (!session) {
    // Redirect to login page while saving the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
