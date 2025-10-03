// src/components/ParticipantDashboard.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Trophy, TrendingUp, Award, Target, Star, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { ParticipantService } from "../services/participantService";
import { SessionService } from "../services/sessionService";

const ParticipantDashboard = () => {
  const { user, userProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [myParticipantData, setMyParticipantData] = useState(null);
  const [session, setSession] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();
  const sessionService = new SessionService();

  useEffect(() => {
    loadParticipantData();
  }, [user]);

  const loadParticipantData = async () => {
    try {
      setLoading(true);

      // Get sessionId from navigation state or find user's sessions
      const sessionId = location.state?.sessionId;

      if (!sessionId) {
        // TODO: Query participant's sessions
        console.log("No session ID provided");
        setLoading(false);
        return;
      }

      // Load session data
      const sessionData = await sessionService.getSession(sessionId);
      setSession(sessionData);

      // Load all participants for leaderboard
      const participants = await participantService.getSessionParticipants(
        sessionId
      );
      setAllParticipants(participants);

      // Find current user's participant record
      const myData = participants.find((p) => p.userId === user.uid);
      setMyParticipantData(myData);
    } catch (error) {
      console.error("Error loading participant data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Session Found
          </h2>
          <p className="text-gray-600 mb-6">
            You haven't joined any sessions yet.
          </p>
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

  const myRank =
    allParticipants
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
      .findIndex((p) => p.userId === user.uid) + 1;

  const myScore = myParticipantData?.totalScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Banner */}
        {location.state?.welcomeMessage && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Welcome to {session.name}! 🎉
            </h1>
            <p className="text-green-100">
              You're all set! Start participating to earn points and climb the
              leaderboard.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {userProfile?.displayName || "Participant"}!
          </h1>
          <p className="text-blue-100">{session.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{myScore}</p>
            <p className="text-sm font-medium text-gray-600">Your Score</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">#{myRank}</p>
            <p className="text-sm font-medium text-gray-600">Your Rank</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {myScore > 0 ? "+" + myScore : myScore}
            </p>
            <p className="text-sm font-medium text-gray-600">Progress</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {allParticipants.length}
            </p>
            <p className="text-sm font-medium text-gray-600">Participants</p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Trophy className="h-5 w-5 text-amber-600 mr-2" />
              Leaderboard
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {allParticipants
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .slice(0, 10)
                .map((participant, index) => {
                  const isMe = participant.userId === user.uid;
                  return (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                        isMe
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0
                            ? "bg-gradient-to-r from-amber-400 to-amber-500"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-400 to-gray-500"
                            : index === 2
                            ? "bg-gradient-to-r from-orange-400 to-orange-500"
                            : "bg-gradient-to-r from-blue-400 to-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {participant.name}
                          {isMe && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {participant.department || "Participant"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {(participant.totalScore || 0) > 0 ? "+" : ""}
                          {participant.totalScore || 0}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
