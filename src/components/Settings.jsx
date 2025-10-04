import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Share2,
  Save,
  X,
  Calendar,
  Trophy,
  Sliders,
  Copy,
  Check,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { SessionService } from "../services/sessionService";

const Settings = () => {
  const { currentSession, refreshCurrentSession } = useSession();
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const sessionService = new SessionService();

  const [formData, setFormData] = useState({
    trainingName: "",
    cohort: "",
    startDate: "",
    endDate: "",
    minScore: -50,
    maxScore: 50,
    registrationOpen: true,
  });

  // Load session data when component mounts or session changes
  useEffect(() => {
    if (currentSession) {
      setFormData({
        trainingName: currentSession.name || "",
        cohort: currentSession.cohort || "",
        startDate: currentSession.startDate || "",
        endDate: currentSession.endDate || "",
        minScore: currentSession.scoringScale?.min || -50,
        maxScore: currentSession.scoringScale?.max || 50,
        registrationOpen: currentSession.registrationOpen ?? true,
      });
    }
  }, [currentSession]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!currentSession?.id) return;

    try {
      setSaving(true);
      await sessionService.updateSession(currentSession.id, {
        name: formData.trainingName,
        cohort: formData.cohort,
        startDate: formData.startDate,
        endDate: formData.endDate,
        scoringScale: {
          min: formData.minScore,
          max: formData.maxScore,
        },
        registrationOpen: formData.registrationOpen,
      });

      await refreshCurrentSession();
      setHasChanges(false);
      // Success notification can be added here
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (currentSession) {
      setFormData({
        trainingName: currentSession.name || "",
        cohort: currentSession.cohort || "",
        startDate: currentSession.startDate || "",
        endDate: currentSession.endDate || "",
        minScore: currentSession.scoringScale?.min || -50,
        maxScore: currentSession.scoringScale?.max || 50,
        registrationOpen: currentSession.registrationOpen ?? true,
      });
    }
    setHasChanges(false);
  };

  const copyJoinUrl = () => {
    const joinUrl = `${window.location.origin}/join/${currentSession?.joinCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-white/80 text-sm truncate">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <SettingsIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No session selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeIn p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center">
                <SettingsIcon className="h-6 lg:h-8 w-6 lg:w-8 mr-3" />
                Settings & Configuration
              </h2>
              <p className="text-gray-100 text-sm md:text-base lg:text-lg">
                Manage your training session preferences and scoring rules
              </p>
            </div>

            {hasChanges && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="bg-white/20 backdrop-blur-sm text-white px-4 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-200 flex items-center justify-center space-x-2 text-sm md:text-base"
                >
                  <X className="h-4 w-4" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-white text-gray-800 px-6 py-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg disabled:opacity-50 text-sm md:text-base"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 lg:w-64 h-32 lg:h-64 bg-white/5 rounded-full -translate-y-16 lg:-translate-y-32 translate-x-16 lg:translate-x-32"></div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Scoring Configuration */}
        <SettingCard
          icon={Sliders}
          title="Scoring Scale"
          description="Configure point ranges"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <p className="text-xs md:text-sm text-blue-700">
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
          description="Basic session information"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
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
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </SettingCard>

        {/* Participant Registration */}
        <SettingCard
          icon={Share2}
          title="Registration Link"
          description="Share this link for participants"
          gradient="bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <p className="text-xs md:text-sm text-purple-700 mb-3">
                Share this URL with participants:
              </p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="text"
                  value={`${window.location.origin}/join/${currentSession.joinCode}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs md:text-sm"
                />
                <button
                  onClick={copyJoinUrl}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1 justify-center text-sm md:text-base flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
              <span className="text-xs md:text-sm text-green-700 font-medium">
                Registration is currently{" "}
                {formData.registrationOpen ? "active" : "closed"}
              </span>
            </div>
          </div>
        </SettingCard>

        {/* Bulk Upload */}
        <SettingCard
          icon={Users}
          title="Bulk Participant Upload"
          description="Upload via CSV file"
          gradient="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 md:p-6 text-center hover:border-orange-400 transition-colors duration-300 cursor-pointer group">
              <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-4 group-hover:text-orange-500 transition-colors duration-300" />
              <p className="text-xs md:text-sm text-gray-600 mb-2">
                Upload CSV file with participant data
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Expected columns: Name, Email, Phone, Department
              </p>
              <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base">
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

      {/* Advanced Options */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Advanced Options
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 text-sm md:text-base">
                  Registration Open
                </h4>
                <p className="text-xs md:text-sm text-gray-600">
                  Allow new participants to join
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.registrationOpen}
                  onChange={(e) =>
                    handleInputChange("registrationOpen", e.target.checked)
                  }
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
            disabled={saving}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default Settings;
