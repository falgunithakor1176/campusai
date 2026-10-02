/**
 * ProtectedRoute Component
 *
 * Route guard component that redirects unauthenticated users to the login page.
 * Optionally checks if the user has one of the required roles.
 *
 * @module routes/ProtectedRoute
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Spinner from '../components/ui/Spinner';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - Roles permitted to view this route
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  // Show full-page loader while checking authentication state
  if (isLoading) {
    return <Spinner fullPage label="Authenticating..." />;
  }

  // Redirect to login page if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is authorized if allowedRoles list is specified
  if (allowedRoles) {
    const userRole = user?.role?.toUpperCase();
    const allowedUpper = allowedRoles.map(r => r.toUpperCase());
    if (!allowedUpper.includes(userRole)) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
