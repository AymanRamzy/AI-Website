import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * SINGLE GLOBAL AUTH GUARD
 * MOBILE FIX: Blocks ALL routing until ready === true
 */
function ProtectedRoute({ children, adminOnly = false, skipProfileCheck = false }) {
  const { user, loading, ready } = useAuth();
  const location = useLocation();

  // MOBILE FIX: Block until ready - prevents flash/loop
  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // Profile incomplete (skip for profile setup page)
  if (!skipProfileCheck && user.profile_completed === false) {
    return <Navigate to="/complete-profile" replace state={{ from: location }} />;
  }

  // Admin-only check
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
