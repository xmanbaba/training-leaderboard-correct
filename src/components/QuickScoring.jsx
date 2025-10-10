// QuickScoring.jsx - Enhanced with team scoring, sharing, and custom categories
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
  Settings,
  Download,
  ExternalLink,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import { SessionService } from "../services/sessionService";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_SCALE = { min: -5, max: 5 };

export default function QuickScoring({
  scoringCategories = { positive: {}, negative: {} },
  calculateLevel,
}) {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const participantService = useMemo(() => new ParticipantService(), []);
  const sessionService = useMemo(() => new SessionService(), []);

  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [toasts, setToasts] = useState([]);
  const backdropRef = useRef(null);

  // New state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [scoringMode, setScoringMode] = useState("individual");
  const [showCustomCategoryModal, setShowCustomCategoryModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Load participants and teams
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        async (updatedParticipants) => {
          setParticipants(updatedParticipants);
          // Load teams
          const teamData = await participantService.getSessionTeams(
            currentSession.id
          );
          setTeams(teamData);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setParticipants([]);
      setTeams([]);
      setLoading(false);
    }
  }, [currentSession?.id]);

  const scoringScale = currentSession?.scoringScale || DEFAULT_SCALE;

  // Generate public share URL
  const generateShareUrl = () => {
    if (!currentSession?.id) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/public/leaderboard/${currentSession.id}`;
  };

  // Filtered data
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

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.totalScore - a.totalScore);
  }, [teams]);

  const totalPoints = useMemo(
    () => participants.reduce((s, p) => s + (p.totalScore || 0), 0),
    [participants]
  );

  const selectedParticipant = useMemo(
    () => participants.find((p) => p.id === selectedParticipantId) || null,
    [participants, selectedParticipantId]
  );

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
    changeAmount
  ) => {
    try {
      await participantService.updateParticipantScore(
        participantId,
        categoryKey,
        changeAmount,
        user?.uid,
        "Manual scoring via Quick Scoring"
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
    } catch (err) {
      console.error("Failed to update score:", err);
      pushToast("Failed to update score. Try again.", true);
    }
  };

  const handleTeamScoreChange = async (teamName, categoryKey, changeAmount) => {
    try {
      const teamMembers = participants.filter((p) => p.team === teamName);

      await Promise.all(
        teamMembers.map((member) =>
          participantService.updateParticipantScore(
            member.id,
            categoryKey,
            changeAmount,
            user?.uid,
            `Team scoring for ${teamName}`
          )
        )
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
        )} pts each — ${catName}`
      );
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
        if (showCustomCategoryModal) setShowCustomCategoryModal(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedParticipantId,
    selectedTeam,
    showShareModal,
    showCustomCategoryModal,
  ]);

  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      setSelectedParticipantId(null);
      setSelectedTeam(null);
    }
  };

  const computeProgressPercent = (currentScore) => {
    const min = scoringScale.min;
    const max = scoringScale.max;
    const val = currentScore ?? 0;
    const denom = max - min || 1;
    const pct = ((val - min) / denom) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
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
    const plusDelta = isPositive ? 1 : -1;
    const minusDelta = isPositive ? -1 : 1;

    const handlePlus = () => {
      if (!canApplyDelta(currentScore, plusDelta)) return;
      onScoreChange(categoryKey, plusDelta);
    };
    const handleMinus = () => {
      if (!canApplyDelta(currentScore, minusDelta)) return;
      onScoreChange(categoryKey, minusDelta);
    };

    const pct = computeProgressPercent(currentScore);

    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/90 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {category?.name || categoryKey}
            </div>
            {category?.description && (
              <div className="text-xs text-gray-600 truncate">
                {category.description}
              </div>
            )}
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleMinus}
            disabled={!canApplyDelta(currentScore, minusDelta)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition ${
              canApplyDelta(currentScore, minusDelta)
                ? "bg-red-500 hover:scale-105"
                : "bg-gray-300 opacity-50 cursor-not-allowed"
            }`}
            aria-label="decrease"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-12 text-center font-bold text-gray-900">
            {currentScore > 0 ? "+" : ""}
            {currentScore}
          </div>

          <button
            onClick={handlePlus}
            disabled={!canApplyDelta(currentScore, plusDelta)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition ${
              canApplyDelta(currentScore, plusDelta)
                ? "bg-green-500 hover:scale-105"
                : "bg-gray-300 opacity-50 cursor-not-allowed"
            }`}
            aria-label="increase"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
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
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3 bg-blue-600">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Quick Scoring
              </h1>
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

            <button
              onClick={() => setShowCustomCategoryModal(true)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                Categories
              </span>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mt-4 flex items-center gap-4">
          <div className="bg-white rounded-xl p-1 border border-gray-200 inline-flex">
            <button
              onClick={() => setScoringMode("individual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoringMode === "individual"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Individual
            </button>
            <button
              onClick={() => setScoringMode("team")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scoringMode === "team"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Teams
            </button>
          </div>
        </div>

        {/* Search + Filter (only for individual mode) */}
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
                onClick={() => setSelectedParticipantId(null)}
                className="px-3 py-2 bg-slate-100 rounded-md text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>
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
            </div>
          </div>
        </div>
      )}

      {/* Team Scoring Drawer */}
      {selectedTeam && (
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
                    <h3 className="text-lg font-bold">{selectedTeam}</h3>
                    <div className="text-xs text-slate-500">
                      {
                        participants.filter((p) => p.team === selectedTeam)
                          .length
                      }{" "}
                      members
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-800 inline-block">
                    Total:{" "}
                    {teams.find((t) => t.name === selectedTeam)?.totalScore ||
                      0}{" "}
                    pts
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeam(null)}
                className="px-3 py-2 bg-slate-100 rounded-md text-sm flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                Points awarded to this team will be distributed equally to all{" "}
                {participants.filter((p) => p.team === selectedTeam).length}{" "}
                members.
              </p>
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
                        currentScore={0}
                        isPositive={true}
                        onScoreChange={(catKey, delta) =>
                          handleTeamScoreChange(selectedTeam, catKey, delta)
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
                        currentScore={0}
                        isPositive={false}
                        onScoreChange={(catKey, delta) =>
                          handleTeamScoreChange(selectedTeam, catKey, delta)
                        }
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Team Members List */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Team Members</h4>
              <div className="space-y-2">
                {participants
                  .filter((p) => p.team === selectedTeam)
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
      )}

      {/* Share Modal */}
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

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Live Updates</div>
                  <div className="text-xs text-gray-600">
                    Leaderboard updates in real-time as you score
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Download className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Downloadable</div>
                  <div className="text-xs text-gray-600">
                    Viewers can download the leaderboard as PDF
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-3 h-3 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Public Access</div>
                  <div className="text-xs text-gray-600">
                    No login required to view the leaderboard
                  </div>
                </div>
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

      {/* Custom Categories Modal */}
      {showCustomCategoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Scoring Categories
              </h3>
              <button
                onClick={() => setShowCustomCategoryModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Manage your scoring categories. Changes are saved to your session
              settings.
            </p>

            <div className="space-y-6">
              {/* Positive Categories */}
              <div>
                <h4 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Positive Actions
                </h4>
                <div className="space-y-2">
                  {Object.entries(scoringCategories.positive || {}).map(
                    ([key, cat]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {cat.name}
                          </div>
                          {cat.description && (
                            <div className="text-xs text-gray-600">
                              {cat.description}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-emerald-700 ml-4">
                          +{cat.points || 1} pts
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Negative Categories */}
              <div>
                <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Infractions
                </h4>
                <div className="space-y-2">
                  {Object.entries(scoringCategories.negative || {}).map(
                    ([key, cat]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {cat.name}
                          </div>
                          {cat.description && (
                            <div className="text-xs text-gray-600">
                              {cat.description}
                            </div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-red-700 ml-4">
                          {cat.points || -1} pts
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> To add or edit custom categories, go to
                Session Settings and update your scoring configuration.
              </p>
            </div>

            <button
              onClick={() => setShowCustomCategoryModal(false)}
              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-xl transition-colors"
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
