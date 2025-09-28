import React, { useState } from "react";
import {
  Plus,
  User,
  Search,
  Filter,
  Users,
  TrendingUp,
  Award,
  Crown,
  SlidersHorizontal,
  UserPlus,
} from "lucide-react";

const Participants = ({ participants, mockGroups, calculateLevel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [showFilters, setShowFilters] = useState(false);

  const departments = [...new Set(participants.map((p) => p.department))];

  // Filter and sort participants
  let filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || p.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Sort participants
  filteredParticipants = filteredParticipants.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "department":
        return a.department.localeCompare(b.department);
      case "score":
      default:
        return b.totalScore - a.totalScore;
    }
  });

  const topPerformers = participants.filter((p) => p.totalScore > 15);
  const positiveScorers = participants.filter((p) => p.totalScore > 0);

  const ParticipantCard = ({ participant, index }) => {
    const levelInfo = calculateLevel(participant);
    const group = mockGroups.find((g) =>
      g.participantIds.includes(participant.id)
    );
    const rank =
      participants
        .sort((a, b) => b.totalScore - a.totalScore)
        .findIndex((p) => p.id === participant.id) + 1;

    const getRankStyle = () => {
      if (rank === 1) return "from-amber-400 to-amber-500";
      if (rank <= 3) return "from-blue-400 to-blue-500";
      return "from-gray-400 to-gray-500";
    };

    return (
      <div className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center space-x-4">
          {/* Rank Badge */}
          <div
            className={`relative w-12 h-12 rounded-full bg-gradient-to-r ${getRankStyle()} flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300`}
          >
            {rank}
            {rank === 1 && (
              <Crown className="absolute -top-2 -right-2 h-5 w-5 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-blue-600" />
          </div>

          {/* Participant Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {participant.name}
              </h3>
              {rank <= 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                  Top {rank}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate mb-2">
              {participant.email}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                {participant.department}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-white ${levelInfo.color}`}
              >
                {levelInfo.title}
              </span>
              {group && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                  {group.name}
                </span>
              )}
            </div>
          </div>

          {/* Score Display */}
          <div className="text-right">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${
                participant.totalScore >= 0
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {participant.totalScore > 0 ? "+" : ""}
              {participant.totalScore}
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
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 group hover:shadow-lg transition-all duration-300">
        <div className="flex items-center space-x-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colors[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-6 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-7 w-7 mr-3 text-blue-600" />
                Participants
              </h1>
              <p className="text-gray-600 mt-1">
                Manage training participants and track their progress
              </p>
            </div>
            <button className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105">
              <UserPlus className="h-5 w-5" />
              <span>Add Participant</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A-Z</option>
                <option value="department">Department</option>
              </select>

              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300">
                {filteredParticipants.length} results
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Performance
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Performers</option>
                    <option value="top">Top Performers</option>
                    <option value="positive">Positive Scores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Teams</option>
                    {mockGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          title="Total Shown"
          value={filteredParticipants.length}
          subtitle={`of ${participants.length} participants`}
          color="blue"
        />
        <StatsCard
          icon={TrendingUp}
          title="Positive Scores"
          value={positiveScorers.length}
          subtitle="participants engaged"
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
          icon={Crown}
          title="Teams Active"
          value={mockGroups.length}
          subtitle="collaborative groups"
          color="indigo"
        />
      </div>

      {/* Participants List */}
      <div className="space-y-4">
        {filteredParticipants.length > 0 ? (
          filteredParticipants.map((participant, index) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              index={index}
            />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No participants found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedDepartment !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first participant"}
            </p>
            {!searchTerm && selectedDepartment === "all" && (
              <button className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium">
                <UserPlus className="h-5 w-5" />
                <span>Add First Participant</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Average Score</h3>
          <p className="text-2xl font-bold text-emerald-600 mb-1">
            {Math.round(
              participants.reduce((sum, p) => sum + p.totalScore, 0) /
                (participants.length || 1)
            )}
          </p>
          <p className="text-sm text-gray-600">across all participants</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Award className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Engagement Rate</h3>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {Math.round(
              (positiveScorers.length / (participants.length || 1)) * 100
            )}
            %
          </p>
          <p className="text-sm text-gray-600">positive participation</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Top Performer</h3>
          <p className="text-lg font-bold text-amber-600 mb-1 truncate">
            {participants.sort((a, b) => b.totalScore - a.totalScore)[0]
              ?.name || "None"}
          </p>
          <p className="text-sm text-gray-600">
            {participants.sort((a, b) => b.totalScore - a.totalScore)[0]
              ?.totalScore || 0}{" "}
            points
          </p>
        </div>
      </div>
    </div>
  );
};

export default Participants;
