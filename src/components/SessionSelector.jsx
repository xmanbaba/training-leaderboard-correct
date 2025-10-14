// src/components/SessionSelector.jsx - Fixed navigation after session creation
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
  LogIn,
  Search,
  X,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { collections } from "../config/firestoreSchema";
import CreateSessionModal from "./CreateSessionModal";

const SessionSelector = () => {
  const { user, userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' = newest first, 'asc' = oldest first

  useEffect(() => {
    if (user?.uid) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, collections.SESSION_PARTICIPANTS),
        where("userId", "==", user.uid),
        where("isActive", "==", true)
      );

      const participantSnap = await getDocs(q);

      if (participantSnap.empty) {
        console.log("No session participants found for user:", user.uid);
        setSessions([]);
        setLoading(false);
        return;
      }

      console.log(`Found ${participantSnap.size} session participant records`);

      const sessionPromises = participantSnap.docs.map(
        async (participantDoc) => {
          const participantData = participantDoc.data();
          console.log("Participant data:", participantData);

          try {
            const sessionRef = doc(
              db,
              collections.TRAINING_SESSIONS,
              participantData.sessionId
            );
            const sessionDoc = await getDoc(sessionRef);

            if (sessionDoc.exists()) {
              const sessionData = sessionDoc.data();

              // FILTER OUT DELETED SESSIONS
              if (sessionData.status === "deleted") {
                console.log(`Filtering out deleted session: ${sessionDoc.id}`);
                return null;
              }

              console.log("Found session:", sessionDoc.id, sessionData.name);

              return {
                ...sessionData,
                id: sessionDoc.id,
                role: participantData.role,
                isSessionAdmin: participantData.role === "sessionAdmin",
                isParticipant: participantData.role === "participant",
              };
            } else {
              console.warn("Session not found:", participantData.sessionId);
            }
          } catch (error) {
            console.error(
              "Error fetching session:",
              participantData.sessionId,
              error
            );
          }
          return null;
        }
      );

      const sessionsData = (await Promise.all(sessionPromises)).filter(Boolean);
      console.log("Loaded sessions:", sessionsData);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (sessionId) => {
    console.log("Clicking session:", sessionId);
    navigate(`/session/${sessionId}/dashboard`);
  };

  const handleSessionCreated = async (newSession) => {
    console.log("Session created callback received:", newSession);

    // Close modal first
    setShowCreateModal(false);

    // Add the new session to the local state immediately for better UX
    const enrichedSession = {
      ...newSession,
      role: "sessionAdmin",
      isSessionAdmin: true,
      isParticipant: false,
    };

    setSessions((prev) => [enrichedSession, ...prev]);

    // Navigate immediately - don't wait for reload
    console.log("Navigating to new session:", newSession.id);
    navigate(`/session/${newSession.id}/dashboard`, {
      replace: true,
      state: { isNewSession: true },
    });

    // Reload sessions in the background to ensure sync
    setTimeout(() => {
      loadUserSessions();
    }, 500);
  };

  const handleJoinWithCode = () => {
    if (joinCode.trim().length >= 6) {
      navigate(`/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  // Filter and sort sessions
  const filteredAndSortedSessions = sessions
    .filter((session) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        session.name?.toLowerCase().includes(search) ||
        session.description?.toLowerCase().includes(search) ||
        session.cohort?.toLowerCase().includes(search) ||
        session.location?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome, {userProfile?.displayName || "User"}!
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                Select a session to continue
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm md:text-base"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* No Sessions State */}
        {sessions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-12 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Trophy className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              No Sessions Yet
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 max-w-md mx-auto">
              Create a new session to get started, or join an existing session
              using a join code.
            </p>

            {/* Join Session Form */}
            <div className="max-w-md mx-auto mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 md:p-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base">
                  Have a Join Code?
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter join code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleJoinWithCode();
                      }
                    }}
                    className="flex-1 px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center font-mono uppercase text-sm md:text-base"
                    maxLength={12}
                  />
                  <button
                    onClick={handleJoinWithCode}
                    disabled={joinCode.trim().length < 6}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Join</span>
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Enter your session code to join instantly
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl text-sm md:text-base"
              >
                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                <span>Create Session</span>
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium transition-colors border-2 border-gray-200 text-sm md:text-base"
              >
                <span>Go to Home</span>
              </a>
            </div>
          </div>
        )}

        {/* Sessions Grid */}
        {sessions.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 space-y-3 sm:space-y-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                Your Sessions ({filteredAndSortedSessions.length})
              </h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-md hover:shadow-lg text-sm md:text-base"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Session</span>
                </button>
              </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 md:mb-6">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    Sort by:
                  </span>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                    }
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                  >
                    <span>
                      {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        sortOrder === "asc" ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredAndSortedSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-4 md:p-6">
                    {/* Session Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 truncate">
                          {session.name}
                        </h3>
                        {session.cohort && (
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {session.cohort}
                          </p>
                        )}
                      </div>

                      {/* Role Badge */}
                      {session.isSessionAdmin ? (
                        <div className="flex items-center space-x-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0">
                          <Crown className="h-3 w-3" />
                          <span className="hidden sm:inline">Admin</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0">
                          <UserCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">Member</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {session.description && (
                      <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    {/* Session Details */}
                    <div className="space-y-2 text-xs md:text-sm text-gray-500">
                      {session.startDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">
                            {new Date(session.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {session.maxParticipants
                            ? `Max ${session.maxParticipants} participants`
                            : "Unlimited participants"}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === "completed"
                              ? "bg-gray-100 text-gray-600"
                              : session.registrationOpen
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {session.status === "completed"
                            ? "Archived"
                            : session.registrationOpen
                            ? "Open"
                            : "Closed"}
                        </span>
                        <span className="text-blue-600 group-hover:text-blue-700 font-medium text-xs md:text-sm">
                          Enter →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No Results Message */}
            {filteredAndSortedSessions.length === 0 && searchTerm && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mt-6">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No sessions found
                </h3>
                <p className="text-gray-600 mb-4">
                  No sessions match "{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Clear search
                </button>
              </div>
            )}
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
