// src/components/ParticipantJoin.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { TrainingService } from "../services/trainingService";
import { ParticipantService } from "../services/participantService";
import { useAuth } from "../contexts/AuthContext";

const ParticipantJoin = () => {
  const { joinCode } = useParams();
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();

  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Training info, 2: Account creation, 3: Profile completion

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    department: "",
    hasAccount: false,
  });

  const trainingService = new TrainingService();
  const participantService = new ParticipantService();

  useEffect(() => {
    loadTraining();
  }, [joinCode]);

  const loadTraining = async () => {
    try {
      setLoading(true);
      setError("");

      const trainingData = await trainingService.getTrainingByJoinCode(
        joinCode
      );
      setTraining(trainingData);

      // Check if max participants reached
      if (
        trainingData.maxParticipants &&
        trainingData.participantIds?.length >= trainingData.maxParticipants
      ) {
        setError(
          "This training session is full. Registration is no longer available."
        );
        return;
      }
    } catch (err) {
      setError(
        err.message || "Invalid join code or training session not found"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleAccountCreation = async (e) => {
    e.preventDefault();

    if (!formData.hasAccount) {
      // Create new account
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      try {
        setJoining(true);
        await signUp(formData.email, formData.password, {
          displayName: formData.name,
          role: "participant",
        });
        setStep(3); // Move to profile completion
      } catch (err) {
        setError(err.message);
      } finally {
        setJoining(false);
      }
    } else {
      // Sign in existing user
      try {
        setJoining(true);
        await signIn(formData.email, formData.password);
        setStep(3); // Move to profile completion
      } catch (err) {
        setError(err.message);
      } finally {
        setJoining(false);
      }
    }
  };

  const handleJoinTraining = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      setJoining(true);

      // Create participant profile
      const participantData = {
        name: formData.name.trim(),
        email: formData.email,
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        userId: user.uid,
        joinedAt: new Date(),
        joinMethod: "link",
      };

      await participantService.createParticipant(participantData, training.id);

      setSuccess(true);

      // Redirect to participant dashboard after 2 seconds
      setTimeout(() => {
        navigate("/participant/dashboard", {
          state: { trainingId: training.id, welcomeMessage: true },
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to join training session");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading training information...</p>
        </div>
      </div>
    );
  }

  if (error && !training) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Join
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome Aboard! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            You've successfully joined <strong>{training?.name}</strong>.
            Redirecting you to your dashboard...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-16 text-sm text-gray-600">
            <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>
              Training Info
            </span>
            <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>
              Account
            </span>
            <span className={step >= 3 ? "text-blue-600 font-medium" : ""}>
              Join
            </span>
          </div>
        </div>

        {/* Step 1: Training Information */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Join Training Session</h1>
              <p className="text-blue-100">
                You've been invited to participate in an exciting learning
                experience!
              </p>
            </div>

            {/* Training Details */}
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {training?.name}
                </h2>
                <p className="text-gray-600">{training?.description}</p>
              </div>

              {/* Training Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Duration
                    </p>
                    <p className="text-sm text-gray-600">
                      {training?.startDate
                        ? new Date(training.startDate).toLocaleDateString()
                        : "TBD"}{" "}
                      -
                      {training?.endDate
                        ? new Date(training.endDate).toLocaleDateString()
                        : "Ongoing"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Participants
                    </p>
                    <p className="text-sm text-gray-600">
                      {training?.participantIds?.length || 0}
                      {training?.maxParticipants &&
                        ` / ${training.maxParticipants}`}{" "}
                      joined
                    </p>
                  </div>
                </div>

                {training?.cohort && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <Building className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Cohort
                      </p>
                      <p className="text-sm text-gray-600">{training.cohort}</p>
                    </div>
                  </div>
                )}

                {training?.location && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-gray-600">
                        {training.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* What to Expect */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  What to Expect
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Interactive learning sessions with real-time participation
                      tracking
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Points-based engagement system to motivate and reward
                      active participation
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Live leaderboard to see your progress compared to other
                      participants
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      Achievement badges and level progression for milestones
                    </li>
                  </ul>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Continue to Join
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Creation/Login */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Create Account or Sign In
              </h2>

              {/* Account Type Toggle */}
              <div className="mb-6">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleInputChange("hasAccount", false)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      !formData.hasAccount
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Create New Account
                  </button>
                  <button
                    onClick={() => handleInputChange("hasAccount", true)}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      formData.hasAccount
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    I Have An Account
                  </button>
                </div>
              </div>

              <form onSubmit={handleAccountCreation} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Name (only for new accounts) */}
                {!formData.hasAccount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    minLength={6}
                  />
                </div>

                {/* Confirm Password (only for new accounts) */}
                {!formData.hasAccount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Confirm your password"
                      minLength={6}
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={joining}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                  >
                    {joining ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        {formData.hasAccount
                          ? "Signing In..."
                          : "Creating Account..."}
                      </>
                    ) : formData.hasAccount ? (
                      "Sign In"
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Profile Completion and Join */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Complete Your Profile
              </h2>

              <form onSubmit={handleJoinTraining} className="space-y-4">
                {/* Name (if not already provided) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Department (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department/Role
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Engineering, Marketing, etc."
                    />
                  </div>
                </div>

                {/* Training Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Joining: {training?.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    You're about to join this training session. You'll receive
                    points for participation and can track your progress on the
                    leaderboard!
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={joining}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
                  >
                    {joining ? (
                      <>
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Joining Training...
                      </>
                    ) : (
                      "Join Training Session 🚀"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantJoin;
