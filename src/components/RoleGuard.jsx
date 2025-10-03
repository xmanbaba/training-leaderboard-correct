// src/components/RoleGuard.jsx
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useSession } from "../contexts/SessionContext";
import { AlertTriangle, Shield } from "lucide-react";

/**
 * RoleGuard - Protects routes/components based on session roles
 * Use this inside session-based routes to check permissions
 */
const RoleGuard = ({ children, requireAdmin = false }) => {
  const { sessionId } = useParams();
  const { currentSession, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin access
  const isSessionAdmin = currentSession?.roles?.sessionAdmin || false;
  const isOrgAdmin = currentSession?.roles?.orgAdmin || false;
  const hasAdminAccess = isSessionAdmin || isOrgAdmin;

  // If admin is required and user doesn't have access
  if (requireAdmin && !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Admin Access Required
          </h2>

          <p className="text-gray-600 mb-6">
            You need session administrator privileges to access this page.
          </p>

          <div className="space-y-3 text-sm text-left bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Your Role</p>
                <p className="text-gray-500">
                  {currentSession?.roles?.participant
                    ? "Participant"
                    : "No role assigned"}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-700">Required Role</p>
                <p className="text-gray-500">Session Administrator</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() =>
                (window.location.href = `/session/${sessionId}/dashboard`)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact the session
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleGuard;
