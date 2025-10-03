// src/components/SessionSelector.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Trophy,
  Plus,
  Users,
  Calendar,
  MapPin,
  Loader,
  Crown,
  UserCircle,
  LogOut,
} from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { collections } from "../config/firestoreSchema";
import CreateSessionModal from "./CreateSessionModal";

const SessionSelector = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadUserSessions();
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get all session_participants records for this user
      const q = query(
        collection(db, collections.SESSION_PARTICIPANTS),
        where("userId", "==", user.uid)
      );
      
      const participantSnap = await getDocs(q);
      
      if (participantSnap.empty) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get full session details
      const sessionPromises = participantSnap.docs.map(async (participantDoc) => {
        const participantData = participantDoc.data();
        const sessionSnap = await getDocs(
          query(
            collection(db, collections.TRAINING_SESSIONS),
            where("__name__", "==", participantData.sessionId)
          )
        );

        if (!sessionSnap.empty) {
          const sessionDoc = sessionSnap.docs[0];
          return {
            ...sessionDoc.data(),
            id: sessionDoc.id,
            role: participantData.role,
            isSessionAdmin: participantData.role === "sessionAdmin",
            isParticipant: participantData.role === "participant",
          };
        }
        return null;
      });

      const sessionsData = (await Promise.all(sessionPromises)).filter(Boolean);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId) => {
    navigate(`/session/${sessionId}/dashboard`);
  };

  const handleSessionCreated = (newSession) => {
    // Reload sessions or add to list
    loadUserSessions();
    setShowCreateModal(false);
    // Navigate to new session
    navigate(`/session/${newSession.id}/dashboard`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome, {userProfile?.displayName || "User"}!
              </h1>
              <p className="text-gray-600">Select a session to continue</p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* No Sessions State */}
        {sessions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Sessions Yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create a new session to get started, or ask a trainer for a join link to participate in an existing session.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Create Session</span>
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 px-6 py-3 rounded-xl font-medium transition-colors border-2 border-gray-200"
              >
                <span>Go to Home</span>
              </a>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {sessions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Your Sessions ({sessions.length})
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>New Session</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-6">
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                          {session.name}
                        </h3>
                        {session.cohort && (
                          <p className="text-sm text-gray-500">{session.cohort}</p>
                        )}
                      </div>
                      
                      {/* Role Badge */}
                      {session.isSessionAdmin ? (
                        <div className="flex items-center space-x-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium">
                          <Crown className="h-3 w-3" />
                          <span>Admin</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                          <UserCircle className="h-3 w-3" />
                          <span>Participant</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {session.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {/* Session Details */}
                    <div className="space-y-2 text-sm text-gray-500">
                      {session.startDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(session.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {session.maxParticipants 
                            ? `Max ${session.maxParticipants} participants`
                            : "Unlimited participants"}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.registrationOpen
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {session.registrationOpen ? "Open" : "Closed"}
                        </span>
                        <span className="text-blue-600 group-hover:text-blue-700 font-medium text-sm">
                          Enter →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Create Session Modal */}
        <CreateSessionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={handleSessionCreated}
        />
      </div>
    </div>
  );
};

export default SessionSelector;