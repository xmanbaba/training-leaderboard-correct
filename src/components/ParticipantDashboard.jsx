// src/components/ParticipantDashboard.jsx - Fixed for real-time data
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, TrendingUp, Award, Target, Star, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";

const ParticipantDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { currentSession } = useSession();

  const [myParticipantData, setMyParticipantData] = useState(null);
  const [allParticipants, setAllParticipants] = useState([]);
  const [loading, setLoading] = useState(true);

  const participantService = new ParticipantService();

  // Real-time subscription to participants
  useEffect(() => {
    if (currentSession?.id && user?.uid) {
      console.log(
        "Participant Dashboard - Loading data for session:",
        currentSession.id,
        "user:",
        user.uid
      );
      setLoading(true);

      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (participants) => {
          console.log(
            "Participant Dashboard - Loaded participants:",
            participants.length
          );
          setAllParticipants(participants);

          // Find current user's participant record
          const myData = participants.find((p) => p.userId === user.uid);
          console.log("Participant Dashboard - My data:", myData);
          setMyParticipantData(myData);

          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      setAllParticipants([]);
      setMyParticipantData(null);
      setLoading(false);
    }
  }, [currentSession?.id, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
          <Trophy className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            No Session Selected
          </h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">
            Please select a session to view your dashboard.
          </p>
          <button
            onClick={() => navigate("/sessions")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Select Session
          </button>
        </div>
      </div>
    );
  }

  // Calculate user's rank
  const sortedParticipants = [...allParticipants].sort(
    (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
  );
  const myRank = sortedParticipants.findIndex((p) => p.userId === user.uid) + 1;
  const myScore = myParticipantData?.totalScore || 0;

  // Calculate average score
  const averageScore =
    allParticipants.length > 0
      ? Math.round(
          allParticipants.reduce((sum, p) => sum + (p.totalScore || 0), 0) /
            allParticipants.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back,{" "}
            {userProfile?.displayName ||
              myParticipantData?.name ||
              "Participant"}
            ! 👋
          </h1>
          <p className="text-sm md:text-base text-blue-100">
            {currentSession.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {/* Your Score */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {myScore > 0 ? "+" : ""}
              {myScore}
            </p>
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Your Score
            </p>
          </div>

          {/* Your Rank */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {myRank > 0 ? `#${myRank}` : "-"}
            </p>
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Your Rank
            </p>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {averageScore}
            </p>
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Average Score
            </p>
          </div>

          {/* Total Participants */}
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {allParticipants.length}
            </p>
            <p className="text-xs md:text-sm font-medium text-gray-600">
              Participants
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <h3 className="text-base md:text-lg font-bold text-gray-900 flex items-center">
              <Trophy className="h-4 w-4 md:h-5 md:w-5 text-amber-600 mr-2" />
              Top Performers
            </h3>
          </div>
          <div className="p-4 md:p-6">
            {sortedParticipants.length > 0 ? (
              <div className="space-y-2 md:space-y-3">
                {sortedParticipants.slice(0, 10).map((participant, index) => {
                  const isMe = participant.userId === user.uid;
                  return (
                    <div
                      key={participant.id}
                      className={`flex items-center space-x-3 md:space-x-4 p-3 md:p-4 rounded-xl transition-all ${
                        isMe
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white text-sm md:text-base font-bold flex-shrink-0 ${
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
                        <p className="font-semibold text-gray-900 text-sm md:text-base truncate">
                          {participant.name}
                          {isMe && (
                            <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600 truncate">
                          {participant.department ||
                            participant.email ||
                            "Participant"}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900 text-sm md:text-base">
                          {(participant.totalScore || 0) > 0 ? "+" : ""}
                          {participant.totalScore || 0}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm md:text-base">No participants yet</p>
                <p className="text-xs md:text-sm mt-1">
                  Be the first to earn points!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Your Progress
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-emerald-600 mb-1">
              {myScore > 0 ? `+${myScore}` : myScore}
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              total points earned
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Percentile Rank
            </h3>
            <p className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
              {allParticipants.length > 0 && myRank > 0
                ? Math.round(
                    ((allParticipants.length - myRank + 1) /
                      allParticipants.length) *
                      100
                  )
                : 0}
              %
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              of all participants
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-center hover:shadow-lg transition-all">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <Star className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Status
            </h3>
            <p className="text-lg md:text-xl font-bold text-amber-600 mb-1">
              {myRank === 1
                ? "🏆 Leader"
                : myRank <= 3
                ? "🥈 Top 3"
                : myRank <= 10
                ? "⭐ Top 10"
                : "📈 Active"}
            </p>
            <p className="text-xs md:text-sm text-gray-600">current standing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
