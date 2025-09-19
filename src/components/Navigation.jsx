import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Trophy,
  Plus,
  Users,
  Settings,
  ChevronLeft,
  Flame,
  Target,
} from "lucide-react";

const Navigation = ({ collapsed, setCollapsed }) => {
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/",
      color: "from-blue-500 to-blue-600",
      notification: 3,
    },
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      path: "/leaderboard",
      color: "from-yellow-500 to-orange-500",
      isHot: true,
    },
    {
      id: "scoring",
      label: "Quick Score",
      icon: Plus,
      path: "/quick-scoring",
      color: "from-green-500 to-emerald-600",
    },
    {
      id: "participants",
      label: "Participants",
      icon: Users,
      path: "/participants",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      path: "/settings",
      color: "from-gray-500 to-gray-600",
    },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-xl border-r border-blue-200/50 shadow-xl transition-all duration-300 ease-in-out z-50 lg:translate-x-0 ${
          collapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-blue-100/50">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  Navigation
                </h2>
                <p className="text-sm text-gray-500">Training Hub</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group hover:scale-105"
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
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && setCollapsed(true)} // Close on mobile when clicking
              className={({ isActive }) =>
                `group relative flex items-center ${
                  collapsed ? "justify-center" : "space-x-3"
                } p-3 rounded-xl transition-all duration-200 hover:scale-105 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-lg border border-blue-200/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${item.color} text-white shadow-md`
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />

                    {/* Notification Badge */}
                    {item.notification && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                        {item.notification}
                      </div>
                    )}

                    {/* Hot Badge */}
                    {item.isHot && (
                      <div className="absolute -top-1 -right-1">
                        <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
                      </div>
                    )}
                  </div>

                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{item.label}</span>
                      {isActive && (
                        <div className="text-xs text-blue-600 font-medium">
                          Active
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive && !collapsed && (
                    <div className="absolute right-0 w-1 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {!collapsed && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Training Progress
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Complete all modules
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-1000 animate-pulse"
                    style={{ width: "75%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">75% Complete</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navigation;
