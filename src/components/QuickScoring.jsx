// QuickScoring.jsx - Enhanced with notes, activity logs, and proper team scoring
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Zap,
  Users,
  Trophy,
  Plus,
  Minus,
  Award,
  TrendingUp,
  Target,
  Search,
  Filter,
  X,
  Share2,
  Copy,
  Check,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import { SessionService } from "../services/sessionService";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_SCALE = { min: -5, max: 5 };

export default function QuickScoring({ calculateLevel }) {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const participantService = useMemo(() => new ParticipantService(), []);
  const sessionService = useMemo(() => new SessionService(), []);

  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamScores, setTeamScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [teamActivities, setTeamActivities] = useState([]);
  const [scoreNote, setScoreNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const backdropRef = useRef(null);

  // Existing state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [scoringMode, setScoringMode] = useState("individual");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Load participants, teams, and team scores
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        async (updatedParticipants) => {
          setParticipants(updatedParticipants);
          const teamData = await participantService.getSessionTeams(
            currentSession.id
          );
          setTeams(teamData);
          
          // Load team scores from session
          const scores = await sessionService.getTeamScores(currentSession.id);
          setTeamScores(scores);
          
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setParticipants([]);
      setTeams([]);
      setTeamScores({});
      setLoading(false);
    }
  }, [currentSession?.id]);

  // Load activities when participant is selected
  useEffect(() => {
    if (selectedParticipantId && currentSession?.id) {
      participantService
        .getParticipantActivities(selectedParticipantId, 20)
        .then(setActivities)
        .catch(console.error);
    }
  }, [selectedParticipantId, currentSession?.id]);

  // Load team activities when team is selected
  useEffect(() => {
    if (selectedTeam && currentSession?.id) {
      sessionService
        .getTeamActivities(currentSession.id, selectedTeam, 20)
        .then(setTeamActivities)
        .catch(console.error);
    }
  }, [selectedTeam, currentSession?.id]);

  const scoringScale = currentSession?.scoringScale || DEFAULT_SCALE;
  const scoringCategories = currentSession?.scoringCategories || {
    positive: {},
    negative: {},
  };

  const generateShareUrl = () => {
    if (!currentSession?.id) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/leaderboard/${currentSession.id}`;
  };

  const sortedParticipants = useMemo(() => {
    let list = [...participants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.department || "").toLowerCase().includes(q) ||
          (p.team || "").toLowerCase().includes(q)
      );
    }

    if (departmentFilter !== "all") {
      list = list.filter((p) => p.department === departmentFilter);
    }

    return list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [participants, searchQuery, departmentFilter]);

  // Updated to use teamScores from session
  const sortedTeams = useMemo(() => {
    return teams.map(team => ({
      ...team,
      totalScore: teamScores[team.name]?.totalScore || 0,
      scores: teamScores[team.name]?.scores || {}
    })).sort((a, b) => b.totalScore - a.totalScore);
  }, [teams, teamScores]);

  const totalPoints = useMemo(
    () => participants.reduce((s, p) => s + (p.totalScore || 0), 0),
    [participants]
  );

  const selectedParticipant = useMemo(
    () => participants.find((p) => p.id === selectedParticipantId) || null,
    [participants, selectedParticipantId]
  );

  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return null;
    return {
      name: selectedTeam,
      memberCount: participants.filter(p => p.team === selectedTeam).length,
      totalScore: teamScores[selectedTeam]?.totalScore || 0,
      scores: teamScores[selectedTeam]?.scores || {}
    };
  }, [selectedTeam, participants, teamScores]);

  const pushToast = (message, isError = false, duration = 3500) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration
    );
  };

  const handleScoreChange = async (
    participantId,
    categoryKey,
    changeAmount,
    note = ""
  ) => {
    try {
      const finalNote = note || scoreNote || "Manual scoring via Quick Scoring";
      
      await participantService.updateParticipantScore(
        participantId,
        categoryKey,
        changeAmount,
        user?.uid,
        finalNote
      );

      const p = participants.find((x) => x.id === participantId);
      const cat =
        scoringCategories.positive?.[categoryKey] ||
        scoringCategories.negative?.[categoryKey] ||
        {};
      const catName = cat.name || categoryKey;
      const isPositive = changeAmount > 0;
      pushToast(
        `${p?.name ?? "Participant"} ${
          isPositive ? "earned" : "lost"
        } ${Math.abs(changeAmount)} pts — ${catName}`
      );

      // Refresh activities
      if (selectedParticipantId === participantId) {
        const updatedActivities = await participantService.getParticipantActivities(
          participantId,
          20
        );
        setActivities(updatedActivities);
      }

      // Clear note after successful score
      setScoreNote("");
      setShowNoteField(false);
    } catch (err) {
      console.error("Failed to update score:", err);
      pushToast("Failed to update score. Try again.", true);
    }
  };

  const handleTeamScoreChange = async (teamName, categoryKey, changeAmount) => {
    try {
      const finalNote = scoreNote || "Team scoring via Quick Scoring";
      
      await sessionService.updateTeamScore(
        currentSession.id,
        teamName,
        categoryKey,
        changeAmount,
        user?.uid,
        finalNote
      );

      const cat =
        scoringCategories.positive?.[categoryKey] ||
        scoringCategories.negative?.[categoryKey] ||
        {};
      const catName = cat.name || categoryKey;
      const isPositive = changeAmount > 0;
      
      pushToast(
        `Team ${teamName} ${isPositive ? "earned" : "lost"} ${Math.abs(
          changeAmount
        )} pts — ${catName}`
      );

      // Refresh team scores and activities
      const scores = await sessionService.getTeamScores(currentSession.id);
      setTeamScores(scores);

      if (selectedTeam === teamName) {
        const updatedActivities = await sessionService.getTeamActivities(
          currentSession.id,
          teamName,
          20
        );
        setTeamActivities(updatedActivities);
      }

      // Clear note after successful score
      setScoreNote("");
      setShowNoteField(false);
    } catch (err) {
      console.error("Failed to update team score:", err);
      pushToast("Failed to update team score. Try again.", true);
    }
  };

  const handleShare = () => {
    const url = generateShareUrl();
    setShareUrl(url);
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      pushToast("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      pushToast("Failed to copy link", true);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (selectedParticipantId) setSelectedParticipantId(null);
        if (selectedTeam) setSelectedTeam(null);
        if (showShareModal) setShowShareModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedParticipantId, selectedTeam, showShareModal]);

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      setSelectedParticipantId(null);
      setSelectedTeam(null);
      setScoreNote("");
      setShowNoteField(false);
    }
  };

  const canApplyDelta = (currentScore, delta) => {
    const newScore = (currentScore || 0) + delta;
    return newScore >= scoringScale.min && newScore <= scoringScale.max;
  };

  const ScoreRow = ({
    categoryKey,
    category,
    currentScore = 0,
    isPositive,
    onScoreChange,
  }) => {
    const [inputValue, setInputValue] = useState(currentScore.toString());

    useEffect(() => {
      setInputValue(currentScore.toString());
    }, [currentScore]);

    const handleDecrement = () => {
      if (canApplyDelta(currentScore, -1)) {
        onScoreChange(categoryKey, -1);
      }
    };

    const handleIncrement = () => {
      if (canApplyDelta(currentScore, 1)) {
        onScoreChange(categoryKey, 1);
      }
    };

    const handleInputChange = (e) => {
      setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
      const numValue = parseInt(inputValue) || 0;
      const delta = numValue - currentScore;

      if (delta !== 0 && canApplyDelta(currentScore, delta)) {
        onScoreChange(categoryKey, delta);
      } else {
        setInputValue(currentScore.toString());
      }
    };

    const handleInputKeyPress = (e) => {
      if (e.key === "Enter") {
        handleInputBlur();
      }
    };

    const handleQuickAdd = () => {
      const defaultPoints = category?.points || (isPositive ? 5 : -5);
      if (canApplyDelta(currentScore, defaultPoints)) {
        onScoreChange(categoryKey, defaultPoints);
      }
    };

    const defaultPoints = category?.points || (isPositive ? 5 : -5);
    const quickAddLabel =
      defaultPoints > 0 ? `+${defaultPoints}` : `${defaultPoints}`;

    return (
      <div className="p-3 sm:p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
        <div className="font-semibold text-sm text-gray-900 mb-3">
          {category?.name || categoryKey}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleDecrement}
            disabled={!canApplyDelta(currentScore, -1)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
              canApplyDelta(currentScore, -1)
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="decrease"
          >
            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyPress={handleInputKeyPress}
            className="w-14 sm:w-16 h-8 sm:h-9 text-center font-bold text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />

          <button
            onClick={handleIncrement}
            disabled={!canApplyDelta(currentScore, 1)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold transition-all ${
              canApplyDelta(currentScore, 1)
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
            aria-label="increase"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={handleQuickAdd}
            disabled={!canApplyDelta(currentScore, defaultPoints)}
            className={`flex-1 h-8 sm:h-9 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm transition-all ${
              canApplyDelta(currentScore, defaultPoints)
                ? isPositive
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="hidden sm:inline">{quickAddLabel} Quick Add</span>
            <span className="sm:hidden">{quickAddLabel}</span>
          </button>
        </div>
      </div>
    );
  };

  const ActivityLog = ({ activities, isTeam = false }) => {
    if (!activities || activities.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No activity yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {activities.map((activity) => {
          const timestamp = activity.timestamp?.toDate?.();
          const isPositive = (activity.points || 0) > 0;
          
          return (
            <div
              key={activity.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPositive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {activity.points || 0}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {activity.category || "Score change"}
                  </span>
                </div>
                {timestamp && (
                  <span className="text-xs text-gray-500">
                    {timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {activity.reason && (
                <div className="flex items-start gap-2 mt-2 pl-8">
                  <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600 italic">
                    {activity.reason}
                  </p>
                </div>
              )}
              {timestamp && (
                <div className="text-xs text-gray-400 mt-1 pl-8">
                  {timestamp.toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const ParticipantListItem = ({ p, index }) => {
    const rank = index + 1;
    const levelInfo = (typeof calculateLevel === "function" &&
      calculateLevel(p)) || {
      title: "Level",
      level: "-",
    };

    return (
      <div
        onClick={() => setSelectedParticipantId(p.id)}
        className="cursor-pointer p-4 rounded-2xl bg-white hover:bg-gray-50 transition flex items-center justify-between gap-4 border border-gray-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {p.name}
            </div>
            <div className="text-xs text-gray-600 truncate">
              {p.department || p.team || "No department"}
            </div>
            <div className="mt-1 text-xs inline-flex items-center gap-2 bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
              <Award className="w-3 h-3" />
              <span>
                {levelInfo.title} • L{levelInfo.level}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right min-w-[88px]">
          <div
            className={`px-3 py-1 rounded-2xl font-bold ${
              (p.totalScore || 0) >= 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {(p.totalScore || 0) > 0 ? "+" : ""}
            {p.totalScore || 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">#{rank}</div>
        </div>
      </div>
    );
  };

  const TeamListItem = ({ team, index }) => {
    const rank = index + 1;

    return (
      <div
        onClick={() => setSelectedTeam(team.name)}
        className="cursor-pointer p-4 rounded-2xl bg-white hover:bg-gray-50 transition flex items-center justify-between gap-4 border border-gray-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {team.name}
            </div>
            <div className="text-xs text-gray-600">
              {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
            </div>
          </div>
        </div>

        <div className="text-right min-w-[88px]">
          <div
            className={`px-3 py-1 rounded-2xl font-bold ${
              team.totalScore >= 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {team.totalScore > 0 ? "+" : ""}
            {team.totalScore}
          </div>
          <div className="text-xs text-gray-500 mt-1">#{rank}</div>
        </div>
      </div>
    );
  };

  const departmentOptions = useMemo(
    () => [...new Set(participants.map((p) => p.department).filter(Boolean))],
    [participants]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-6">
      {/* Header - keeping existing code */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3 bg-blue-600">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Scoring</h1>
              <p className="text-sm text-gray-600">
                Award points quickly — tap to open scoring panel
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-3 border border-gray-200">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {participants.length}
                </div>
                <div className="text-xs text-gray-600">Participants</div>
              </div>
            </div>

            <div className="bg-white px-4 py-2 rounded-2xl flex items-center gap-3 border border-gray-200">
              <Trophy className="w-5 text-amber-600" />
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {totalPoints}
                </div>
                <div className="text-xs text-gray-600">Total Points</div>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mt-6 bg-white rounded-2xl p-2 border border-gray-200 inline-flex shadow-sm">
          <button
            onClick={() => setScoringMode("individual")}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              scoringMode === "individual"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <User className="w-5 h-5" />
            Individual Scoring
            {scoringMode === "individual" && (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setScoringMode("team")}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
              scoringMode === "team"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <Users className="w-5 h-5" />
            Team Scoring
            {scoringMode === "team" && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Search + Filter */}
        {scoringMode === "individual" && (
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <input
                type="text"
                placeholder="Search participants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            </div>
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="all">All Departments</option>
                {departmentOptions.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <Filter className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          {scoringMode === "individual" ? (
            sortedParticipants.length > 0 ? (
              sortedParticipants.map((p, i) => (
                <ParticipantListItem key={p.id} p={p} index={i} />
              ))
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No participants found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || departmentFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Add participants to get started"}
                </p>
              </div>
            )
          ) : sortedTeams.length > 0 ? (
            sortedTeams.map((team, i) => (
              <TeamListItem key={team.name} team={team} index={i} />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No teams found
              </h3>
              <p className="text-gray-600">
                Assign participants to teams to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Individual Scoring Drawer */}
      {selectedParticipant && (
        <div
          ref={backdropRef}
          onMouseDown={onBackdropClick}
          className="fixed inset-0 z-40 bg-black/50 flex justify-end items-stretch"
          aria-modal="true"
        >
          <div
            className="w-full md:w-[480px] max-w-full bg-white text-slate-900 p-6 overflow-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white">
                    <User className="w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedParticipant.name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {selectedParticipant.department ||
                        selectedParticipant.team ||
                        "No department"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="text-sm font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-800">
                    {(selectedParticipant.totalScore || 0) > 0
                      ? `+${selectedParticipant.totalScore}`
                      : selectedParticipant.totalScore || 0}
                  </div>
                  <div className="text-xs text-slate-500">
                    {typeof calculateLevel === "function"
                      ? (() => {
                          const li = calculateLevel(selectedParticipant);
                          if (li && typeof li === "object")
                            return `${li.title} • L${li.level}`;
                          return li ?? "";
                        })()
                      : ""}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedParticipantId(null);
                  setScoreNote("");
                  setShowNoteField(false);
                }}
                className="px-3 py-2 bg-slate-100 rounded-md text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            {/* Note Field */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <button
                onClick={() => setShowNoteField(!showNoteField)}
                className="w-full flex items-center justify-between text-sm font-medium text-blue-900 mb-2"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {showNoteField ? "Hide Note" : "Add Note (Optional)"}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    showNoteField ? "rotate-90" : ""
                  }`}
                />
              </button>
              {showNoteField && (
                <textarea
                  value={scoreNote}
                  onChange={(e) => setScoreNote(e.target.value)}
                  placeholder="Why are you awarding/deducting points?"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                    <TrendingUp /> Positive Actions
                  </h4>
                  <div className="text-xs text-slate-500">
                    +
                    {Object.entries(selectedParticipant.scores || {})
                      .filter(([k]) => scoringCategories.positive?.[k])
                      .reduce((s, [, v]) => s + Math.max(0, v), 0)}{" "}
                    pts
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(scoringCategories.positive || {}).map(
                    ([key, cat]) => (
                      <ScoreRow
                        key={key}
                        categoryKey={key}
                        category={cat}
                        currentScore={
                          (selectedParticipant.scores &&
                            selectedParticipant.scores[key]) ??
                          0
                        }
                        isPositive={true}
                        onScoreChange={(catKey, delta) =>
                          handleScoreChange(
                            selectedParticipant.id,
                            catKey,
                            delta
                          )
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <Target /> Infractions
                  </h4>
                  <div className="text-xs text-slate-500">
                    {Object.entries(selectedParticipant.scores || {})
                      .filter(([k]) => scoringCategories.negative?.[k])
                      .reduce((s, [, v]) => s + Math.min(0, v), 0)}{" "}
                    pts
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(scoringCategories.negative || {}).map(
                    ([key, cat]) => (
                      <ScoreRow
                        key={key}
                        categoryKey={key}
                        category={cat}
                        currentScore={
                          (selectedParticipant.scores &&
                            selectedParticipant.scores[key]) ??
                          0
                        }
                        isPositive={false}
                        onScoreChange={(catKey, delta) =>
                          handleScoreChange(
                            selectedParticipant.id,
                            catKey,
                            delta
                          )
                        }
                      />
                    )
                  )}
                </div>
              </div>

              {/* Activity Log */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Activity Log
                </h4>
                <ActivityLog activities={activities} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Scoring Drawer */}
      {selectedTeamData && (
        <div
          ref={backdropRef}
          onMouseDown={onBackdropClick}
          className="fixed inset-0 z-40 bg-black/50 flex justify-end items-stretch"
          aria-modal="true"
        >
          <div
            className="w-full md:w-[480px] max-w-full bg-white text-slate-900 p-6 overflow-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 flex items-center justify-center text-white">
                    <Users className="w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{selectedTeamData.name}</h3>
                    <div className="text-xs text-slate-500">
                      {selectedTeamData.memberCount} members
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 inline-block">
                    Total: {selectedTeamData.totalScore > 0 ? '+' : ''}{selectedTeamData.totalScore} pts
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setScoreNote("");
                  setShowNoteField(false);
                }}
                className="px-3 py-2 bg-slate-100 rounded-md text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-sm text-purple-900">
                <strong>Team Scoring:</strong> Points are added to the team's
                total score only. Individual member scores remain unchanged.
              </p>
            </div>

            {/* Note Field */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <button
                onClick={() => setShowNoteField(!showNoteField)}
                className="w-full flex items-center justify-between text-sm font-medium text-blue-900 mb-2"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {showNoteField ? "Hide Note" : "Add Note (Optional)"}
                </span>
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    showNoteField ? "rotate-90" : ""
                  }`}
                />
              </button>
              {showNoteField && (
                <textarea
                  value={scoreNote}
                  onChange={(e) => setScoreNote(e.target.value)}
                  placeholder="Why are you awarding/deducting points for this team?"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                    <TrendingUp /> Positive Actions
                  </h4>
                </div>
                <div className="space-y-3">
                  {Object.entries(scoringCategories.positive || {}).map(
                    ([key, cat]) => (
                      <ScoreRow
                        key={key}
                        categoryKey={key}
                        category={cat}
                        currentScore={selectedTeamData.scores[key] || 0}
                        isPositive={true}
                        onScoreChange={(catKey, delta) =>
                          handleTeamScoreChange(selectedTeamData.name, catKey, delta)
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-red-600 flex items-center gap-2">
                    <Target /> Infractions
                  </h4>
                </div>
                <div className="space-y-3">
                  {Object.entries(scoringCategories.negative || {}).map(
                    ([key, cat]) => (
                      <ScoreRow
                        key={key}
                        categoryKey={key}
                        category={cat}
                        currentScore={selectedTeamData.scores[key] || 0}
                        isPositive={false}
                        onScoreChange={(catKey, delta) =>
                          handleTeamScoreChange(selectedTeamData.name, catKey, delta)
                        }
                      />
                    )
                  )}
                </div>
              </div>

              {/* Team Activity Log */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Team Activity Log
                </h4>
                <ActivityLog activities={teamActivities} isTeam={true} />
              </div>

              {/* Team Members List */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Team Members</h4>
                <div className="space-y-2">
                  {participants
                    .filter((p) => p.team === selectedTeamData.name)
                    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {member.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.department || "No dept"}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {member.totalScore > 0 ? "+" : ""}
                          {member.totalScore || 0}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal - keeping existing */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Share Leaderboard
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share this public link to let anyone view the live leaderboard. No
              login required!
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
              <div className="text-xs text-gray-600 mb-2">
                Public Leaderboard Link
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-md shadow-md max-w-xs ${
              t.isError
                ? "bg-red-600 text-white"
                : "bg-white text-slate-900 border border-gray-200"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}