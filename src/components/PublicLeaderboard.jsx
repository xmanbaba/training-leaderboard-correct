// src/components/PublicLeaderboard.jsx - FIXED: Updated to use separate team scores from session
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Trophy,
  User,
  Crown,
  Medal,
  Award,
  TrendingUp,
  Star,
  UsersRound,
  Download,
  Loader,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { ParticipantService } from "../services/participantService";
import { SessionService } from "../services/sessionService";
import jsPDF from "jspdf";

const PublicLeaderboard = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamScores, setTeamScores] = useState({});
  const [viewMode, setViewMode] = useState("individual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const participantService = new ParticipantService();
  const sessionService = new SessionService();

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      const unsubscribe = participantService.subscribeToSessionParticipants(
        sessionId,
        async (updatedParticipants) => {
          setParticipants(updatedParticipants);
          
          // Get team list
          const teamData = await participantService.getSessionTeams(sessionId);
          setTeams(teamData);
          
          // Load team scores from session document
          const scores = await sessionService.getTeamScores(sessionId);
          setTeamScores(scores);
          
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await sessionService.getSession(sessionId);
      setSession(sessionData);
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const sortedParticipants = [...participants].sort(
    (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
  );

  // FIXED: Use team scores from session instead of summing participant scores
  const sortedTeams = teams.map(team => ({
    ...team,
    totalScore: teamScores[team.name]?.totalScore || 0,
    scores: teamScores[team.name]?.scores || {}
  })).sort((a, b) => b.totalScore - a.totalScore);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="h-5 w-5 text-amber-600" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-500" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0:
        return {
          badge: "bg-gradient-to-r from-amber-400 to-amber-500",
          card: "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50",
        };
      case 1:
        return {
          badge: "bg-gradient-to-r from-gray-400 to-gray-500",
          card: "border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50",
        };
      case 2:
        return {
          badge: "bg-gradient-to-r from-orange-400 to-orange-500",
          card: "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50",
        };
      default:
        return {
          badge: "bg-gradient-to-r from-blue-500 to-blue-600",
          card: "border-gray-200 bg-white",
        };
    }
  };

  const downloadPDF = () => {
    try {
      setDownloading(true);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const usableWidth = pageWidth - margin * 2;
      let yPos = margin;

      // Colors
      const primaryBlue = [37, 99, 235];
      const darkGray = [31, 41, 55];
      const lightGray = [156, 163, 175];
      const gold = [245, 158, 11];
      const silver = [156, 163, 175];
      const bronze = [249, 115, 22];

      // Header with gradient effect (simulated)
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 40, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "bold");
      pdf.text(session?.name || "Leaderboard", margin, 20);

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(session?.description || "Live Rankings", margin, 30);

      yPos = 50;

      // View mode indicator
      pdf.setTextColor(...darkGray);
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      const modeText =
        viewMode === "individual" ? "Individual Rankings" : "Team Rankings";
      pdf.text(modeText, margin, yPos);

      yPos += 15;

      // Date and time
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...lightGray);
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      pdf.text(`Generated: ${dateStr}`, margin, yPos);

      yPos += 15;

      const displayData =
        viewMode === "individual" ? sortedParticipants : sortedTeams;

      // Table header
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...darkGray);

      pdf.text("Rank", margin + 5, yPos);
      pdf.text("Name", margin + 25, yPos);
      if (viewMode === "team") {
        pdf.text("Members", pageWidth - margin - 80, yPos);
      }
      pdf.text("Score", pageWidth - margin - 15, yPos, { align: "right" });

      yPos += 3;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Data rows
      displayData.forEach((item, index) => {
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        const rank = index + 1;
        const name = item.name || "Unknown";
        const score = item.totalScore || 0;

        // Rank with medal colors
        pdf.setFont("helvetica", "bold");
        if (rank === 1) pdf.setTextColor(...gold);
        else if (rank === 2) pdf.setTextColor(...silver);
        else if (rank === 3) pdf.setTextColor(...bronze);
        else pdf.setTextColor(...darkGray);

        const rankText = rank <= 3 ? `${rank}★` : rank.toString();
        pdf.text(rankText, margin + 5, yPos);

        // Name
        pdf.setFont("helvetica", rank <= 3 ? "bold" : "normal");
        pdf.setTextColor(...darkGray);
        const maxNameLength = viewMode === "team" ? 45 : 60;
        const truncatedName =
          name.length > maxNameLength
            ? name.substring(0, maxNameLength) + "..."
            : name;
        pdf.text(truncatedName, margin + 25, yPos);

        // Team-specific columns
        if (viewMode === "team") {
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(...lightGray);
          pdf.text(
            item.memberCount?.toString() || "0",
            pageWidth - margin - 80,
            yPos
          );
        }

        // Score
        pdf.setFont("helvetica", "bold");
        const scoreColor = score >= 0 ? [16, 185, 129] : [239, 68, 68];
        pdf.setTextColor(...scoreColor);
        const scoreText = score > 0 ? `+${score}` : score.toString();
        pdf.text(scoreText, pageWidth - margin - 15, yPos, { align: "right" });

        // Separator line
        pdf.setDrawColor(243, 244, 246);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPos + 3, pageWidth - margin, yPos + 3);

        yPos += 10;
      });

      // Summary section
      yPos += 10;
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPos, usableWidth, 35, "F");

      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...darkGray);
      pdf.text("Summary Statistics", margin + 5, yPos);

      yPos += 10;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const totalCount = displayData.length;
      const avgScore = Math.round(
        displayData.reduce((sum, item) => sum + (item.totalScore || 0), 0) /
          (totalCount || 1)
      );
      const leader = displayData[0]?.name || "None";
      const leaderScore = displayData[0]?.totalScore || 0;

      pdf.text(
        `Total ${
          viewMode === "individual" ? "Participants" : "Teams"
        }: ${totalCount}`,
        margin + 5,
        yPos
      );
      pdf.text(`Average Score: ${avgScore}`, margin + 70, yPos);
      yPos += 7;
      pdf.text(
        `Current Leader: ${leader} (${leaderScore} pts)`,
        margin + 5,
        yPos
      );

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(...lightGray);
      pdf.text(
        "Training Hub • Real-time Leaderboard",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );

      // Save PDF
      const filename = `${session?.name || "leaderboard"}_${viewMode}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const ParticipantCard = ({ participant, index }) => {
    const isTopThree = index < 3;
    const rankStyle = getRankStyle(index);

    return (
      <div
        className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${rankStyle.card}`}
      >
        <div className="flex items-center space-x-3 md:space-x-4">
          <div
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white text-base md:text-lg ${rankStyle.badge} shadow-md flex-shrink-0`}
          >
            {index < 3 ? getRankIcon(index) : index + 1}
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-4 w-4 text-amber-400 fill-current animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
                  {participant.name}
                </h3>
                {participant.department && (
                  <p className="text-xs md:text-sm text-gray-600 truncate">
                    {participant.department}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-bold text-base md:text-xl ${
                (participant.totalScore || 0) >= 0
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {(participant.totalScore || 0) > 0 ? "+" : ""}
              {participant.totalScore || 0}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TeamCard = ({ team, index }) => {
    const isTopThree = index < 3;
    const rankStyle = getRankStyle(index);

    return (
      <div
        className={`p-4 md:p-6 rounded-2xl border transition-all duration-300 ${rankStyle.card}`}
      >
        <div className="flex items-center space-x-3 md:space-x-4">
          <div
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white text-base md:text-lg ${rankStyle.badge} shadow-md flex-shrink-0`}
          >
            {index < 3 ? getRankIcon(index) : index + 1}
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Star className="h-4 w-4 text-amber-400 fill-current animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-100 to-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                <UsersRound className="h-5 w-5 md:h-6 md:w-6 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
                  {team.name}
                </h3>
                <p className="text-xs md:text-sm text-gray-600">
                  {team.memberCount} members
                </p>
              </div>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-bold text-base md:text-xl ${
                team.totalScore >= 0
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {team.totalScore > 0 ? "+" : ""}
              {team.totalScore}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadSession}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const displayData =
    viewMode === "individual" ? sortedParticipants : sortedTeams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white">
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 flex items-center">
                  <Trophy className="h-6 w-6 md:h-8 md:w-8 mr-2 md:mr-3" />
                  {session?.name || "Leaderboard"}
                </h1>
                <p className="text-blue-100 text-sm md:text-base lg:text-lg">
                  {session?.description ||
                    "Live rankings - updates in real-time"}
                </p>
              </div>
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-xl transition-all duration-200 font-medium text-sm md:text-base border border-white/30 disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <Loader className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 md:h-5 md:w-5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white/5 rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32"></div>
        </div>

        {/* View Mode Toggle */}
        {teams.length > 0 && (
          <div className="flex items-center justify-center">
            <div className="inline-flex bg-white rounded-xl p-1 shadow-md border border-gray-200">
              <button
                onClick={() => setViewMode("individual")}
                className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
                  viewMode === "individual"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <User className="h-4 w-4 md:h-5 md:w-5" />
                <span>Individuals</span>
              </button>
              <button
                onClick={() => setViewMode("team")}
                className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium text-sm md:text-base transition-all duration-200 ${
                  viewMode === "team"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <UsersRound className="h-4 w-4 md:h-5 md:w-5" />
                <span>Teams</span>
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Content */}
        <div className="space-y-4">
          {displayData.length > 0 ? (
            displayData.map((item, index) =>
              viewMode === "individual" ? (
                <ParticipantCard
                  key={item.id}
                  participant={item}
                  index={index}
                />
              ) : (
                <TeamCard key={item.name} team={item} index={index} />
              )
            )
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 md:p-12 text-center">
              <Trophy className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                No {viewMode === "individual" ? "participants" : "teams"} yet
              </h3>
              <p className="text-sm md:text-base text-gray-600">
                Check back soon for updates!
              </p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Current Leader
            </h3>
            <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1 truncate">
              {displayData[0]?.name || "None"}
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              {displayData[0]?.totalScore || 0} points
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Average Score
            </h3>
            <p className="text-xl md:text-2xl font-bold text-emerald-600 mb-1">
              {Math.round(
                displayData.reduce(
                  (sum, item) => sum + (item.totalScore || 0),
                  0
                ) / (displayData.length || 1)
              )}
            </p>
            <p className="text-xs md:text-sm text-gray-600">points average</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              {viewMode === "individual" ? (
                <User className="h-6 w-6 text-white" />
              ) : (
                <UsersRound className="h-6 w-6 text-white" />
              )}
            </div>
            <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">
              Total {viewMode === "individual" ? "Participants" : "Teams"}
            </h3>
            <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
              {displayData.length}
            </p>
            <p className="text-xs md:text-sm text-gray-600">
              {viewMode === "individual" ? "competing" : "in competition"}
            </p>
          </div>
        </div>

        {/* Footer Branding */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            Powered by Training Hub • Live Updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicLeaderboard;