// src/components/Participants.jsx - Enhanced with teams and status
import React, { useState, useEffect } from "react";
import {
  User,
  Search,
  Users,
  TrendingUp,
  Award,
  Crown,
  SlidersHorizontal,
  UserPlus,
  Wifi,
  WifiOff,
  Circle,
  Shield,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import AddParticipantModal from "./AddParticipantModal";

const Participants = ({ calculateLevel }) => {
  const { currentSession } = useSession();
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();

  // Load participants
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (updatedParticipants) => {
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

  const departments = [
    ...new Set(participants.map((p) => p.department).filter(Boolean)),
  ];
  const teams = [...new Set(participants.map((p) => p.team).filter(Boolean))];

  // Connection status badge
  const ConnectionStatusBadge = ({ status }) => {
    const statusConfig = {
      active: {
        icon: Wifi,
        color: "bg-green-100 text-green-800 border-green-200",
        dotColor: "bg-green-500",
        label: "Active",
      },
      idle: {
        icon: Circle,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        dotColor: "bg-yellow-500",
        label: "Idle",
      },
      disconnected: {
        icon: WifiOff,
        color: "bg-red-100 text-red-800 border-red-200",
        dotColor: "bg-red-500",
        label: "Disconnected",
      },
      offline: {
        icon: WifiOff,
        color: "bg-gray-100 text-gray-800 border-gray-200",
        dotColor: "bg-gray-500",
        label: "Offline",
      },
    };

    const config = statusConfig[status] || statusConfig.offline;
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}
      >
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`}
        ></div>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </div>
    );
  };

  // Filter and sort participants
  let filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.team?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || p.department === selectedDepartment;
    const matchesTeam = selectedTeam === "all" || p.team === selectedTeam;
    const matchesStatus =
      selectedStatus === "all" || p.connectionStatus === selectedStatus;
    return matchesSearch && matchesDepartment && matchesTeam && matchesStatus;
  });

  // Sort participants
  filteredParticipants = filteredParticipants.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      case "department":
        return (a.department || "").localeCompare(b.department || "");
      case "team":
        return (a.team || "").localeCompare(b.team || "");
      case "score":
      default:
        return (b.totalScore || 0) - (a.totalScore || 0);
    }
  });

  const topPerformers = participants.filter((p) => (p.totalScore || 0) > 15);
  const positiveScorers = participants.filter((p) => (p.totalScore || 0) > 0);
  const activeParticipants = participants.filter(
    (p) => p.connectionStatus === "active"
  );

  const ParticipantCard = ({ participant, index }) => {
    const rank =
      participants
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .findIndex((p) => p.id === participant.id) + 1;

    const getRankStyle = () => {
      if (rank === 1) return "from-amber-400 to-amber-500";
      if (rank <= 3) return "from-blue-400 to-blue-500";
      return "from-gray-400 to-gray-500";
    };

    return (
      <div className="group bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-3 md:space-x-4">
          {/* Rank Badge */}
          <div
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${getRankStyle()} flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
          >
            {rank}
            {rank === 1 && (
              <Crown className="absolute -top-2 -right-2 h-4 w-4 md:h-5 md:w-5 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 relative">
            <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
            {participant.isGuest && (
              <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Participant Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm md:text-base truncate">
                {participant.name}
              </h3>
              {rank <= 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800 w-fit">
                  Top {rank}
                </span>
              )}
              {participant.isGuest && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                  Guest
                </span>
              )}
            </div>
            {participant.email && (
              <p className="text-xs md:text-sm text-gray-600 truncate mb-2">
                {participant.email}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {participant.team && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <Users className="h-3 w-3 mr-1" />
                  {participant.team}
                </span>
              )}
              {participant.department && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  {participant.department}
                </span>
              )}
              <ConnectionStatusBadge
                status={participant.connectionStatus || "offline"}
              />
            </div>
          </div>

          {/* Score Display */}
          <div className="text-right flex-shrink-0">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-bold text-base md:text-lg ${
                (participant.totalScore || 0) >= 0
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {(participant.totalScore || 0) > 0 ? "+" : ""}
              {participant.totalScore || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">total points</p>
          </div>
        </div>
      </div>
    );
  };

  const StatsCard = ({
    icon: Icon,
    title,
    value,
    subtitle,
    color = "blue",
  }) => {
    const colors = {
      blue: "from-blue-500 to-blue-600",
      emerald: "from-emerald-500 to-emerald-600",
      amber: "from-amber-500 to-amber-600",
      indigo: "from-indigo-500 to-indigo-600",
      green: "from-green-500 to-green-600",
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 group hover:shadow-lg transition-all duration-300">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div
            className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r ${colors[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
          >
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div className="min-w-0">
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
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 md:px-6 py-4 md:py-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 md:h-7 md:w-7 mr-2 md:mr-3 text-blue-600" />
                Participants
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Manage training participants and track their progress
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
            >
              <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
              <span>Add Participant</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm md:text-base"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-200 text-sm md:text-base ${
                  showFilters
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A-Z</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
              </select>

              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 text-center">
                {filteredParticipants.length} result
                {filteredParticipants.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    <option value="all">All Teams</option>
                    {teams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Connection Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="idle">Idle</option>
                    <option value="disconnected">Disconnected</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatsCard
          icon={Users}
          title="Total Shown"
          value={filteredParticipants.length}
          subtitle={`of ${participants.length} total`}
          color="blue"
        />
        <StatsCard
          icon={Wifi}
          title="Active Now"
          value={activeParticipants.length}
          subtitle="connected"
          color="green"
        />
        <StatsCard
          icon={TrendingUp}
          title="Positive Scores"
          value={positiveScorers.length}
          subtitle="engaged"
          color="emerald"
        />
        <StatsCard
          icon={Award}
          title="Top Performers"
          value={topPerformers.length}
          subtitle="high achievers"
          color="amber"
        />
        <StatsCard
          icon={Users}
          title="Teams"
          value={teams.length}
          subtitle="active teams"
          color="indigo"
        />
      </div>

      {/* Participants List */}
      <div className="space-y-3 md:space-y-4">
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((participant, index) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              index={index}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
            <User className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              No participants found
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              {searchTerm ||
              selectedDepartment !== "all" ||
              selectedTeam !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first participant"}
            </p>
            {!searchTerm &&
              selectedDepartment === "all" &&
              selectedTeam === "all" && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 font-medium text-sm md:text-base"
                >
                  <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                  <span>Add First Participant</span>
                </button>
              )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Average Score
          </h3>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mb-1">
            {Math.round(
              participants.reduce((sum, p) => sum + (p.totalScore || 0), 0) /
                (participants.length || 1)
            )}
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            across all participants
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Award className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Engagement Rate
          </h3>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
            {Math.round(
              (positiveScorers.length / (participants.length || 1)) * 100
            )}
            %
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            positive participation
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Top Performer
          </h3>
          <p className="text-base md:text-lg font-bold text-amber-600 mb-1 truncate">
            {participants.sort(
              (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
            )[0]?.name || "None"}
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            {participants.sort(
              (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
            )[0]?.totalScore || 0}{" "}
            points
          </p>
        </div>
      </div>

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        sessionId={currentSession?.id}
        onParticipantAdded={() => {}}
      />
    </div>
  );
};

export default Participants;
