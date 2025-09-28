import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Header = ({
  selectedTraining,
  sidebarCollapsed,
  setSidebarCollapsed,
  participants,
}) => {
  const { userProfile, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const engagementRate = participants
    ? Math.round(
        (participants.filter((p) => p.totalScore > 0).length /
          participants.length) *
          100
      )
    : 0;

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

            {/* Logo and Title */}
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
                {selectedTraining && (
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-600 truncate max-w-48">
                      {selectedTraining.name}
                    </p>
                    <div className="hidden sm:flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-medium">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      <span>Live</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Quick Stats - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4 mr-4 px-4 py-2 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-sm font-bold text-blue-600">
                  {participants?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Participants</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-600">
                  {engagementRate}%
                </div>
                <div className="text-xs text-gray-500">Engaged</div>
              </div>
            </div>

            {/* Action Buttons */}
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

            {/* User Profile Dropdown */}
            <div className="relative" ref={menuRef}>
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
                  <p className="text-xs text-gray-600 capitalize">
                    {userProfile?.role || "participant"}
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
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {userProfile?.role || "participant"}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
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
