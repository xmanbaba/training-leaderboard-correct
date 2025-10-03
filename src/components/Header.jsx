// src/components/Header.jsx - With session switcher
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Trophy,
  Settings,
  Share2,
  Download,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Grid3x3,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";

const Header = ({ sidebarCollapsed, setSidebarCollapsed }) => {
  const { userProfile, signOut } = useAuth();
  const { currentSession, sessions } = useSession();
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSessionMenu, setShowSessionMenu] = useState(false);

  const userMenuRef = useRef(null);
  const sessionMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(event.target)
      ) {
        setShowSessionMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSessionSwitch = (newSessionId) => {
    // Stay on the same page type when switching sessions
    const currentPage =
      window.location.pathname.split("/").pop() || "dashboard";
    navigate(`/session/${newSessionId}/${currentPage}`);
    setShowSessionMenu(false);
  };

  const handleViewAllSessions = () => {
    navigate("/sessions");
    setShowSessionMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
            >
              {sidebarCollapsed ? (
                <Menu className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>

            {/* Logo and Session Info */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Training Hub
                </h1>

                {/* Session Selector */}
                {currentSession && (
                  <div className="relative" ref={sessionMenuRef}>
                    <button
                      onClick={() => setShowSessionMenu(!showSessionMenu)}
                      className="flex items-center space-x-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <span className="truncate max-w-48">
                        {currentSession.name}
                      </span>
                      {sessions.length > 1 && (
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${
                            showSessionMenu ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>

                    {/* Session Dropdown */}
                    {showSessionMenu && sessions.length > 0 && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          Your Sessions
                        </div>
                        <div>
                          {sessions.map((session) => (
                            <button
                              key={session.id}
                              onClick={() => handleSessionSwitch(session.id)}
                              className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                currentSession.id === session.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {session.name}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate">
                                    {session.description ||
                                      session.cohort ||
                                      "No description"}
                                  </div>
                                </div>
                                {/* Role badge */}
                                {session.roles?.sessionAdmin ? (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                    Member
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleViewAllSessions}
                            className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2"
                          >
                            <Grid3x3 className="h-4 w-4" />
                            <span>View All Sessions</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden sm:flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium mt-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Action Buttons - Only show for session admins */}
            {currentSession?.roles?.sessionAdmin && (
              <>
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <Settings className="h-5 w-5" />
                </button>

                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                  <Share2 className="h-5 w-5" />
                </button>

                <button className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </>
            )}

            {/* User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200 border border-gray-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-24">
                    {userProfile?.displayName?.split(" ")[0] || "User"}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentSession?.roles?.sessionAdmin ? "Admin" : "Member"}
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {userProfile?.displayName || "User"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {userProfile?.email}
                    </p>
                    {currentSession && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {currentSession.roles?.sessionAdmin
                            ? "Session Admin"
                            : "Participant"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleViewAllSessions}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Grid3x3 className="h-4 w-4 text-gray-400" />
                      <span>My Sessions</span>
                    </button>

                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>Profile Settings</span>
                    </button>

                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-gray-400" />
                      <span>Preferences</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
