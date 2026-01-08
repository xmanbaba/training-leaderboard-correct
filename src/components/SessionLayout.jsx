// src/components/SessionLayout.jsx - Updated navigation with Sessions, Scoring, and Teams
import React, { useState, useEffect, useRef } from "react";
import { Outlet, useParams, useNavigate, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Zap,
  Settings,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  Shield,
  UserCircle,
  LogOut,
  Share2,
  Copy,
  Check,
  Layers,
  UsersRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";

const SessionLayout = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();
  const { currentSession, sessions, selectSession, loading } = useSession();
  const sessionFromUrl = sessions.find((s) => s.id === sessionId);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareModalRef = useRef(null);
  const userMenuRef = useRef(null);
  const sessionDropdownRef = useRef(null);

  // Load session when sessionId changes
  useEffect(() => {
    if (!sessionId || sessions.length === 0) return;

    if (!currentSession || currentSession.id !== sessionId) {
      const match = sessions.find((s) => s.id === sessionId);
      if (match) {
        selectSession(sessionId);
      }
    }
  }, [sessionId, sessions, currentSession, selectSession]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        shareModalRef.current &&
        !shareModalRef.current.contains(event.target)
      ) {
        setShowShareModal(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        sessionDropdownRef.current &&
        !sessionDropdownRef.current.contains(event.target)
      ) {
        setShowSessionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [sessionId, window.location.pathname]);

  const isSessionAdmin = currentSession?.roles?.sessionAdmin || false;
  const isOrgAdmin = currentSession?.roles?.orgAdmin || false;

  // Navigation items - UPDATED
  const navigationItems = [
    {
      name: "Dashboard",
      path: `/session/${sessionId}/dashboard`,
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: "Leaderboard",
      path: `/session/${sessionId}/leaderboard`,
      icon: Trophy,
      show: true,
    },
    {
      name: "Participants",
      path: `/session/${sessionId}/participants`,
      icon: Users,
      show: true,
    },
    {
      name: "Teams",
      path: `/session/${sessionId}/teams`,
      icon: UsersRound,
      show: true,
    },
    {
      name: "Scoring",
      path: `/session/${sessionId}/quick-scoring`,
      icon: Zap,
      show: isSessionAdmin || isOrgAdmin,
      adminOnly: true,
    },
    {
      name: "Sessions",
      path: `/sessions`,
      icon: Layers,
      show: isSessionAdmin || isOrgAdmin,
      adminOnly: true,
    },
    {
      name: "Settings",
      path: `/session/${sessionId}/settings`,
      icon: Settings,
      show: isSessionAdmin || isOrgAdmin,
      adminOnly: true,
    },
  ];

  const visibleNavItems = navigationItems.filter((item) => item.show);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getShareUrl = () => {
    if (!currentSession?.joinCode) return "";
    return `${window.location.origin}/join/${currentSession.joinCode}`;
  };

  const handleCopyLink = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: currentSession?.name || "Training Session",
      text: `Join ${currentSession?.name || "our training session"}!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== "AbortError") {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!sessionFromUrl) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Preparing session...</p>
      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Training Hub
                </h2>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setSidebarOpen(false);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)]">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center ${
                  sidebarCollapsed ? "justify-center px-3" : "space-x-3 px-4"
                } py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                  {!sidebarCollapsed && item.adminOnly && (
                    <Shield className="h-4 w-4 ml-auto opacity-50" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="h-16 flex items-center justify-between px-4">
            {/* Left: Menu + Session Selector */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>

              {/* Session Selector */}
              <div className="relative" ref={sessionDropdownRef}>
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-2 transition-colors"
                >
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold text-gray-900 text-sm truncate max-w-48">
                      {currentSession.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isSessionAdmin ? "Admin" : "Member"}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {/* Dropdown */}
                {showSessionDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Your Sessions
                      </div>
                    </div>

                    <div>
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            selectSession(session.id);
                            navigate(`/session/${session.id}/dashboard`);
                            setShowSessionDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            currentSession.id === session.id ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {session.name}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {session.description || session.cohort}
                              </div>
                            </div>
                            {session.roles?.sessionAdmin && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex-shrink-0">
                                Admin
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          navigate("/sessions");
                          setShowSessionDropdown(false);
                        }}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All Sessions
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Share + User Menu */}
            <div className="flex items-center space-x-3">
              {/* Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share Session</span>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userProfile?.displayName?.charAt(0) || "U"}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">
                        {userProfile?.displayName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userProfile?.email}
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            ref={shareModalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Share Session</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share this link with participants to join {currentSession.name}
            </p>

            {/* Join Code Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-600 mb-1">Join Code</div>
              <div className="text-2xl font-bold text-blue-600 tracking-wider">
                {currentSession.joinCode}
              </div>
            </div>

            {/* Share URL */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={getShareUrl()}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Share Instructions */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                How to join:
              </p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Visit the link above or go to the join page</li>
                <li>
                  Enter the join code:{" "}
                  <span className="font-mono font-semibold text-blue-600">
                    {currentSession.joinCode}
                  </span>
                </li>
                <li>Complete registration to join the session</li>
              </ol>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionLayout;
