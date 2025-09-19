import React, { useState } from "react";
import {
  User,
  Plus,
  Minus,
  Zap,
  Target,
  TrendingUp,
  Crown,
  Award,
} from "lucide-react";

const QuickScoring = ({
  participants,
  scoringCategories,
  scoringScale,
  updateParticipantScore,
  calculateLevel,
}) => {
  const [recentScores, setRecentScores] = useState([]);

  const handleScoreUpdate = (
    participantId,
    categoryKey,
    change,
    isPositive
  ) => {
    updateParticipantScore(participantId, categoryKey, change);

    // Add to recent scores for feedback
    const participant = participants.find((p) => p.id === participantId);
    const category = isPositive
      ? scoringCategories.positive[categoryKey]
      : scoringCategories.negative[categoryKey];

    const recentScore = {
      id: Date.now(),
      participantName: participant.name,
      categoryName: category.name,
      change: change,
      isPositive: change > 0,
    };

    setRecentScores((prev) => [recentScore, ...prev.slice(0, 4)]);

    // Remove after animation
    setTimeout(() => {
      setRecentScores((prev) =>
        prev.filter((score) => score.id !== recentScore.id)
      );
    }, 3000);
  };

  const ScoreButton = ({ onClick, disabled, type, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110 active:scale-95 ${
        type === "positive"
          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700"
          : "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-700"
      } ${disabled ? "opacity-50 cursor-not-allowed hover:scale-100" : ""}`}
    >
      {children}
    </button>
  );

  const CategoryCard = ({
    categoryKey,
    category,
    participantId,
    currentScore,
    isPositive,
  }) => {
    return (
      <div
        className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
          isPositive
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300"
            : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-300"
        }`}
      >
        <div className="text-center">
          <div
            className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
              isPositive
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gradient-to-r from-red-500 to-pink-600"
            }`}
          >
            <category.icon className="h-6 w-6 text-white" />
          </div>

          <h4 className="font-bold text-gray-900 mb-2 text-sm">
            {category.name}
          </h4>

          <div className="flex items-center justify-center space-x-2 mb-3">
            <ScoreButton
              onClick={() =>
                handleScoreUpdate(
                  participantId,
                  categoryKey,
                  isPositive ? -1 : 1,
                  isPositive
                )
              }
              disabled={currentScore <= scoringScale.min}
              type={isPositive ? "negative" : "positive"}
            >
              <Minus className="h-4 w-4" />
            </ScoreButton>

            <div
              className={`w-12 h-8 rounded-lg flex items-center justify-center font-bold text-lg border-2 ${
                currentScore > 0
                  ? "bg-green-100 text-green-800 border-green-200"
                  : currentScore < 0
                  ? "bg-red-100 text-red-800 border-red-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {currentScore || 0}
            </div>

            <ScoreButton
              onClick={() =>
                handleScoreUpdate(
                  participantId,
                  categoryKey,
                  isPositive ? 1 : -1,
                  isPositive
                )
              }
              disabled={currentScore >= scoringScale.max}
              type={isPositive ? "positive" : "negative"}
            >
              <Plus className="h-4 w-4" />
            </ScoreButton>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPositive
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-pink-600"
              }`}
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (((currentScore || 0) + Math.abs(scoringScale.min)) /
                      (scoringScale.max - scoringScale.min)) *
                      100
                  )
                )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const ParticipantCard = ({ participant }) => {
    const levelInfo = calculateLevel(participant);
    const rank =
      participants
        .sort((a, b) => b.totalScore - a.totalScore)
        .findIndex((p) => p.id === participant.id) + 1;

    return (
      <div
        className={`relative bg-white rounded-2xl p-4 lg:p-6 border-2 transition-all duration-500 hover:shadow-xl ${
          rank === 1
            ? "border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50"
            : rank <= 3
            ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50"
            : "border-gray-200 hover:border-blue-300"
        }`}
      >
        {/* Rank and achievement badges */}
        <div className="absolute -top-2 -left-2 flex space-x-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
              rank === 1
                ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                : rank === 2
                ? "bg-gradient-to-r from-gray-400 to-gray-600"
                : rank === 3
                ? "bg-gradient-to-r from-orange-400 to-orange-600"
                : "bg-gradient-to-r from-blue-400 to-blue-600"
            }`}
          >
            {rank}
          </div>
          {rank === 1 && (
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">
                {participant.name}
              </h3>
              <p className="text-gray-600 text-sm">{participant.department}</p>
              <div className="flex items-center space-x-2 mt-1">
                <div
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelInfo.color} text-white`}
                >
                  <Award className="h-3 w-3 mr-1" />
                  {levelInfo.title}
                </div>
                <span className="text-xs text-gray-500">
                  Level {levelInfo.level}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <div
              className={`inline-flex items-center px-6 py-3 rounded-2xl font-bold text-2xl shadow-lg ${
                participant.totalScore >= 0
                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-200"
                  : "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-200"
              }`}
            >
              {participant.totalScore > 0 ? "+" : ""}
              {participant.totalScore}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total Points</p>
          </div>
        </div>

        {/* Positive Categories */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h4 className="font-bold text-green-700 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Positive Actions
            </h4>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium self-start">
              +
              {Object.entries(participant.scores)
                .filter(([key]) => scoringCategories.positive[key])
                .reduce((sum, [, value]) => sum + Math.max(0, value), 0)}{" "}
              pts
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(scoringCategories.positive).map(
              ([key, category]) => (
                <CategoryCard
                  key={key}
                  categoryKey={key}
                  category={category}
                  participantId={participant.id}
                  currentScore={participant.scores[key]}
                  isPositive={true}
                />
              )
            )}
          </div>
        </div>

        {/* Negative Categories */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h4 className="font-bold text-red-700 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Infractions
            </h4>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium self-start">
              {Object.entries(participant.scores)
                .filter(([key]) => scoringCategories.negative[key])
                .reduce((sum, [, value]) => sum + Math.min(0, value), 0)}{" "}
              pts
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(scoringCategories.negative).map(
              ([key, category]) => (
                <CategoryCard
                  key={key}
                  categoryKey={key}
                  category={category}
                  participantId={participant.id}
                  currentScore={participant.scores[key]}
                  isPositive={false}
                />
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
                <Zap className="h-6 lg:h-8 w-6 lg:w-8 mr-3" />
                Quick Scoring
              </h2>
              <p className="text-purple-100 text-base lg:text-lg">
                Award points instantly and see the magic happen! ✨
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <div className="text-xl lg:text-2xl font-bold">
                  {participants.length}
                </div>
                <div className="text-xs lg:text-sm text-purple-100">
                  Participants
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <div className="text-xl lg:text-2xl font-bold">
                  {participants.reduce((sum, p) => sum + p.totalScore, 0)}
                </div>
                <div className="text-xs lg:text-sm text-purple-100">
                  Total Points
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white/5 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
      </div>

      {/* Recent Scores Feedback */}
      {recentScores.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs">
          {recentScores.map((score) => (
            <div
              key={score.id}
              className={`p-3 rounded-xl shadow-lg border-l-4 transition-all duration-300 animate-slideIn ${
                score.isPositive
                  ? "bg-green-50 border-green-500"
                  : "bg-red-50 border-red-500"
              }`}
            >
              <div className="flex items-center space-x-2">
                {score.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {score.participantName}{" "}
                    {score.isPositive ? "earned" : "lost"}{" "}
                    {Math.abs(score.change)} pts
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {score.categoryName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Grid */}
      <div className="space-y-6 lg:space-y-8">
        {participants
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((participant) => (
            <ParticipantCard key={participant.id} participant={participant} />
          ))}
      </div>
    </div>
  );
};

export default QuickScoring;
