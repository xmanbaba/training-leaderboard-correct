// src/components/SessionLayout.jsx
import React, { useState, useEffect } from "react";
import { Outlet, useParams, useNavigate, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Zap,
  Settings,
  ChevronDown,
  Menu,
  X,
  Shield,
  UserCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";

const SessionLayout = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();
  const { currentSession, sessions, selectSession, loading } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find((s) => s.id === sessionId);
      if (session && (!currentSession || currentSession.id !== sessionId)) {
        selectSession(sessionId);
      }
    }
  }, [sessionId, sessions]);

  // Check if user is session admin for current session
  const isSessionAdmin = currentSession?.roles?.sessionAdmin || false;
  const isOrgAdmin = currentSession?.roles?.orgAdmin || false;

  // Navigation items
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
      name: "Quick Scoring",
      path: `/session/${sessionId}/quick-scoring`,
      icon: Zap,
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

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Session Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The session you're trying to access doesn't exist or you don't have
            permission to view it.
          </p>
          <button
            onClick={() => navigate("/sessions")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            View My Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
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
            <div className="relative">
              <button
                onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-2 transition-colors"
              >
                <Trophy className="h-5 w-5 text-blue-600" />
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-gray-900 text-sm">
                    {currentSession.name}
                  </div>
                  {isSessionAdmin && (
                    <div className="text-xs text-blue-600">Admin</div>
                  )}
                  {!isSessionAdmin && (
                    <div className="text-xs text-gray-500">Member</div>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* Dropdown */}
              {showSessionDropdown && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Your Sessions
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
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
                              <Shield className="h-3 w-3 inline mr-1" />
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

          {/* Right: Role Badge + User Menu */}
          <div className="flex items-center space-x-3">
            {/* Role Badge */}
            {isSessionAdmin ? (
              <div className="hidden sm:flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                <UserCircle className="h-4 w-4" />
                <span>Member</span>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userProfile?.displayName?.charAt(0) || "U"}
                </div>
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

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 overflow-x-auto">
          <div className="flex space-x-1 px-2 py-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-[73px] bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
              {item.adminOnly && (
                <Shield className="h-4 w-4 ml-auto opacity-50" />
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-4">
        <Outlet />
      </main>
    </div>
  );
};

export default SessionLayout;
