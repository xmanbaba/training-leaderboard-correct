// src/components/CreateSessionModal.jsx - Fixed with proper scrolling
import React, { useState } from "react";
import {
  X,
  Calendar,
  Users,
  MapPin,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader,
  Trophy,
  Clock,
  Globe,
} from "lucide-react";
import { SessionService } from "../services/sessionService";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { useNavigate } from "react-router-dom";

const CreateSessionModal = ({ isOpen, onClose, onSessionCreated }) => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStep, setActiveStep] = useState(1);
  const [createdSession, setCreatedSession] = useState(null);
  const { selectSession } = useSession();
  const navigate = useNavigate();
  const { setSessions, addSession } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cohort: "",
    startDate: "",
    endDate: "",
    location: "",
    maxParticipants: "",
    isPublic: false,
    registrationOpen: true,
    template: "basic-workshop",
    scoringScale: { min: -50, max: 50 },
  });

  const sessionService = new SessionService();

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      cohort: "",
      startDate: "",
      endDate: "",
      location: "",
      maxParticipants: "",
      isPublic: false,
      registrationOpen: true,
      template: "basic-workshop",
      scoringScale: { min: -50, max: 50 },
    });
    setActiveStep(1);
    setError("");
    setSuccess("");
    setCreatedSession(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Session name is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (activeStep === 1 && validateStep1()) {
      setActiveStep(2);
    } else if (activeStep === 2) {
      handleSubmit();
    }
  };

  // Around line 116, update the createSession call:
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");

      if (!userProfile?.uid) {
        throw new Error("User profile not found. Please try signing in again.");
      }

      const templates = sessionService.getSessionTemplates();
      const selectedTemplate = templates.find(
        (t) => t.id === formData.template
      );

      const sessionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        cohort: formData.cohort.trim() || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        location: formData.location.trim() || null,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : null,
        isPublic: formData.isPublic,
        registrationOpen: formData.registrationOpen,
        scoringCategories: selectedTemplate?.scoringCategories || {
          positive: {
            participation: {
              name: "Active Participation",
              icon: "MessageSquare",
              points: 5,
            },
            punctuality: { name: "Punctuality", icon: "Clock", points: 3 },
            helpfulness: { name: "Helping Others", icon: "Users", points: 4 },
            excellence: { name: "Excellence", icon: "Star", points: 10 },
          },
          negative: {
            disruption: {
              name: "Disruption",
              icon: "AlertTriangle",
              points: -5,
            },
            lateness: { name: "Late Arrival", icon: "Clock", points: -2 },
            absence: { name: "Unexcused Absence", icon: "X", points: -10 },
          },
        },
        scoringScale: formData.scoringScale,
      };

      console.log("Creating session with admin ID:", userProfile.uid);

      // PASS USER DATA AS THIRD PARAMETER
      const newSession = await sessionService.createSession(
        sessionData,
        userProfile.uid,
        userProfile
      );

      // ✅ Inject immediately into context
      addSession(newSession);

      // ✅ Go to the correct route
      navigate(`/session/${newSession.id}/dashboard`);

      console.log("Session created successfully:", newSession);
      setCreatedSession(newSession);
      setSuccess("Session created successfully!");
      setActiveStep(3);

      if (onSessionCreated) {
        onSessionCreated(newSession);
      }
    } catch (err) {
      console.error("Error creating session:", err);
      setError(err.message || "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const copyJoinUrl = async () => {
    if (createdSession) {
      const joinUrl = `${window.location.origin}/join/${createdSession.joinCode}`;
      try {
        await navigator.clipboard.writeText(joinUrl);
        setSuccess("Join URL copied to clipboard!");
        setTimeout(() => setSuccess(""), 3000);
      } catch {
        const textArea = document.createElement("textarea");
        textArea.value = joinUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setSuccess("Join URL copied to clipboard!");
        setTimeout(() => setSuccess(""), 3000);
      }
    }
  };

  const templates = sessionService.getSessionTemplates();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[calc(100vh-4rem)]">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create Session</h2>
            <p className="text-gray-600 mt-1">
              Set up a new interactive session
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps - Fixed */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    activeStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step === 3 && activeStep >= 3 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      activeStep > step ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span
              className={activeStep >= 1 ? "text-blue-600 font-medium" : ""}
            >
              Basic Info
            </span>
            <span
              className={activeStep >= 2 ? "text-blue-600 font-medium" : ""}
            >
              Configuration
            </span>
            <span
              className={activeStep >= 3 ? "text-blue-600 font-medium" : ""}
            >
              Complete
            </span>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Step 1 */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Web Development Bootcamp 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this session is about..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cohort/Group
                  </label>
                  <input
                    type="text"
                    value={formData.cohort}
                    onChange={(e) =>
                      handleInputChange("cohort", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Spring 2024 Batch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Room 101 / Online"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Template
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                        formData.template === template.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleInputChange("template", template.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            formData.template === template.id
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {formData.template === template.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {template.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {template.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{template.duration}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>Max {template.maxParticipants}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        handleInputChange("maxParticipants", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scoring Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.scoringScale.min}
                      onChange={(e) =>
                        handleInputChange("scoringScale", {
                          ...formData.scoringScale,
                          min: parseInt(e.target.value) || -50,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Min"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="number"
                      value={formData.scoringScale.max}
                      onChange={(e) =>
                        handleInputChange("scoringScale", {
                          ...formData.scoringScale,
                          max: parseInt(e.target.value) || 50,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Public Session
                    </h4>
                    <p className="text-sm text-gray-600">
                      Allow public discovery and registration
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        handleInputChange("isPublic", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Registration Open
                    </h4>
                    <p className="text-sm text-gray-600">
                      Allow new participants to join
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.registrationOpen}
                      onChange={(e) =>
                        handleInputChange("registrationOpen", e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {activeStep === 3 && createdSession && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Session Created! 🎉
                </h3>
                <p className="text-gray-600">
                  Your session "{createdSession.name}" is ready for
                  participants.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-medium text-blue-900 mb-4">
                  Share with Participants
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Join Code
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white border border-blue-200 rounded-lg px-4 py-3 text-center">
                        <span className="text-2xl font-bold text-blue-600 tracking-wider">
                          {createdSession.joinCode}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(createdSession.joinCode)
                        }
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Copy join code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Join URL
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/join/${createdSession.joinCode}`}
                        className="flex-1 bg-white border border-blue-200 rounded-lg px-4 py-3 text-sm"
                      />
                      <button
                        onClick={copyJoinUrl}
                        className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Copy join URL"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-blue-700">
                  <p>Participants can join by:</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Visiting the join URL directly</li>
                    <li>Entering the join code on the platform</li>
                    <li>Being added manually by an admin</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <Users className="h-4 w-4" />
                    <span>Max Participants</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {createdSession.maxParticipants || "Unlimited"}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-600 mb-1">
                    <Globe className="h-4 w-4" />
                    <span>Visibility</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {createdSession.isPublic ? "Public" : "Private"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message (non-step 3) */}
          {success && activeStep !== 3 && (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{success}</span>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="border-t border-gray-200 p-6 flex-shrink-0 bg-white">
          {activeStep === 3 ? (
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                type="button"
                onClick={
                  activeStep === 1
                    ? handleClose
                    : () => setActiveStep(activeStep - 1)
                }
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                {activeStep === 1 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={handleNextStep}
                disabled={
                  loading ||
                  (activeStep === 1 &&
                    (!formData.name.trim() || !formData.description.trim()))
                }
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>{activeStep === 2 ? "Create Session" : "Next"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSessionModal;
