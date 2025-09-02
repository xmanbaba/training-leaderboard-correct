import React from 'react';
import { Trophy, User } from 'lucide-react';

const Leaderboard = ({ 
  scoringMode, 
  setScoringMode, 
  getSortedParticipants, 
  getSortedGroups,
  scoringCategories 
}) => {
  const sortedParticipants = getSortedParticipants();
  const sortedGroups = getSortedGroups();

  const IndividualLeaderboard = () => (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Score</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Positive</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Negative</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {sortedParticipants.map((participant, index) => {
          const positiveScore = Object.entries(participant.scores)
            .filter(([key]) => scoringCategories.positive[key])
            .reduce((sum, [, value]) => sum + Math.max(0, value), 0);
          const negativeScore = Object.entries(participant.scores)
            .filter(([key]) => scoringCategories.negative[key])
            .reduce((sum, [, value]) => sum + Math.min(0, value), 0);
          
          return (
            <tr key={participant.id} className={index < 3 ? 'bg-yellow-50' : ''}>
              <td className="px-4 py-3">
                <div className="flex items-center">
                  {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 mr-1" />}
                  {index === 1 && <Trophy className="h-5 w-5 text-gray-400 mr-1" />}
                  {index === 2 && <Trophy className="h-5 w-5 text-orange-400 mr-1" />}
                  <span className="font-medium">{index + 1}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                    <p className="text-xs text-gray-500">{participant.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{participant.department}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                  participant.totalScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {participant.totalScore > 0 ? '+' : ''}{participant.totalScore}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-green-600">+{positiveScore}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-medium text-red-600">{negativeScore}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const GroupLeaderboard = () => (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Score</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {sortedGroups.map((group, index) => (
          <tr key={group.id} className={index < 3 ? 'bg-yellow-50' : ''}>
            <td className="px-4 py-3">
              <div className="flex items-center">
                {index === 0 && <Trophy className="h-5 w-5 text-yellow-500 mr-1" />}
                {index === 1 && <Trophy className="h-5 w-5 text-gray-400 mr-1" />}
                {index === 2 && <Trophy className="h-5 w-5 text-orange-400 mr-1" />}
                <span className="font-medium">{index + 1}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{group.name}</td>
            <td className="px-4 py-3 text-sm text-gray-900">{group.participantCount} members</td>
            <td className="px-4 py-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                group.totalScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {group.totalScore > 0 ? '+' : ''}{group.totalScore}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setScoringMode('individual')}
              className={`px-3 py-1 rounded-lg text-sm ${
                scoringMode === 'individual' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setScoringMode('group')}
              className={`px-3 py-1 rounded-lg text-sm ${
                scoringMode === 'group' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Groups
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {scoringMode === 'individual' ? <IndividualLeaderboard /> : <GroupLeaderboard />}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;