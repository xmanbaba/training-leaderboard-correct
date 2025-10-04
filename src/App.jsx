// src/App.jsx - Fixed navigation reloading issue
import React from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SessionProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Auth/Home";
import SessionLayout from "./components/SessionLayout";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import Participants from "./components/Participants";
import ParticipantJoin from "./components/ParticipantJoin";
import SessionSelector from "./components/SessionSelector";
import LandingPage from "./components/LandingPage";
import RoleGuard from "./components/RoleGuard";
import QuickScoring from "./components/QuickScoring";
import Settings from "./components/Settings";
import { scoringCategories } from "./data/mockData";

// Helper function for level calculation
const calculateLevel = (participant) => {
  const positiveContributions = Object.entries(participant.scores || {})
    .filter(([key]) => scoringCategories.positive[key])
    .reduce((sum, [, value]) => sum + Math.max(0, value), 0);

  if (positiveContributions >= 50)
    return {
      level: 5,
      title: "Master",
      color: "bg-gradient-to-r from-blue-600 to-indigo-700",
    };
  if (positiveContributions >= 30)
    return {
      level: 4,
      title: "Expert",
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
    };
  if (positiveContributions >= 20)
    return {
      level: 3,
      title: "Proficient",
      color: "bg-gradient-to-r from-blue-400 to-blue-500",
    };
  if (positiveContributions >= 10)
    return {
      level: 2,
      title: "Contributor",
      color: "bg-gradient-to-r from-blue-300 to-blue-400",
    };
  return {
    level: 1,
    title: "Newcomer",
    color: "bg-gradient-to-r from-slate-400 to-slate-500",
  };
};

// Wrapper component to force remount on location change
function RouteWrapper({ children }) {
  const location = useLocation();
  // Use pathname as key to force remount when route changes
  return <React.Fragment key={location.pathname}>{children}</React.Fragment>;
}

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Home />} />
            <Route path="/join/:joinCode" element={<ParticipantJoin />} />
            <Route path="/join" element={<ParticipantJoin />} />

            {/* Protected: Session Selector */}
            <Route
              path="/sessions"
              element={
                <ProtectedRoute>
                  <SessionSelector />
                </ProtectedRoute>
              }
            />

            {/* Protected: Session-based routes (with layout) */}
            <Route
              path="/session/:sessionId"
              element={
                <ProtectedRoute>
                  <SessionLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard - accessible to all */}
              <Route
                path="dashboard"
                element={
                  <RouteWrapper>
                    <Dashboard />
                  </RouteWrapper>
                }
              />

              {/* Leaderboard - accessible to all */}
              <Route
                path="leaderboard"
                element={
                  <RouteWrapper>
                    <Leaderboard scoringCategories={scoringCategories} />
                  </RouteWrapper>
                }
              />

              {/* Participants - accessible to all */}
              <Route
                path="participants"
                element={
                  <RouteWrapper>
                    <Participants calculateLevel={calculateLevel} />
                  </RouteWrapper>
                }
              />

              {/* Quick Scoring - Admin only */}
              <Route
                path="quick-scoring"
                element={
                  <RoleGuard requireAdmin={true}>
                    <RouteWrapper>
                      <QuickScoring
                        scoringCategories={scoringCategories}
                        calculateLevel={calculateLevel}
                      />
                    </RouteWrapper>
                  </RoleGuard>
                }
              />

              {/* Settings - Admin only */}
              <Route
                path="settings"
                element={
                  <RoleGuard requireAdmin={true}>
                    <RouteWrapper>
                      <Settings />
                    </RouteWrapper>
                  </RoleGuard>
                }
              />

              {/* Default redirect to dashboard */}
              <Route path="" element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Legacy admin routes - redirect to sessions */}
            <Route
              path="/admin/*"
              element={<Navigate to="/sessions" replace />}
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/sessions" replace />}
            />

            {/* Fallback - redirect to home or sessions based on auth */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SessionProvider>
    </AuthProvider>
  );
}
