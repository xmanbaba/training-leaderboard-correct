import React from 'react';
import { Trophy, Settings, Share2, Download } from 'lucide-react';

const Header = ({ selectedTraining, setCurrentView }) => {
  return (
    <div className="bg-white shadow-sm border-b px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Trophy className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
              Training Leaderboard
            </h1>
            {selectedTraining && (
              <p className="text-sm text-gray-600">{selectedTraining.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('settings')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;