// src/components/ParticipantJoin.jsx - Fixed authentication flow
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { SessionService } from "../services/sessionService";
import { ParticipantService } from "../services/participantService";
import { useAuth } from "../contexts/AuthContext";

const ParticipantJoin = () => {
  const { joinCode } = useParams();
  const navigate = useNavigate();
  const { user, userProfile, signUp, signIn } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    department: "",
    hasAccount: false,
  });

  const sessionService = new SessionService();
  const participantService = new ParticipantService();

  // Determine total steps based on auth status
  const totalSteps = user ? 2 : 3;
  const isAuthenticated = !!user;

  useEffect(() => {
    loadSession();
  }, [joinCode]);

  // Auto-populate name and email if user is already signed in
  useEffect(() => {
    if (user && userProfile) {
      setFormData((prev) => ({
        ...prev,
        name: userProfile.displayName || "",
        email: user.email || "",
      }));
    }
  }, [user, userProfile]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading session with join code:", joinCode);
      const sessionData = await sessionService.getSessionByJoinCode(joinCode);
      console.log("Session loaded:", sessionData);
      setSession(sessionData);

      // Check if max participants reached
      if (
        sessionData.maxParticipants &&
        sessionData.participantIds?.length >= sessionData.maxParticipants
      ) {
        setError("This session is full. Registration is no longer available.");
        return;
      }

      // Check if user is already a participant
      if (user) {
        const existingParticipants =
          await participantService.getSessionParticipants(sessionData.id);
        const alreadyJoined = existingParticipants.some(
          (p) => p.userId === user.uid
        );

        if (alreadyJoined) {
          setError(
            "You've already joined this session. Redirecting to dashboard..."
          );
          setTimeout(() => {
            navigate("/participant/dashboard");
          }, 2000);
          return;
        }
      }
    } catch (err) {
      console.error("Error loading session:", err);
      setError(err.message || "Invalid join code or session not found");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNextFromStep1 = () => {
    if (isAuthenticated) {
      // Skip auth step, go directly to profile completion
      setStep(2);
    } else {
      // Go to auth step
      setStep(2);
    }
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
        setError("");

        console.log("Creating new account...");
        await signUp(formData.email, formData.password, {
          displayName: formData.name,
          role: "participant",
        });

        console.log("Account created successfully");
        // Move to profile completion
        setStep(3);
      } catch (err) {
        console.error("Sign up error:", err);
        setError(err.message);
      } finally {
        setJoining(false);
      }
    } else {
      // Sign in existing user
      try {
        setJoining(true);
        setError("");

        console.log("Signing in...");
        await signIn(formData.email, formData.password);

        console.log("Signed in successfully");
        // Move to profile completion
        setStep(3);
      } catch (err) {
        console.error("Sign in error:", err);
        setError(err.message);
      } finally {
        setJoining(false);
      }
    }
  };

  const handleJoinSession = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!user) {
      setError("Please sign in first");
      return;
    }

    try {
      setJoining(true);
      setError("");

      // Create participant profile
      const participantData = {
        name: formData.name.trim(),
        email: formData.email || user.email,
        phone: formData.phone.trim() || null,
        department: formData.department.trim() || null,
        userId: user.uid,
        joinMethod: "link",
      };

      console.log("Creating participant for session:", session.id);
      await participantService.createParticipant(participantData, session.id);

      setSuccess(true);

      // Redirect to participant dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard", {
          state: { sessionId: session.id, welcomeMessage: true },
        });
      }, 2000);
    } catch (err) {
      console.error("Error joining session:", err);
      setError(err.message || "Failed to join session");
    } finally {
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading session information...</p>
        </div>
      </div>
    );
  }

  // Error state (no session loaded)
  if (error && !session) {
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

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome Aboard! 🎉
          </h2>
          <p className="text-gray-600 mb-6">
            You've successfully joined <strong>{session?.name}</strong>.
            Redirecting you to your dashboard...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-2000"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
              (stepNumber, index) => (
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
                  {index < totalSteps - 1 && (
                    <div
                      className={`w-16 h-1 mx-2 transition-colors ${
                        step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              )
            )}
          </div>
          <div className="flex justify-center mt-4 text-sm text-gray-600">
            {isAuthenticated ? (
              <div className="flex space-x-24">
                <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>
                  Session Info
                </span>
                <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>
                  Complete Profile
                </span>
              </div>
            ) : (
              <div className="flex space-x-16">
                <span className={step >= 1 ? "text-blue-600 font-medium" : ""}>
                  Session Info
                </span>
                <span className={step >= 2 ? "text-blue-600 font-medium" : ""}>
                  Account
                </span>
                <span className={step >= 3 ? "text-blue-600 font-medium" : ""}>
                  Complete Profile
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Session Information */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h1 className="text-2xl font-bold mb-2">Join Session</h1>
              <p className="text-blue-100">
                You've been invited to participate in an exciting learning
                experience!
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {session?.name}
                </h2>
                <p className="text-gray-600">{session?.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Duration
                    </p>
                    <p className="text-sm text-gray-600">
                      {session?.startDate
                        ? new Date(session.startDate).toLocaleDateString()
                        : "TBD"}{" "}
                      -
                      {session?.endDate
                        ? new Date(session.endDate).toLocaleDateString()
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
                      {session?.participantIds?.length || 0}
                      {session?.maxParticipants &&
                        ` / ${session.maxParticipants}`}{" "}
                      joined
                    </p>
                  </div>
                </div>

                {session?.cohort && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <Building className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Cohort
                      </p>
                      <p className="text-sm text-gray-600">{session.cohort}</p>
                    </div>
                  </div>
                )}

                {session?.location && (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

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

              <button
                onClick={handleNextFromStep1}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Continue to Join
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Account Creation/Login (only for unauthenticated users) */}
        {step === 2 && !isAuthenticated && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Create Account or Sign In
              </h2>

              <div className="mb-6">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
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
                    type="button"
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

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

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
                      "Sign In & Continue"
                    ) : (
                      "Create Account & Continue"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 2/3: Profile Completion (step 2 for authenticated, step 3 for new users) */}
        {((step === 2 && isAuthenticated) ||
          (step === 3 && !isAuthenticated)) && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Complete Your Profile
              </h2>

              <form onSubmit={handleJoinSession} className="space-y-4">
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

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Joining: {session?.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    You're about to join this session. You'll receive points for
                    participation and can track your progress on the
                    leaderboard!
                  </p>
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(isAuthenticated ? 1 : 2)}
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
                        Joining Session...
                      </>
                    ) : (
                      "Join Session 🚀"
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
