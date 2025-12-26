import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * SINGLE GLOBAL AUTH GUARD
 * Used by ALL protected routes (platform + competition)
 * 
 * Logic:
 * 1. Auth not initialized → show loading
 * 2. Not authenticated → /signin
 * 3. Authenticated + profile incomplete → /complete-profile
 * 4. Authenticated + profile complete → allow access
 * 
 * MOBILE FIX: Must wait for authInitialized before any redirect
 */
function ProtectedRoute({ children, adminOnly = false, skipProfileCheck = false }) {
  const { user, loading, authInitialized } = useAuth();
  const location = useLocation();

  // MOBILE FIX: Show loading until auth is FULLY initialized
  // This prevents premature redirects on mobile
  if (loading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary"></div>
      </div>
    );
  }

  // Not authenticated → redirect to /signin
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Authenticated but profile incomplete → redirect to /complete-profile
  // (skip this check for the profile setup page itself)
  if (!skipProfileCheck && !user.profile_completed) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  // Admin-only routes check
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed → render children
  return children;
}

export default ProtectedRoute;
