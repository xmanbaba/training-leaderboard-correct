// src/components/Auth/Home.jsx
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Trophy, Users, BarChart3, Star } from "lucide-react";

const Home = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { user, loading } = useAuth();

  // Redirect if already authenticated - CHANGE THIS
  if (user && !loading) {
    return <Navigate to="/sessions" replace />; // Changed from "/" to "/sessions"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white transform translate-x-48 -translate-y-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white transform -translate-x-32 translate-y-32"></div>
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Trophy className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Training Leaderboard</h1>
                <p className="text-blue-100 text-sm">
                  Empowering Learning Excellence
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Engage Participants</h3>
                  <p className="text-blue-100 text-sm">
                    Foster active participation through gamified scoring and
                    real-time feedback
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Track Progress</h3>
                  <p className="text-blue-100 text-sm">
                    Monitor individual and team performance with detailed
                    analytics
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Celebrate Success</h3>
                  <p className="text-blue-100 text-sm">
                    Recognize achievements and motivate continued excellence
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Quote */}
          <div className="relative z-10">
            <blockquote className="text-lg italic mb-4">
              "Transform your training sessions into engaging, competitive
              experiences that drive real results."
            </blockquote>
            <p className="text-blue-200">- Trusted by educators worldwide</p>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
          <div className="max-w-md w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Training Leaderboard
              </h1>
            </div>

            {/* Auth Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  isLogin
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  !isLogin
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Forms */}
            {isLogin ? <LoginForm /> : <RegisterForm />}

            {/* Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              {isLogin ? (
                <p>
                  New to Training Leaderboard?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
