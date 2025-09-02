import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Trophy, Plus, Users } from 'lucide-react';

const Navigation = () => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
    { id: 'scoring', label: 'Quick Score', icon: Plus, path: '/quick-scoring' },
    { id: 'participants', label: 'Participants', icon: Users, path: '/participants' },
  ];

  return (
    <div className="bg-white border-b px-4 py-2">
      <div className="flex space-x-1 overflow-x-auto">
        {navigationItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:block">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Navigation;