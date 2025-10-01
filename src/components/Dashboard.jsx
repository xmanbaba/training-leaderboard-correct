// Dashboard.jsx - Fixed version with proper session management
import React, { useState, useEffect } from "react";
import {
  Users,
  BarChart3,
  Trophy,
  Building2,
  TrendingUp,
  Clock,
  Target,
  Star,
  Award,
  Activity,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ParticipantService } from "../services/participantService";
import { SessionService } from "../services/sessionService";
import AddParticipantModal from "./AddParticipantModal";
import CreateSessionModal from "./CreateSessionModal";

const Dashboard = ({ mockGroups = [], getSortedParticipants }) => {
  const { userProfile } = useAuth();

  /* ---------- State ---------- */
  const [participants, setParticipants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const participantService = new ParticipantService();
  const sessionService = new SessionService();

  /* ---------- Load sessions on mount ---------- */
  useEffect(() => {
    if (userProfile?.uid) {
      loadSessions();
    }
  }, [userProfile]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading sessions for user:", userProfile?.uid);
      const adminSessions = await sessionService.getAdminSessions(
        userProfile?.uid
      );

      console.log("Loaded sessions:", adminSessions);
      setSessions(adminSessions);

      // Auto-select first session or restore last selected
      if (adminSessions.length > 0) {
        const lastSessionId = localStorage.getItem("lastSessionId");
        const sessionToSelect = lastSessionId
          ? adminSessions.find((s) => s.id === lastSessionId) ||
            adminSessions[0]
          : adminSessions[0];

        setCurrentSession(sessionToSelect);
        console.log("Selected session:", sessionToSelect);
      } else {
        setCurrentSession(null);
        console.log("No sessions found");
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError("Failed to load sessions. Please try again.");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Real-time participants ---------- */
  useEffect(() => {
    if (currentSession) {
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (updatedParticipants) => setParticipants(updatedParticipants)
      );
      return () => unsubscribe();
    }
  }, [currentSession]);

  /* ---------- Real-time activities ---------- */
  useEffect(() => {
    if (participantService.subscribeToRecentActivities && currentSession) {
      const unsubscribe = participantService.subscribeToRecentActivities(
        currentSession.id,
        (activities) => setRecentActivities(activities)
      );
      return () => unsubscribe();
    } else {
      // fallback mock data
      setRecentActivities([
        {
          id: 1,
          message: "Sarah Johnson earned points",
          detail: "Perfect attendance streak",
          time: "2 min ago",
          type: "positive",
          points: 5,
          participant: "Sarah Johnson",
        },
        {
          id: 2,
          message: "David Kim lost points",
          detail: "Late arrival",
          time: "5 min ago",
          type: "negative",
          points: -3,
          participant: "David Kim",
        },
        {
          id: 3,
          message: "Team Alpha milestone",
          detail: "Project completed successfully",
          time: "10 min ago",
          type: "achievement",
          points: 10,
          participant: "Team Alpha",
        },
        {
          id: 4,
          message: "Mike Chen achievement",
          detail: "Question Master badge earned",
          time: "15 min ago",
          type: "badge",
          points: 15,
          participant: "Mike Chen",
        },
      ]);
    }
  }, [currentSession]);

  /* ---------- Helpers ---------- */
  const handleParticipantAdded = (newParticipant) => {
    console.log("New participant added:", newParticipant);
  };

  const handleSessionCreated = (newSession) => {
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSession(newSession);
  };

  /* ---------- Derived stats ---------- */
  const averageScore = Math.round(
    participants.reduce((sum, p) => sum + p.totalScore, 0) /
      (participants.length || 1)
  );
  const topScore = Math.max(0, ...participants.map((p) => p.totalScore));
  const sortedParticipants = getSortedParticipants(participants);
  const topPerformers = sortedParticipants.slice(0, 3);

  /* ---------- UI Components ---------- */
  const StatCard = ({ icon: Icon, title, value, subtitle, trend, variant }) => {
    const variants = {
      blue: "from-blue-500 to-blue-600",
      green: "from-emerald-500 to-emerald-600",
      purple: "from-indigo-500 to-indigo-600",
      orange: "from-amber-500 to-amber-600",
    };
    return (
      <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${variants[variant]} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <div className="flex items-center space-x-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="h-4 w-4" />
              <span>{trend}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case "positive":
          return (
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          );
        case "negative":
          return (
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
            </div>
          );
        case "achievement":
          return (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          );
        case "badge":
          return (
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Award className="h-4 w-4 text-amber-600" />
            </div>
          );
        default:
          return (
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-600" />
            </div>
          );
      }
    };

    const getPointsColor = () => {
      return activity.points > 0
        ? "text-emerald-700 bg-emerald-100"
        : "text-red-700 bg-red-100";
    };

    return (
      <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200">
        {getActivityIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {activity.message}
          </p>
          <p className="text-sm text-gray-500 mt-1">{activity.detail}</p>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-xs text-gray-400">{activity.time}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getPointsColor()}`}
            >
              {activity.points > 0 ? "+" : ""}
              {activity.points} pts
            </span>
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
        className={`group relative p-4 rounded-xl border ${rankStyle.border} ${rankStyle.bg} hover:shadow-md transition-all duration-200`}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`relative w-10 h-10 rounded-full bg-gradient-to-r ${rankStyle.gradient} flex items-center justify-center text-white font-bold shadow-sm`}
          >
            {index + 1}
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-4 w-4 text-amber-400 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
              {participant.name}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {participant.department}
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">
              {participant.totalScore > 0 ? "+" : ""}
              {participant.totalScore}
            </div>
            <div className="text-xs text-gray-500">points</div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              Welcome back, {userProfile?.displayName || "Admin"}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {currentSession
                ? `Session: ${currentSession.name}`
                : "No session selected"}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center hover:bg-white/30"
            >
              Create Session
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center hover:bg-white/30"
              disabled={!currentSession}
            >
              Add Participant
            </button>
          </div>
        </div>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title="Total Participants"
          value={participants.length}
          subtitle="Active learners"
          trend="+12%"
          variant="blue"
        />
        <StatCard
          icon={BarChart3}
          title="Average Score"
          value={averageScore}
          subtitle="Team performance"
          trend="+8%"
          variant="green"
        />
        <StatCard
          icon={Trophy}
          title="Highest Score"
          value={topScore}
          subtitle="Current leader"
          trend="+15%"
          variant="orange"
        />
        <StatCard
          icon={Building2}
          title="Active Teams"
          value={mockGroups.length}
          subtitle="Group collaborations"
          variant="purple"
        />
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Trophy className="h-5 w-5 text-amber-600 mr-2" />
                Top Performers
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {topPerformers.map((participant, index) => (
                <TopPerformerCard
                  key={participant.id}
                  participant={participant}
                  index={index}
                />
              ))}
              {topPerformers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No participants yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-2" />
                Recent Activity
              </h3>
              <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
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
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Team Progress & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Progress */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 text-indigo-600 mr-2" />
              Team Progress
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {mockGroups.map((group) => {
              const groupScore = participants
                .filter((p) => group.participantIds.includes(p.id))
                .reduce((sum, p) => sum + p.totalScore, 0);
              const progressPercentage = Math.max(
                0,
                Math.min(100, (groupScore / 50) * 100)
              );
              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {group.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {group.participantIds.length} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{groupScore}</p>
                      <p className="text-sm text-gray-500">points</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        /* Recent Achievements */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Award className="h-5 w-5 text-purple-600 mr-2" />
              Recent Achievements
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {participants.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {p.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    Achievement unlocked
                  </p>
                </div>
                <div className="text-right">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            ))}
            {participants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No achievements yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      /* Modals */
      {showAddModal && (
        <AddParticipantModal
          sessionId={currentSession?.id}
          onClose={() => setShowAddModal(false)}
          onParticipantAdded={handleParticipantAdded}
        />
      )}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={handleSessionCreated}
        />
      )}
    </div>
  );
};

export default Dashboard;
