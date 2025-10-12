// src/components/Teams.jsx - Team management page
import React, { useState, useEffect } from "react";
import {
  UsersRound,
  Search,
  Users,
  Trophy,
  TrendingUp,
  Crown,
  SlidersHorizontal,
  UserPlus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import CreateTeamModal from "./CreateTeamModal";
import EditTeamModal from "./EditTeamModal";

const Teams = ({ calculateLevel }) => {
  const { currentSession } = useSession();
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();

  // Load participants and calculate teams
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (updatedParticipants) => {
          setParticipants(updatedParticipants);
          calculateTeams(updatedParticipants);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setParticipants([]);
      setTeams([]);
      setLoading(false);
    }
  }, [currentSession?.id]);

  const calculateTeams = (participantsList) => {
    const teamMap = new Map();

    participantsList.forEach((participant) => {
      if (participant.team) {
        if (!teamMap.has(participant.team)) {
          teamMap.set(participant.team, {
            name: participant.team,
            members: [],
            totalScore: 0,
            avgScore: 0,
          });
        }

        const team = teamMap.get(participant.team);
        team.members.push(participant);
        team.totalScore += participant.totalScore || 0;
      }
    });

    const teamsArray = Array.from(teamMap.values()).map((team) => ({
      ...team,
      avgScore:
        team.members.length > 0
          ? Math.round(team.totalScore / team.members.length)
          : 0,
      memberCount: team.members.length,
    }));

    setTeams(teamsArray);
  };

  const handleTeamClick = (teamName) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setShowEditModal(true);
  };

  const handleDeleteTeam = async (teamName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete team "${teamName}"? Members will be unassigned.`
      )
    ) {
      return;
    }

    try {
      const teamMembers = participants.filter((p) => p.team === teamName);
      await Promise.all(
        teamMembers.map((member) =>
          participantService.assignTeam(member.id, null)
        )
      );
    } catch (error) {
      console.error("Error deleting team:", error);
      alert("Failed to delete team");
    }
  };

  // Filter and sort teams
  let filteredTeams = teams.filter((team) =>
    team.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredTeams = filteredTeams.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "members":
        return b.memberCount - a.memberCount;
      case "score":
      default:
        return b.totalScore - a.totalScore;
    }
  });

  const unassignedParticipants = participants.filter((p) => !p.team);
  const totalTeams = teams.length;
  const totalAssigned = participants.filter((p) => p.team).length;
  const winningTeam = teams.sort((a, b) => b.totalScore - a.totalScore)[0];

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
      purple: "from-purple-500 to-purple-600",
      amber: "from-amber-500 to-amber-600",
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

  const TeamCard = ({ team, rank }) => {
    const isExpanded = expandedTeam === team.name;

    const getRankStyle = () => {
      if (rank === 1) return "from-amber-400 to-amber-500";
      if (rank <= 3) return "from-blue-400 to-blue-500";
      return "from-gray-400 to-gray-500";
    };

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Team Header */}
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
              {/* Rank Badge */}
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${getRankStyle()} flex items-center justify-center text-white text-sm md:text-base font-bold shadow-md flex-shrink-0`}
              >
                {rank}
                {rank === 1 && (
                  <Crown className="absolute -top-2 -right-2 h-4 w-4 md:h-5 md:w-5 text-amber-500 animate-pulse" />
                )}
              </div>

              {/* Team Icon */}
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                <UsersRound className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handleTeamClick(team.name)}
                  className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-sm md:text-base truncate text-left w-full"
                >
                  {team.name}
                </button>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                    <Users className="h-3 w-3 mr-1" />
                    {team.memberCount} members
                  </span>
                  {rank <= 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                      Top {rank}
                    </span>
                  )}
                </div>
              </div>

              {/* Score Display */}
              <div className="text-right flex-shrink-0">
                <div
                  className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-bold text-base md:text-lg ${
                    team.totalScore >= 0
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {team.totalScore > 0 ? "+" : ""}
                  {team.totalScore}
                </div>
                <p className="text-xs text-gray-500 mt-1">total points</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-2">
              <button
                onClick={() => handleEditTeam(team)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteTeam(team.name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleTeamClick(team.name)}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Team Members (Expanded) */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-sm md:text-base">
                Team Members ({team.memberCount})
              </h4>
              <div className="text-sm text-gray-600">
                Avg Score:{" "}
                <span className="font-bold text-gray-900">{team.avgScore}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {team.members
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((member, index) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm truncate">
                        {member.name}
                      </div>
                      {member.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {member.email}
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-bold ${
                        (member.totalScore || 0) >= 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.totalScore || 0}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
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
                <UsersRound className="h-6 w-6 md:h-7 md:w-7 mr-2 md:mr-3 text-indigo-600" />
                Teams
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Manage teams and track collective performance
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105 text-sm md:text-base"
            >
              <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
              <span>Create Team</span>
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
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm md:text-base"
              />
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A-Z</option>
                <option value="members">Most Members</option>
              </select>

              <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-300 text-center">
                {filteredTeams.length} team
                {filteredTeams.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          icon={UsersRound}
          title="Total Teams"
          value={totalTeams}
          subtitle="active teams"
          color="blue"
        />
        <StatsCard
          icon={Users}
          title="Assigned"
          value={totalAssigned}
          subtitle={`of ${participants.length} total`}
          color="emerald"
        />
        <StatsCard
          icon={Target}
          title="Unassigned"
          value={unassignedParticipants.length}
          subtitle="without team"
          color="purple"
        />
        {winningTeam && (
          <StatsCard
            icon={Trophy}
            title="Top Team"
            value={winningTeam.totalScore}
            subtitle={winningTeam.name}
            color="amber"
          />
        )}
      </div>

      {/* Teams List */}
      <div className="space-y-3 md:space-y-4">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team, index) => (
            <TeamCard key={team.name} team={team} rank={index + 1} />
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
            <UsersRound className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              No teams found
            </h3>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Get started by creating your first team"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 font-medium text-sm md:text-base"
              >
                <UserPlus className="h-4 w-4 md:h-5 md:w-5" />
                <span>Create First Team</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unassigned Participants */}
      {unassignedParticipants.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Unassigned Participants ({unassignedParticipants.length})
            </h3>
            <span className="text-sm text-gray-500">No team assigned</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unassignedParticipants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {participant.name}
                  </div>
                  {participant.email && (
                    <div className="text-xs text-gray-500 truncate">
                      {participant.email}
                    </div>
                  )}
                </div>
                <div className="px-2 py-1 rounded-md text-xs font-bold bg-gray-200 text-gray-600">
                  {participant.totalScore || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        sessionId={currentSession?.id}
        participants={participants}
        onTeamCreated={() => {}}
      />

      {selectedTeam && (
        <EditTeamModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeam(null);
          }}
          team={selectedTeam}
          allParticipants={participants}
          onTeamUpdated={() => {}}
        />
      )}
    </div>
  );
};

export default Teams;
