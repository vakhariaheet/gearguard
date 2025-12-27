import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { WebSocketTestPage } from './pages/WebSocketTestPage';
import { FeaturesPage } from './pages/landing/FeaturesPage';
import { PricingPage } from './pages/landing/PricingPage';
import { AboutPage } from './pages/landing/AboutPage';
import { ContactPage } from './pages/landing/ContactPage';
import { HelpPage } from './pages/landing/HelpPage';
import { TeamListPage } from './pages/teams/TeamListPage';
import { TeamDetailsPage } from './pages/teams/TeamDetailsPage';
import { EquipmentPage } from './pages/equipment/EquipmentPage';
import { EquipmentHealthPage } from './pages/equipment/EquipmentHealthPage';
import { MaintenanceSchedulePage } from './pages/equipment/MaintenanceSchedulePage';
import { RequestListPage } from './pages/requests/RequestListPage';
import { RequestCreatePage } from './pages/requests/RequestCreatePage';
import { RequestDetailsPage } from './pages/requests/RequestDetailsPage';
import { RequestEditPage } from './pages/requests/RequestEditPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';
import './App.css';

// Component to redirect authenticated users away from auth pages
function AuthPageWrapper({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user } = useUser();

  return (
    <div className="app">
      <Toaster position="top-right" richColors closeButton expand={true} duration={4000} />
      <header className="app-header">
        <Link to="/" className="logo-link">
          <h1>GearGuard</h1>
        </Link>
        <nav className="main-nav">
          <SignedOut>
            <div className="nav-links">
              <Link to="/features" className="nav-link">
                Features
              </Link>
              <Link to="/pricing" className="nav-link">
                Pricing
              </Link>
              <Link to="/about" className="nav-link">
                About
              </Link>
              <Link to="/help" className="nav-link">
                Help
              </Link>
              <Link to="/contact" className="nav-link">
                Contact
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/requests" className="nav-link">
              Requests
            </Link>
            <Link to="/equipment" className="nav-link">
              Equipment
            </Link>
            <Link to="/teams" className="nav-link">
              Teams
            </Link>
            {user?.publicMetadata?.role === 'admin' && (
              <Link to="/admin" className="nav-link">
                Admin
              </Link>
            )}
          </SignedIn>
        </nav>
        <div className="auth-section">
          <SignedOut>
            <div className="auth-buttons">
              <Link to="/sign-in" className="auth-btn signin-btn">
                Sign In
              </Link>
              <Link to="/sign-up" className="auth-btn signup-btn">
                Start Free Trial
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="user-section">
              <span>Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!</span>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </header>

      <ScrollToTop behavior="smooth" />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <SignedOut>
                <LandingPage />
              </SignedOut>
              <SignedIn>
                <Navigate to="/dashboard" replace />
              </SignedIn>
            </>
          }
        />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route
          path="/sign-in/*"
          element={
            <AuthPageWrapper>
              <SignInPage />
            </AuthPageWrapper>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <AuthPageWrapper>
              <SignUpPage />
            </AuthPageWrapper>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <EquipmentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/health"
          element={
            <ProtectedRoute>
              <EquipmentHealthPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/equipment/maintenance"
          element={
            <ProtectedRoute>
              <MaintenanceSchedulePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/websocket-test"
          element={
            <ProtectedRoute>
              <WebSocketTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams"
          element={
            <ProtectedRoute>
              <TeamListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:id"
          element={
            <ProtectedRoute>
              <TeamDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/create"
          element={
            <ProtectedRoute>
              <RequestCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute>
              <RequestDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id/edit"
          element={
            <ProtectedRoute>
              <RequestEditPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
