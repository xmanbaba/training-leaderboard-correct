import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Trophy,
  Plus,
  Users,
  Settings,
  ChevronLeft,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Navigation = ({ collapsed, setCollapsed }) => {
  const { userProfile } = useAuth();

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/",
      description: "Overview & insights",
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      path: "/leaderboard",
      description: "Rankings & competition",
    },
    {
      id: "scoring",
      label: "Quick Score",
      icon: Plus,
      path: "/quick-scoring",
      description: "Award points",
      restricted:
        userProfile?.role !== "trainer" && userProfile?.role !== "admin",
    },
    {
      id: "participants",
      label: "Participants",
      icon: Users,
      path: "/participants",
      description: "Manage learners",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      description: "Configuration",
      restricted:
        userProfile?.role !== "trainer" && userProfile?.role !== "admin",
    },
  ];

  const visibleItems = navigationItems.filter((item) => !item.restricted);

  return (
    <nav
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-40 lg:translate-x-0 ${
        collapsed ? "-translate-x-full lg:w-20" : "translate-x-0 w-72"
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Training Hub
                </h2>
                <p className="text-sm text-gray-600">Navigation</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <ChevronLeft
              className={`h-5 w-5 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {visibleItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            onClick={() => window.innerWidth < 1024 && setCollapsed(true)}
            className={({ isActive }) =>
              `group relative flex items-center transition-all duration-200 rounded-xl ${
                collapsed ? "justify-center p-3" : "space-x-4 p-4"
              } ${
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                </div>

                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm truncate">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {item.description}
                        </p>
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom Section - Progress Card */}
      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl mx-auto mb-3 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                Session Progress
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                Training completion status
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 h-2 rounded-full transition-all duration-1000"
                  style={{ width: "68%" }}
                />
              </div>
              <p className="text-xs text-gray-600">68% Complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Bottom Icon */}
      {collapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center group cursor-pointer hover:scale-110 transition-transform duration-200">
            <Target className="h-5 w-5 text-white" />
            {/* Tooltip */}
            <div className="absolute left-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
              Progress: 68%
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
