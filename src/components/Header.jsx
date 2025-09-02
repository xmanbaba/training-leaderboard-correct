import React from 'react';
import { Trophy, Settings, Share2, Download, Menu, X, Zap, Star } from 'lucide-react';

const Header = ({ selectedTraining, sidebarCollapsed, setSidebarCollapsed }) => {
  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-blue-200/50 px-4 py-4 lg:px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="lg:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
          >
            {sidebarCollapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
          </button>

          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="h-2.5 w-2.5 text-yellow-800" />
              </div>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Training Leaderboard
              </h1>
              {selectedTraining && (
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">{selectedTraining.name}</p>
                  <div className="hidden sm:flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-4 mr-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">24</div>
              <div className="text-xs text-gray-500">Participants</div>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">85%</div>
              <div className="text-xs text-gray-500">Engagement</div>
            </div>
          </div>

          {/* Action Buttons */}
          <button className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group">
            <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <button className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
          
          {/* Gamification Element */}
          <div className="hidden lg:flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2.5 rounded-xl shadow-lg">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-bold">Level 5</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;