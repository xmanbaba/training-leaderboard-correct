import React from 'react';
import { Users, Share2 } from 'lucide-react';

const Settings = ({ 
  selectedTraining, 
  scoringScale, 
  setScoringScale 
}) => {
  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        </div>
        <div className="p-4 space-y-6">
          {/* Scoring Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scoring Scale
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum Score</label>
                <input
                  type="number"
                  value={scoringScale.min}
                  onChange={(e) => setScoringScale(prev => ({ 
                    ...prev, 
                    min: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Maximum Score</label>
                <input
                  type="number"
                  value={scoringScale.max}
                  onChange={(e) => setScoringScale(prev => ({ 
                    ...prev, 
                    max: parseInt(e.target.value) 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* Training Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Training Information
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Training Name</label>
                <input
                  type="text"
                  defaultValue={selectedTraining?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cohort</label>
                <input
                  type="text"
                  defaultValue={selectedTraining?.cohort || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    defaultValue={selectedTraining?.startDate || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End Date</label>
                  <input
                    type="date"
                    defaultValue={selectedTraining?.endDate || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Participant Registration */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Participant Registration
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                Share this URL for participant self-registration:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value="https://training-app.demo/register/abc123"
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-1">
                  <Share2 className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Bulk Upload */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Bulk Upload</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Upload CSV file with participant data
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Expected columns: Name, Email, Phone, Department
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Choose File
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;