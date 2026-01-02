import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import FMVA from './pages/FMVA';
import HundredFM from './pages/HundredFM';
import Services from './pages/Services';
import Competitions from './pages/Competitions';
import About from './pages/About';
import Contact from './pages/Contact';
import Testimonials from './pages/Testimonials';
import FAQ from './pages/FAQ';
import Community from './pages/Community';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import JoinTeam from './pages/JoinTeam';
import TeamDetails from './pages/TeamDetails';
import CompetitionDetails from './pages/CompetitionDetails';
import AdminDashboard from './pages/AdminDashboard';
import CFOApplication from './pages/CFOApplication';
import CFOApplicationsList from './pages/CFOApplicationsList';
import CFOApplicationDetail from './pages/CFOApplicationDetail';
import JudgeDashboard from './pages/JudgeDashboard';
import AuthConfirm from './pages/AuthConfirm';
import AuthCallback from './pages/AuthCallback';
import CheckEmail from './pages/CheckEmail';
import ProfileSetup from './pages/ProfileSetup';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ============================================ */}
          {/* PUBLIC ROUTES (Platform-level, no auth) */}
          {/* ============================================ */}
          <Route element={<Layout><Home /></Layout>} path="/" />
          <Route element={<Layout><FMVA /></Layout>} path="/fmva" />
          <Route element={<Layout><HundredFM /></Layout>} path="/100fm" />
          <Route element={<Layout><Services /></Layout>} path="/services" />
          <Route element={<Layout><Competitions /></Layout>} path="/competitions" />
          <Route element={<Layout><About /></Layout>} path="/about" />
          <Route element={<Layout><Contact /></Layout>} path="/contact" />
          <Route element={<Layout><Testimonials /></Layout>} path="/testimonials" />
          <Route element={<Layout><FAQ /></Layout>} path="/faq" />
          <Route element={<Layout><Community /></Layout>} path="/community" />
          
          {/* ============================================ */}
          {/* PLATFORM AUTH ROUTES (Global, no competition context) */}
          {/* ============================================ */}
          <Route path="/signin" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/login" element={<Navigate to="/signin" replace />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route path="/auth/confirm" element={<AuthConfirm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/check-email" element={<CheckEmail />} />
          
          {/* ============================================ */}
          {/* PLATFORM PROFILE ROUTES (Global, requires auth) */}
          {/* ============================================ */}
          {/* Complete Profile - for new users */}
          <Route
            path="/complete-profile"
            element={
              <ProtectedRoute skipProfileCheck={true}>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          {/* Edit Profile - alias to same component in edit mode */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute skipProfileCheck={true}>
                <ProfileSetup />
              </ProtectedRoute>
            }
          />
          
          {/* ============================================ */}
          {/* PLATFORM DASHBOARD (Global, requires complete profile) */}
          {/* ============================================ */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* ============================================ */}
          {/* ADMIN ROUTES (Platform-level) */}
          {/* ============================================ */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* ============================================ */}
          {/* JUDGE ROUTES */}
          {/* ============================================ */}
          <Route
            path="/judge"
            element={
              <ProtectedRoute>
                <JudgeDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* ============================================ */}
          {/* COMPETITION ROUTES (Read global profile, no profile logic) */}
          {/* ============================================ */}
          <Route
            path="/competitions/:competitionId"
            element={
              <ProtectedRoute>
                <CompetitionDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions/:competitionId/apply"
            element={
              <ProtectedRoute>
                <CFOApplication />
              </ProtectedRoute>
            }
          />
          {/* Legacy route redirect - handled by CFOApplication itself */}
          <Route
            path="/cfo-application/:competitionId"
            element={
              <ProtectedRoute>
                <CFOApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions/:competitionId/applications"
            element={
              <ProtectedRoute>
                <CFOApplicationsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/competitions/:competitionId/applications/:applicationId"
            element={
              <ProtectedRoute>
                <CFOApplicationDetail />
              </ProtectedRoute>
            }
          />
          
          {/* ============================================ */}
          {/* TEAM ROUTES (Competition-related) */}
          {/* ============================================ */}
          <Route
            path="/teams/create"
            element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/join"
            element={
              <ProtectedRoute>
                <JoinTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teams/:teamId"
            element={
              <ProtectedRoute>
                <TeamDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;