import React, { useState, useEffect } from "react";
import {
  Trophy,
  User,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Star,
  Search,
  Filter,
  Users,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";

const Leaderboard = ({ scoringCategories }) => {
  const { currentSession } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [scoringMode, setScoringMode] = useState("individual");
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();

  // Load participants when session changes
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

  // Sort and filter participants
  const getSortedParticipants = () => {
    let sorted = [...participants];

    // Sort by selected criteria
    switch (sortBy) {
      case "score":
        sorted.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "department":
        sorted.sort((a, b) =>
          (a.department || "").localeCompare(b.department || "")
        );
        break;
      default:
        sorted.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    }

    return sorted;
  };

  const sortedParticipants = getSortedParticipants();

  // Filter participants based on search
  const filteredParticipants = sortedParticipants.filter(
    (participant) =>
      participant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-amber-600" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-500" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return {
          badge: "bg-gradient-to-r from-amber-400 to-amber-500",
          card: "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",
          glow: "shadow-amber-100",
        };
      case 1:
        return {
          badge: "bg-gradient-to-r from-gray-400 to-gray-500",
          card: "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50",
          glow: "shadow-gray-100",
        };
      case 2:
        return {
          badge: "bg-gradient-to-r from-orange-400 to-orange-500",
          card: "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50",
          glow: "shadow-orange-100",
        };
      default:
        return {
          badge: "bg-gradient-to-r from-blue-500 to-blue-600",
          card: "border-gray-200 bg-white",
          glow: "shadow-gray-100",
        };
    }
  };

  const ParticipantCard = ({ participant, index }) => {
    const positiveScore = Object.entries(participant.scores || {})
      .filter(([key]) => scoringCategories?.positive?.[key])
      .reduce((sum, [, value]) => sum + Math.max(0, value), 0);
    const negativeScore = Object.entries(participant.scores || {})
      .filter(([key]) => scoringCategories?.negative?.[key])
      .reduce((sum, [, value]) => sum + Math.min(0, value), 0);

    const isTopThree = index < 3;
    const rankStyle = getRankStyle(index);

    return (
      <div
        className={`group relative p-4 md:p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
          rankStyle.card
        } ${isTopThree ? rankStyle.glow + " shadow-lg" : ""}`}
      >
        {/* Rank Badge */}
        <div className="flex items-center space-x-3 md:space-x-4">
          <div
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white text-base md:text-lg ${rankStyle.badge} shadow-md group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
          >
            {index < 3 ? getRankIcon(index) : index + 1}
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-4 w-4 text-amber-400 fill-current animate-pulse" />
              </div>
            )}
          </div>

          {/* Participant Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <h3 className="font-bold text-gray-900 text-base md:text-lg truncate group-hover:text-blue-600 transition-colors">
                    {participant.name}
                  </h3>
                  {isTopThree && (
                    <div className="flex-shrink-0">
                      {index === 0 && (
                        <span className="text-amber-600 text-xs md:text-sm font-medium">
                          Champion
                        </span>
                      )}
                      {index === 1 && (
                        <span className="text-gray-600 text-xs md:text-sm font-medium">
                          Runner-up
                        </span>
                      )}
                      {index === 2 && (
                        <span className="text-orange-600 text-xs md:text-sm font-medium">
                          Third Place
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  {participant.email}
                </p>
                {participant.department && (
                  <p className="text-xs text-gray-500 truncate">
                    {participant.department}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="text-right space-y-2 flex-shrink-0">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-bold text-base md:text-xl ${
                (participant.totalScore || 0) >= 0
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {(participant.totalScore || 0) > 0 ? "+" : ""}
              {participant.totalScore || 0}
            </div>
            <div className="flex items-center justify-end space-x-2 md:space-x-3 text-xs md:text-sm">
              <div className="flex items-center space-x-1 text-emerald-600">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4" />
                <span className="font-medium">+{positiveScore}</span>
              </div>
              <div className="flex items-center space-x-1 text-red-600">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 rotate-180" />
                <span className="font-medium">{negativeScore}</span>
              </div>
            </div>
          </div>
        </div>

        {isTopThree && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-xs md:text-sm text-gray-600">
                Level {Math.floor((participant.totalScore || 0) / 10) + 1}
              </div>
              <div className="flex items-center space-x-1 text-xs md:text-sm text-gray-500">
                <Star className="h-3 w-3 md:h-4 md:w-4" />
                <span>Top Performer</span>
              </div>
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
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center">
                <Trophy className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" />
                Leaderboard
              </h1>
              <p className="text-blue-100 text-sm md:text-base lg:text-lg">
                See who's leading the competition and celebrate achievements
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/5 rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32"></div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0 lg:space-x-4">
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

          {/* Sort Options */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A-Z</option>
                <option value="department">Department</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg text-center sm:text-left">
              {filteredParticipants.length} result
              {filteredParticipants.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
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
          <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
            <Trophy className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              No participants found
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No participants available yet"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Current Leader
          </h3>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1 truncate">
            {filteredParticipants[0]?.name || "None"}
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            {filteredParticipants[0]?.totalScore || 0} points
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Average Score
          </h3>
          <p className="text-xl md:text-2xl font-bold text-emerald-600 mb-1">
            {Math.round(
              filteredParticipants.reduce(
                (sum, p) => sum + (p.totalScore || 0),
                0
              ) / (filteredParticipants.length || 1)
            )}
          </p>
          <p className="text-xs md:text-sm text-gray-600">points average</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center group hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <User className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
            Total Participants
          </h3>
          <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
            {filteredParticipants.length}
          </p>
          <p className="text-xs md:text-sm text-gray-600">active learners</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
