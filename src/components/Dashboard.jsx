// src/components/Dashboard.jsx - Routes to correct dashboard based on role
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import AdminDashboard from "./AdminDashboard";
import ParticipantDashboard from "./ParticipantDashboard";

const Dashboard = () => {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for session to load
    if (currentSession !== undefined) {
      setLoading(false);
    }
  }, [currentSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin (sessionAdmin or orgAdmin)
  const isAdmin =
    currentSession?.roles?.sessionAdmin || currentSession?.roles?.orgAdmin;

  // Route to appropriate dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  } else {
    return <ParticipantDashboard />;
  }
};

export default Dashboard;
