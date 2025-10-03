// src/components/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Target, TrendingUp, Award, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already logged in, redirect to appropriate dashboard
  React.useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Trophy className="h-4 w-4" />
            <span>Gamified Learning Platform</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Learning with
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {" "}
              Leaderboard
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Engage, motivate, and track participants with real-time scoring,
            leaderboards, and achievement tracking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span>Get Started</span>
              <Zap className="h-5 w-5" />
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-xl font-medium transition-all border-2 border-gray-200"
            >
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mb-6">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Real-time Leaderboards
            </h3>
            <p className="text-gray-600">
              Track participant progress with live leaderboards that update
              instantly as points are awarded.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mb-6">
              <Target className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Custom Scoring
            </h3>
            <p className="text-gray-600">
              Create custom scoring categories that match your training goals
              and learning objectives.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mb-6">
              <Award className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Achievement Badges
            </h3>
            <p className="text-gray-600">
              Reward milestones with badges and levels that motivate continuous
              participation and excellence.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Create Your Session
                </h3>
                <p className="text-gray-600">
                  Set up a new learning session with custom scoring categories
                  and invite participants via a simple join link.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Track Participation
                </h3>
                <p className="text-gray-600">
                  Award points in real-time for positive behaviors like active
                  participation, punctuality, and helping others.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Watch Engagement Soar
                </h3>
                <p className="text-gray-600">
                  Participants see their progress on the leaderboard, earn
                  badges, and stay motivated to excel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Learning Experience?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join thousands of educators making learning fun and engaging.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-blue-600 px-8 py-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <span>Get Started Free</span>
            <TrendingUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
