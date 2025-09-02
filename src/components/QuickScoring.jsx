import React from 'react';
import { User, Plus, Minus } from 'lucide-react';

const QuickScoring = ({ 
  participants, 
  scoringCategories, 
  scoringScale, 
  updateParticipantScore 
}) => {
  const ScoreButton = ({ onClick, disabled, type, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-6 h-6 rounded flex items-center justify-center text-xs hover:opacity-80 ${
        type === 'positive' 
          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
          : 'bg-red-100 text-red-600 hover:bg-red-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const CategoryCard = ({ categoryKey, category, participantId, currentScore, isPositive }) => (
    <div className={`border rounded p-2 text-center ${
      isPositive ? 'border-green-200' : 'border-red-200'
    }`}>
      <category.icon className={`h-4 w-4 mx-auto mb-1 ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`} />
      <p className="text-xs text-gray-700 mb-2">{category.name}</p>
      <div className="flex items-center justify-center space-x-1">
        <ScoreButton
          onClick={() => updateParticipantScore(participantId, categoryKey, isPositive ? -1 : 1)}
          disabled={currentScore <= scoringScale.min}
          type={isPositive ? 'negative' : 'positive'}
        >
          <Minus className="h-3 w-3" />
        </ScoreButton>
        <span className="w-8 text-center text-sm font-medium">
          {currentScore || 0}
        </span>
        <ScoreButton
          onClick={() => updateParticipantScore(participantId, categoryKey, isPositive ? 1 : -1)}
          disabled={currentScore >= scoringScale.max}
          type={isPositive ? 'positive' : 'negative'}
        >
          <Plus className="h-3 w-3" />
        </ScoreButton>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Quick Scoring</h2>
          <p className="text-sm text-gray-600">Click + or - to award or deduct points</p>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {participants.map(participant => (
              <div key={participant.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                      <p className="text-sm text-gray-500">{participant.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {participant.totalScore > 0 ? '+' : ''}{participant.totalScore}
                    </p>
                    <p className="text-sm text-gray-500">Total Score</p>
                  </div>
                </div>
                
                {/* Positive Categories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">Positive Actions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
                  <h4 className="text-sm font-medium text-red-700 mb-2">Infractions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickScoring;