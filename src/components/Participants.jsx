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
} from "lucide-react";

const Participants = ({ participants, mockGroups, calculateLevel }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");

  const departments = [...new Set(participants.map((p) => p.department))];
  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "All Departments" ||
      p.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const topPerformers = participants.filter((p) => p.totalScore > 15);
  const positiveScorers = participants.filter((p) => p.totalScore > 0);

  const ParticipantCard = ({ participant }) => {
    const levelInfo = calculateLevel(participant);
    const group = mockGroups.find((g) =>
      g.participantIds.includes(participant.id)
    );
    const rank =
      participants
        .sort((a, b) => b.totalScore - a.totalScore)
        .findIndex((p) => p.id === participant.id) + 1;

    return (
      <div className="bg-white rounded-xl p-4 lg:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            {/* Rank Badge */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                rank === 1
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                  : rank <= 3
                  ? "bg-gradient-to-r from-blue-400 to-blue-600"
                  : "bg-gradient-to-r from-gray-400 to-gray-500"
              }`}
            >
              {rank}
            </div>

            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center group-hover:from-blue-200 group-hover:to-indigo-300 transition-all duration-300">
              <User className="h-6 w-6 text-blue-600" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 truncate">
                  {participant.name}
                </p>
                {rank === 1 && (
                  <Crown className="h-4 w-4 text-yellow-500 animate-pulse" />
                )}
              </div>
              <p className="text-sm text-gray-600 truncate">
                {participant.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">
                  {participant.department}
                </span>
                <span className="text-gray-300">•</span>
                <div
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${levelInfo.color} text-white`}
                >
                  {levelInfo.title}
                </div>
                {group && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-purple-600 font-medium">
                      {group.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="flex sm:flex-col items-center sm:items-end space-x-4 sm:space-x-0 sm:space-y-1">
            <div
              className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-lg transition-all duration-300 group-hover:scale-110 ${
                participant.totalScore >= 0
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {participant.totalScore > 0 ? "+" : ""}
              {participant.totalScore}
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200">
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
        <div className="px-4 lg:px-6 py-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 lg:h-8 w-6 lg:w-8 mr-3 text-blue-600" />
                Participants
              </h2>
              <p className="text-gray-600 mt-1">
                Manage training participants and track their progress
              </p>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Add Participant</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search participants by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option>All Departments</option>
                {departments.map((dept) => (
                  <option key={dept}>{dept}</option>
                ))}
              </select>
              <button className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 lg:px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-blue-600">
                {filteredParticipants.length}
              </div>
              <div className="text-sm text-gray-600">Total Shown</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-green-600">
                {positiveScorers.length}
              </div>
              <div className="text-sm text-gray-600">Positive Scores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-yellow-600">
                {topPerformers.length}
              </div>
              <div className="text-sm text-gray-600">Top Performers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl lg:text-3xl font-bold text-purple-600">
                {mockGroups.length}
              </div>
              <div className="text-sm text-gray-600">Active Teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <p className="text-gray-600">
          Showing{" "}
          <span className="font-semibold">{filteredParticipants.length}</span>{" "}
          of <span className="font-semibold">{participants.length}</span>{" "}
          participants
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option>Highest Score</option>
            <option>Lowest Score</option>
            <option>Name A-Z</option>
            <option>Name Z-A</option>
            <option>Department</option>
          </select>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="space-y-4">
        {filteredParticipants
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((participant) => (
            <ParticipantCard key={participant.id} participant={participant} />
          ))}
      </div>

      {/* Empty State */}
      {filteredParticipants.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No participants found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedDepartment !== "All Departments"
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first participant"}
          </p>
          {!searchTerm && selectedDepartment === "All Departments" && (
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl hover:scale-105">
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add First Participant</span>
            </button>
          )}
        </div>
      )}

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Average Score</h3>
          <p className="text-2xl font-bold text-green-600 mb-1">
            {Math.round(
              participants.reduce((sum, p) => sum + p.totalScore, 0) /
                participants.length || 0
            )}
          </p>
          <p className="text-sm text-gray-600">across all participants</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Award className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Engagement Rate</h3>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {Math.round((positiveScorers.length / participants.length) * 100)}%
          </p>
          <p className="text-sm text-gray-600">
            participants with positive scores
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Top Performer</h3>
          <p className="text-lg font-bold text-yellow-600 mb-1 truncate">
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
