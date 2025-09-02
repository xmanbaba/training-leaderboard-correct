import React, { useState } from 'react';
import { User, Plus, Minus, Zap, Target, Award, TrendingUp, Sparkles, Crown, Flame } from 'lucide-react';

const QuickScoring = ({ 
  participants, 
  scoringCategories, 
  scoringScale, 
  updateParticipantScore 
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [recentScores, setRecentScores] = useState([]);

  const handleScoreUpdate = (participantId, categoryKey, change, isPositive) => {
    updateParticipantScore(participantId, categoryKey, change);
    
    // Add to recent scores for animation
    const participant = participants.find(p => p.id === participantId);
    const category = isPositive ? scoringCategories.positive[categoryKey] : scoringCategories.negative[categoryKey];
    
    const recentScore = {
      id: Date.now(),
      participantName: participant.name,
      categoryName: category.name,
      change: change,
      isPositive: change > 0
    };
    
    setRecentScores(prev => [recentScore, ...prev.slice(0, 4)]);
    
    // Remove after animation
    setTimeout(() => {
      setRecentScores(prev => prev.filter(score => score.id !== recentScore.id));
    }, 3000);
  };

  const ScoreButton = ({ onClick, disabled, type, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 transform hover:scale-110 active:scale-95 ${
        type === 'positive' 
          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl' 
          : 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg hover:shadow-xl'
      } ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
    >
      {children}
    </button>
  );

  const CategoryCard = ({ categoryKey, category, participantId, currentScore, isPositive }) => {
    const participant = participants.find(p => p.id === participantId);
    
    return (
      <div className={`relative group p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 cursor-pointer ${
        isPositive 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300' 
          : 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-300'
      }`}>
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
            isPositive 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
              : 'bg-gradient-to-r from-red-400 to-pink-500'
          }`}>
            <category.icon className="h-6 w-6 text-white" />
          </div>
          
          <h4 className="font-bold text-gray-900 mb-2 text-sm">{category.name}</h4>
          
          <div className="flex items-center justify-center space-x-2 mb-3">
            <ScoreButton
              onClick={() => handleScoreUpdate(participantId, categoryKey, isPositive ? -1 : 1, isPositive)}
              disabled={currentScore <= scoringScale.min}
              type={isPositive ? 'negative' : 'positive'}
            >
              <Minus className="h-4 w-4" />
            </ScoreButton>
            
            <div className={`w-12 h-8 rounded-lg flex items-center justify-center font-bold text-lg ${
              currentScore > 0 
                ? 'bg-green-100 text-green-800' 
                : currentScore < 0 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {currentScore || 0}
            </div>
            
            <ScoreButton
              onClick={() => handleScoreUpdate(participantId, categoryKey, isPositive ? 1 : -1, isPositive)}
              disabled={currentScore >= scoringScale.max}
              type={isPositive ? 'positive' : 'negative'}
            >
              <Plus className="h-4 w-4" />
            </ScoreButton>
          </div>
          
          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isPositive 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-400 to-pink-500'
              }`}
              style={{ 
                width: `${Math.max(0, Math.min(100, ((currentScore || 0) + Math.abs(scoringScale.min)) / (scoringScale.max - scoringScale.min) * 100))}%` 
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const ParticipantCard = ({ participant }) => {
    const isTopPerformer = participant.totalScore > 15;
    const rank = participants
      .sort((a, b) => b.totalScore - a.totalScore)
      .findIndex(p => p.id === participant.id) + 1;

    return (
      <div className={`relative bg-white rounded-3xl p-6 border-2 transition-all duration-500 hover:shadow-2xl ${
        selectedParticipant === participant.id 
          ? 'border-blue-400 shadow-2xl scale-105 bg-gradient-to-br from-blue-50 to-indigo-50' 
          : 'border-gray-200 hover:border-blue-300 hover:scale-102'
      }`}>
        
        {/* Top performer badge */}
        {isTopPerformer && (
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Crown className="h-6 w-6 text-white" />
          </div>
        )}

        {/* Rank badge */}
        <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
          rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
          rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
          rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
          'bg-gradient-to-r from-blue-400 to-blue-600'
        }`}>
          {rank}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              {participant.totalScore > 20 && (
                <div className="absolute -top-1 -right-1">
                  <Flame className="h-6 w-6 text-orange-500 animate-bounce" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-900">{participant.name}</h3>
              <p className="text-gray-600 text-sm">{participant.department}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">Level {Math.floor(participant.totalScore / 10) + 1}</span>
                <div className="w-12 h-1 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(participant.totalScore % 10) * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-4 py-2 rounded-2xl font-bold text-2xl shadow-lg ${
              participant.totalScore >= 0 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
            }`}>
              {participant.totalScore > 0 ? '+' : ''}{participant.totalScore}
            </div>
            <p className="text-sm text-gray-500 mt-1">Total Points</p>
          </div>
        </div>
        
        {/* Positive Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-green-700 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Positive Actions
            </h4>
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              +{Object.entries(participant.scores)
                .filter(([key]) => scoringCategories.positive[key])
                .reduce((sum, [, value]) => sum + Math.max(0, value), 0)} pts
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.entries(scoringCategories.positive).map(([key, category]) => (
              <CategoryCard
                key={key}
                categoryKey={key}
                category={category}
                participantId={participant.id}
                currentScore={participant.scores[key]}
                isPositive={true}
              />
            ))}
          </div>
        </div>

        {/* Negative Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-red-700 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Infractions
            </h4>
            <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
              {Object.entries(participant.scores)
                .filter(([key]) => scoringCategories.negative[key])
                .reduce((sum, [, value]) => sum + Math.min(0, value), 0)} pts
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(scoringCategories.negative).map(([key, category]) => (
              <CategoryCard
                key={key}
                categoryKey={key}
                category={category}
                participantId={participant.id}
                currentScore={participant.scores[key]}
                isPositive={false}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center">
                <Zap className="h-8 w-8 mr-3" />
                Quick Scoring
              </h2>
              <p className="text-purple-100 text-lg">Award points instantly and see the magic happen!</p>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">{participants.length}</div>
                <div className="text-sm text-purple-100">Participants</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 text-center">
                <div className="text-2xl font-bold">
                  {participants.reduce((sum, p) => sum + p.totalScore, 0)}
                </div>
                <div className="text-sm text-purple-100">Total Points</div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
      </div>

      {/* Recent Scores Animation */}
      {recentScores.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {recentScores.map((score) => (
            <div
              key={score.id}
              className={`animate-slideIn p-3 rounded-xl shadow-lg border-l-4 ${
                score.isPositive 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                {score.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                )}
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {score.participantName} {score.isPositive ? 'earned' : 'lost'} {Math.abs(score.change)} pts
                  </p>
                  <p className="text-xs text-gray-600">{score.categoryName}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Grid */}
      <div className="space-y-8">
        {participants
          .sort((a, b) => b.totalScore - a.totalScore)
          .map((participant) => (
            <ParticipantCard key={participant.id} participant={participant} />
          ))}
      </div>

      {/* Floating Action Summary */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Quick Stats</p>
              <p className="text-sm text-gray-600">
                Avg: {Math.round(participants.reduce((sum, p) => sum + p.totalScore, 0) / participants.length)} pts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickScoring;