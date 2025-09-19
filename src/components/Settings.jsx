import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Share2,
  Save,
  X,
  Calendar,
  Trophy,
  Sliders,
} from "lucide-react";

const Settings = ({ selectedTraining, scoringScale, setScoringScale }) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    trainingName: selectedTraining?.name || "",
    cohort: selectedTraining?.cohort || "",
    startDate: selectedTraining?.startDate || "",
    endDate: selectedTraining?.endDate || "",
    minScore: scoringScale.min,
    maxScore: scoringScale.max,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setScoringScale({ min: formData.minScore, max: formData.maxScore });
    setHasChanges(false);
    // Add success toast notification here
  };

  const handleReset = () => {
    setFormData({
      trainingName: selectedTraining?.name || "",
      cohort: selectedTraining?.cohort || "",
      startDate: selectedTraining?.startDate || "",
      endDate: selectedTraining?.endDate || "",
      minScore: scoringScale.min,
      maxScore: scoringScale.max,
    });
    setHasChanges(false);
  };

  const SettingCard = ({
    icon: Icon,
    title,
    description,
    children,
    gradient,
  }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className={`p-4 ${gradient}`}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-white/80 text-sm">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
                <SettingsIcon className="h-6 lg:h-8 w-6 lg:w-8 mr-3" />
                Settings & Configuration
              </h2>
              <p className="text-gray-100 text-base lg:text-lg">
                Manage your training session preferences and scoring rules
              </p>
            </div>

            {hasChanges && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleReset}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSave}
                  className="bg-white text-gray-800 px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white/5 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Scoring Configuration */}
        <SettingCard
          icon={Sliders}
          title="Scoring Scale"
          description="Configure point ranges for activities"
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Score
                </label>
                <input
                  type="number"
                  value={formData.minScore}
                  onChange={(e) =>
                    handleInputChange("minScore", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Score
                </label>
                <input
                  type="number"
                  value={formData.maxScore}
                  onChange={(e) =>
                    handleInputChange("maxScore", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Current Range:</strong> {formData.minScore} to +
                {formData.maxScore} points per category
              </p>
            </div>
          </div>
        </SettingCard>

        {/* Training Information */}
        <SettingCard
          icon={Trophy}
          title="Training Details"
          description="Basic information about the training session"
          gradient="bg-gradient-to-r from-green-500 to-emerald-600"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Name
              </label>
              <input
                type="text"
                value={formData.trainingName}
                onChange={(e) =>
                  handleInputChange("trainingName", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cohort
              </label>
              <input
                type="text"
                value={formData.cohort}
                onChange={(e) => handleInputChange("cohort", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Participant Registration */}
        <SettingCard
          icon={Share2}
          title="Registration Link"
          description="Share this link for participant self-registration"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <p className="text-sm text-purple-700 mb-3">
                Share this URL with participants:
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value="https://training-app.demo/register/abc123"
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-sm"
                />
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1 justify-center">
                  <Share2 className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-700 font-medium">
                Registration is currently active
              </span>
            </div>
          </div>
        </SettingCard>

        {/* Bulk Upload */}
        <SettingCard
          icon={Users}
          title="Bulk Participant Upload"
          description="Upload multiple participants via CSV file"
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors duration-300 cursor-pointer group">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4 group-hover:text-orange-500 transition-colors duration-300" />
              <p className="text-sm text-gray-600 mb-2">
                Upload CSV file with participant data
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Expected columns: Name, Email, Phone, Department
              </p>
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                Choose File
              </button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <strong>Tip:</strong> Download our CSV template to ensure proper
              formatting before uploading your participant data.
            </div>
          </div>
        </SettingCard>
      </div>

      {/* Additional Options */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Advanced Options
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600">
                  Send updates to participants
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Public Leaderboard
                </h4>
                <p className="text-sm text-gray-600">
                  Allow participants to view rankings
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-save Changes</h4>
                <p className="text-sm text-gray-600">
                  Automatically save score updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  Achievement Badges
                </h4>
                <p className="text-sm text-gray-600">
                  Show level-up notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button for Mobile */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 flex space-x-3 z-50">
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg"
          >
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
