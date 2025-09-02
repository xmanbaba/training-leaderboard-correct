import React from 'react';
import { Users, BarChart3, Trophy, Building2, TrendingUp, Zap, Star, Award, Clock, Target } from 'lucide-react';

const Dashboard = ({ participants, mockGroups, getSortedParticipants }) => {
  const averageScore = Math.round(
    participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length || 0
  );
  const topScore = Math.max(...participants.map(p => p.totalScore));
  const sortedParticipants = getSortedParticipants();
  const topPerformers = sortedParticipants.slice(0, 3);

  const recentActivities = [
    {
      id: 1,
      message: "Sarah Johnson earned +5 points",
      detail: "Perfect attendance streak!",
      time: "2 min ago",
      type: "positive",
      points: 5
    },
    {
      id: 2,
      message: "David Kim lost -3 points",
      detail: "Disruptive behavior",
      time: "5 min ago",
      type: "negative",
      points: -3
    },
    {
      id: 3,
      message: "Team Alpha completed challenge",
      detail: "Project milestone achieved",
      time: "10 min ago",
      type: "achievement",
      points: 10
    },
    {
      id: 4,
      message: "Mike Chen earned badge",
      detail: "Question Master - 50 questions asked",
      time: "15 min ago",
      type: "badge",
      points: 15
    }
  ];

  const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, bgGradient }) => (
    <div className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/20 backdrop-blur-sm`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-bold mb-1">{value}</p>
          <p className="text-white/80 text-sm">{title}</p>
          {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500"></div>
    </div>
  );

  const ActivityItem = ({ activity }) => (
    <div className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
      <div className={`p-2 rounded-full ${
        activity.type === 'positive' ? 'bg-green-100 text-green-600' :
        activity.type === 'negative' ? 'bg-red-100 text-red-600' :
        activity.type === 'achievement' ? 'bg-blue-100 text-blue-600' :
        'bg-purple-100 text-purple-600'
      }`}>
        {activity.type === 'positive' && <TrendingUp className="h-4 w-4" />}
        {activity.type === 'negative' && <TrendingUp className="h-4 w-4 rotate-180" />}
        {activity.type === 'achievement' && <Target className="h-4 w-4" />}
        {activity.type === 'badge' && <Award className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
          {activity.message}
        </p>
        <p className="text-sm text-gray-600">{activity.detail}</p>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-xs text-gray-500">{activity.time}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            activity.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {activity.points > 0 ? '+' : ''}{activity.points} pts
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, Trainer! 👋</h2>
          <p className="text-blue-100 mb-6 text-lg">Your training session is performing exceptionally well</p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Session: Day 12 of 30</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="font-medium">High Energy Level</span>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 translate-x-16"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Participants"
          value={participants.length}
          subtitle="All active learners"
          trend="+12%"
          bgGradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={BarChart3}
          title="Average Score"
          value={averageScore}
          subtitle="Team performance"
          trend="+8%"
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
        />
        <StatCard
          icon={Trophy}
          title="Top Score"
          value={topScore}
          subtitle="Current leader"
          trend="+15%"
          bgGradient="bg-gradient-to-br from-yellow-500 to-orange-500"
        />
        <StatCard
          icon={Building2}
          title="Active Groups"
          value={mockGroups.length}
          subtitle="Team collaborations"
          bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Top Performers */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
                  Top Performers
                </h3>
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {topPerformers.map((participant, index) => (
                <div key={participant.id} className="flex items-center space-x-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    'bg-gradient-to-r from-orange-400 to-orange-600'
                  }`}>
                    {index + 1}
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{participant.name}</p>
                    <p className="text-sm text-gray-600">{participant.department}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900">
                      {participant.totalScore > 0 ? '+' : ''}{participant.totalScore}
                    </div>
                    <div className="text-xs text-gray-500">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Zap className="h-6 w-6 text-blue-500 mr-2" />
                  Live Activity Feed
                </h3>
                <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Team Progress */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 text-purple-500 mr-2" />
              Team Progress
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {mockGroups.map((group) => {
              const groupScore = participants
                .filter(p => group.participantIds.includes(p.id))
                .reduce((sum, p) => sum + p.totalScore, 0);
              const progressPercentage = Math.max(0, Math.min(100, (groupScore / 50) * 100));
              
              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{group.name}</span>
                    <span className="text-sm font-bold text-gray-700">{groupScore} pts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{group.participantIds.length} members</span>
                    <span>{Math.round(progressPercentage)}% to next level</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Award className="h-6 w-6 text-yellow-500 mr-2" />
              Recent Achievements
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Top Scorer</h4>
                <p className="text-xs text-gray-600 mb-2">Earned by Sarah Johnson</p>
                <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">New!</span>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Team Player</h4>
                <p className="text-xs text-gray-600 mb-2">Earned by Mike Chen</p>
                <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">2 days ago</span>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Consistent</h4>
                <p className="text-xs text-gray-600 mb-2">Perfect attendance</p>
                <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">3 days ago</span>
              </div>
              
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">Rising Star</h4>
                <p className="text-xs text-gray-600 mb-2">Most improved</p>
                <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">1 week ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;