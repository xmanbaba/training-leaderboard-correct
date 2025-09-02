import React from 'react';
import { Users, BarChart3, Trophy, Building2 } from 'lucide-react';

const Dashboard = ({ participants, mockGroups }) => {
  const averageScore = Math.round(
    participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length || 0
  );
  const topScore = Math.max(...participants.map(p => p.totalScore));

  const recentActivities = [
    {
      id: 1,
      message: "Sarah Johnson scored +5 in Attendance",
      time: "2 min ago",
      type: "positive"
    },
    {
      id: 2,
      message: "David Kim scored -3 in Disruption",
      time: "5 min ago",
      type: "negative"
    },
    {
      id: 3,
      message: "Mike Chen completed a project (+3 points)",
      time: "10 min ago",
      type: "positive"
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-gray-900">{participants.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Top Score</p>
              <p className="text-2xl font-bold text-gray-900">{topScore}</p>
            </div>
            <Trophy className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Groups</p>
              <p className="text-2xl font-bold text-gray-900">{mockGroups.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    activity.type === 'positive' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <p className="text-sm text-gray-600">{activity.message}</p>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;