// src/components/AdminDashboard.jsx - Admin-only dashboard
import React, { useState, useEffect } from "react";
import {
  Users,
  BarChart3,
  Trophy,
  Building2,
  TrendingUp,
  Star,
  Award,
  Activity,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import AddParticipantModal from "./AddParticipantModal";

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const { currentSession } = useSession();
  const [participants, setParticipants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();

  // Real-time participants subscription
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (updatedParticipants) => {
          console.log(
            "Admin Dashboard - Loaded participants:",
            updatedParticipants.length
          );
          setParticipants(updatedParticipants);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setParticipants([]);
      setLoading(false);
    }
  }, [currentSession?.id]);

  // Real-time activities subscription
  useEffect(() => {
    if (participantService.subscribeToRecentActivities && currentSession?.id) {
      const unsubscribe = participantService.subscribeToRecentActivities(
        currentSession.id,
        (activities) => {
          console.log(
            "Admin Dashboard - Loaded activities:",
            activities.length
          );
          setRecentActivities(activities);
        }
      );
      return () => unsubscribe();
    } else {
      setRecentActivities([]);
    }
  }, [currentSession?.id]);

  // Calculate statistics
  const averageScore =
    participants.length > 0
      ? Math.round(
          participants.reduce((sum, p) => sum + (p.totalScore || 0), 0) /
            participants.length
        )
      : 0;

  const topScore =
    participants.length > 0
      ? Math.max(...participants.map((p) => p.totalScore || 0))
      : 0;

  const sortedParticipants = [...participants].sort(
    (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
  );

  const topPerformers = sortedParticipants.slice(0, 3);

  const StatCard = ({ icon: Icon, title, value, subtitle, variant }) => {
    const variants = {
      blue: "from-blue-500 to-blue-600",
      green: "from-emerald-500 to-emerald-600",
      purple: "from-indigo-500 to-indigo-600",
      orange: "from-amber-500 to-amber-600",
    };
    return (
      <div className="group relative bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div
              className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r ${variants[variant]} text-white mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {value}
              </p>
              <p className="text-xs md:text-sm font-medium text-gray-600 truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case "positive":
        case "score_awarded":
          return (
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          );
        case "negative":
          return (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            </div>
          );
        default:
          return (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
          );
      }
    };

    const getPointsColor = () => {
      return (activity.points || 0) > 0
        ? "text-emerald-700 bg-emerald-100"
        : "text-red-700 bg-red-100";
    };

    return (
      <div className="group flex items-start space-x-3 md:space-x-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
        {getActivityIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {activity.description || activity.message}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">
            {activity.detail || activity.reason}
          </p>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-xs text-gray-400">
              {activity.time || "Recently"}
            </span>
            {activity.points && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getPointsColor()}`}
              >
                {activity.points > 0 ? "+" : ""}
                {activity.points} pts
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TopPerformerCard = ({ participant, index }) => {
    const rankStyle = [
      {
        gradient: "from-amber-400 to-amber-500",
        border: "border-amber-200",
        bg: "bg-amber-50",
      },
      {
        gradient: "from-gray-400 to-gray-500",
        border: "border-gray-200",
        bg: "bg-gray-50",
      },
      {
        gradient: "from-orange-400 to-orange-500",
        border: "border-orange-200",
        bg: "bg-orange-50",
      },
    ][index] || {
      gradient: "from-blue-400 to-blue-500",
      border: "border-blue-200",
      bg: "bg-blue-50",
    };

    return (
      <div
        className={`group relative p-3 md:p-4 rounded-xl border ${rankStyle.border} ${rankStyle.bg} hover:shadow-md transition-all duration-200`}
      >
        <div className="flex items-center space-x-3 md:space-x-4">
          <div
            className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r ${rankStyle.gradient} flex items-center justify-center text-white text-sm md:text-base font-bold shadow-sm flex-shrink-0`}
          >
            {index + 1}
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-3 w-3 md:h-4 md:w-4 text-amber-400 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-xs md:text-sm truncate group-hover:text-blue-600 transition-colors">
              {participant.name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {participant.department || "Participant"}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-bold text-gray-900 text-sm md:text-base">
              {(participant.totalScore || 0) > 0 ? "+" : ""}
              {participant.totalScore || 0}
            </div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 space-y-4 md:space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
            Welcome back, {userProfile?.displayName || "Admin"}! 👋
          </h1>
          <p className="text-sm md:text-base text-blue-100">
            {currentSession?.name || "Your Dashboard"}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/5 rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          icon={Users}
          title="Total Participants"
          value={participants.length}
          subtitle="Active learners"
          variant="blue"
        />
        <StatCard
          icon={BarChart3}
          title="Average Score"
          value={averageScore}
          subtitle="Team performance"
          variant="green"
        />
        <StatCard
          icon={Trophy}
          title="Highest Score"
          value={topScore}
          subtitle="Current leader"
          variant="orange"
        />
        <StatCard
          icon={Building2}
          title="Active Session"
          value={currentSession ? "1" : "0"}
          subtitle="Current session"
          variant="purple"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        {/* Top Performers */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mr-2" />
                Top Performers
              </h3>
            </div>
            <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
              {topPerformers.length > 0 ? (
                topPerformers.map((participant, index) => (
                  <TopPerformerCard
                    key={participant.id}
                    participant={participant}
                    index={index}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base">No participants yet</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-xs md:text-sm"
                    disabled={!currentSession}
                  >
                    Add your first participant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mr-2" />
                Recent Activity
              </h3>
              <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base">No recent activity</p>
                  <p className="text-xs md:text-sm mt-1">
                    Activity will appear here as participants earn points
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
          <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center">
            <Award className="h-4 w-4 md:h-5 md:w-5 text-purple-600 mr-2" />
            Recent Achievements
          </h3>
        </div>
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
          {participants.slice(0, 5).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {participants.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col items-center space-y-2 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                    {p.name.charAt(0)}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {p.totalScore || 0} points
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm md:text-base">No achievements yet</p>
              <p className="text-xs md:text-sm mt-1">
                Achievements will appear as participants excel
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddParticipantModal
        isOpen={showAddModal}
        sessionId={currentSession?.id}
        onClose={() => setShowAddModal(false)}
        onParticipantAdded={() => {}}
      />
    </div>
  );
};

export default AdminDashboard;
