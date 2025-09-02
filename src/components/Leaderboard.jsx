import React from 'react';
import { Trophy, User, Crown, Medal, Award, TrendingUp, Flame, Star } from 'lucide-react';

const Leaderboard = ({ 
  scoringMode, 
  setScoringMode, 
  getSortedParticipants, 
  getSortedGroups,
  scoringCategories 
}) => {
  const sortedParticipants = getSortedParticipants();
  const sortedGroups = getSortedGroups();

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1: return <Medal className="h-6 w-6 text-gray-400" />;
      case 2: return <Award className="h-6 w-6 text-orange-400" />;
      default: return null;
    }
  };

  const getRankBadge = (index) => {
    const colors = [
      'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
      'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
      'bg-gradient-to-r from-orange-400 to-orange-600 text-white',
    ];
    return colors[index] || 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
  };

  const ParticipantCard = ({ participant, index }) => {
    const positiveScore = Object.entries(participant.scores)
      .filter(([key]) => scoringCategories.positive[key])
      .reduce((sum, [, value]) => sum + Math.max(0, value), 0);
    const negativeScore = Object.entries(participant.scores)
      .filter(([key]) => scoringCategories.negative[key])
      .reduce((sum, [, value]) => sum + Math.min(0, value), 0);

    const isTopThree = index < 3;

    return (
      <div className={`relative p-6 rounded-2xl transition-all duration-300 group cursor-pointer ${
        isTopThree 
          ? 'bg-gradient-to-r from-white via-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg hover:shadow-xl' 
          : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}>
        {isTopThree && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Flame className="h-4 w-4 text-white" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rank */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(index)}`}>
              {index < 3 ? getRankIcon(index) : index + 1}
            </div>

            {/* Avatar and Info */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{participant.name}</p>
                <p className="text-sm text-gray-600">{participant.email}</p>
                <p className="text-xs text-gray-500">{participant.department}</p>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="text-right space-y-2">
            <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${
              participant.totalScore >= 0 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
            }`}>
              {participant.totalScore > 0 ? '+' : ''}{participant.totalScore}
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span>+{positiveScore}</span>
              </span>
              <span className="flex items-center space-x-1 text-red-600">
                <TrendingUp className="h-4 w-4 rotate-180" />
                <span>{negativeScore}</span>
              </span>
            </div>
          </div>
        </div>

        {isTopThree && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {index === 0 ? 'Champion' : index === 1 ? 'Runner-up' : 'Third Place'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Level {Math.floor(participant.totalScore / 10) + 1}
            </div>
          </div>
        )}
      </div>
    );
  };

  const GroupCard = ({ group, index }) => {
    const isTopThree = index < 3;

    return (
      <div className={`relative p-6 rounded-2xl transition-all duration-300 group cursor-pointer ${
        isTopThree 
          ? 'bg-gradient-to-r from-white via-purple-50 to-indigo-50 border-2 border-purple-200 shadow-lg hover:shadow-xl' 
          : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}>
        {isTopThree && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <Trophy className="h-4 w-4 text-white" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Rank */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadge(index)}`}>
              {index < 3 ? getRankIcon(index) : index + 1}
            </div>

            {/* Group Info */}
            <div>
              <p className="font-bold text-gray-900 text-lg">{group.name}</p>
              <p className="text-sm text-gray-600">{group.participantCount} members</p>
            </div>
          </div>

          {/* Score */}
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${
              group.totalScore >= 0 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
            }`}>
              {group.totalScore > 0 ? '+' : ''}{group.totalScore}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total Points</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center">
                <Trophy className="h-8 w-8 mr-3" />
                Leaderboard
              </h2>
              <p className="text-blue-100 text-lg">Who's leading the competition?</p>
            </div>
            
            {/* Mode Toggle */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-1 flex space-x-1">
              <button
                onClick={() => setScoringMode('individual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  scoringMode === 'individual' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setScoringMode('group')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  scoringMode === 'group' 
                    ? 'bg-white text-blue-600 shadow-lg' 
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Teams
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
      </div>

      {/* Leaderboard Content */}
      {scoringMode === 'individual' ? (
        <div className="space-y-4">
          {sortedParticipants.map((participant, index) => (
            <ParticipantCard key={participant.id} participant={participant} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map((group, index) => (
            <GroupCard key={group.id} group={group} index={index} />
          ))}
        </div>
      )}

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Current Leader</h3>
          <p className="text-2xl font-bold text-blue-600 mb-1">
            {scoringMode === 'individual' ? sortedParticipants[0]?.name : sortedGroups[0]?.name}
          </p>
          <p className="text-sm text-gray-600">
            {scoringMode === 'individual' ? sortedParticipants[0]?.totalScore : sortedGroups[0]?.totalScore} points
          </p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Average Score</h3>
          <p className="text-2xl font-bold text-green-600 mb-1">
            {Math.round((scoringMode === 'individual' 
              ? sortedParticipants.reduce((sum, p) => sum + p.totalScore, 0) / sortedParticipants.length
              : sortedGroups.reduce((sum, g) => sum + g.totalScore, 0) / sortedGroups.length
            ) || 0)}
          </p>
          <p className="text-sm text-gray-600">points</p>
        </div>
        
        {/* <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Competition Level</h3>
          <p className="text-2xl font-bold text-purple-600 mb-1">Intense</p>
          <p className="text-sm text-gray-600">High engagement</p>
        </div> */}
      </div>
    </div>
  );
};

export default Leaderboard;