// QuickScoring.jsx - Fixed with SessionContext
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Zap,
  Users,
  Trophy,
  Plus,
  Minus,
  Crown,
  Award,
  TrendingUp,
  Target,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useSession } from "../contexts/SessionContext";
import { ParticipantService } from "../services/participantService";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_SCALE = { min: -5, max: 5 };

export default function QuickScoring({
  scoringCategories = { positive: {}, negative: {} },
  calculateLevel,
}) {
  const { user } = useAuth();
  const { currentSession } = useSession();
  const participantService = useMemo(() => new ParticipantService(), []);

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const backdropRef = useRef(null);

  // search + filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Load participants from current session
  useEffect(() => {
    if (currentSession?.id) {
      setLoading(true);
      const unsubscribe = participantService.subscribeToSessionParticipants(
        currentSession.id,
        (updatedParticipants) => {
          setParticipants(updatedParticipants);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setParticipants([]);
      setLoading(false);
    }
  }, [currentSession?.id]);

  const scoringScale = currentSession?.scoringScale || DEFAULT_SCALE;

  // Derived values
  const sortedParticipants = useMemo(() => {
    let list = [...participants];

    // search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.department || "").toLowerCase().includes(q)
      );
    }

    // department filter
    if (departmentFilter !== "all") {
      list = list.filter((p) => p.department === departmentFilter);
    }

    // sort descending by totalScore
    return list.sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  }, [participants, searchQuery, departmentFilter]);

  const totalPoints = useMemo(
    () => participants.reduce((s, p) => s + (p.totalScore || 0), 0),
    [participants]
  );

  const selectedParticipant = useMemo(
    () => participants.find((p) => p.id === selectedParticipantId) || null,
    [participants, selectedParticipantId]
  );

  // Toasts helper
  const pushToast = (message, isError = false, duration = 3500) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration
    );
  };

  // Update score
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

  // Close panel with ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && selectedParticipantId)
        setSelectedParticipantId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedParticipantId]);

  // Backdrop click handler
  const onBackdropClick = (e) => {
    if (e.target === backdropRef.current) {
      setSelectedParticipantId(null);
    }
  };

  // Helpers for score UI
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

  // ScoreRow component
  const ScoreRow = ({
    categoryKey,
    category,
    currentScore = 0,
    isPositive,
    participantId,
  }) => {
    const plusDelta = isPositive ? 1 : -1;
    const minusDelta = isPositive ? -1 : 1;

    const handlePlus = () => {
      if (!canApplyDelta(currentScore, plusDelta)) return;
      handleScoreChange(participantId, categoryKey, plusDelta);
    };
    const handleMinus = () => {
      if (!canApplyDelta(currentScore, minusDelta)) return;
      handleScoreChange(participantId, categoryKey, minusDelta);
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

  // ParticipantListItem
  const ParticipantListItem = ({ p, index }) => {
    const rank = index + 1;
    const levelInfo = (typeof calculateLevel === "function" &&
      calculateLevel(p)) || { title: "Level", level: "-" };

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
              {p.department || "No department"}
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

  // departments for filter
  const departmentOptions = useMemo(
    () => [...new Set(participants.map((p) => p.department).filter(Boolean))],
    [participants]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading participants...</p>
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
                Award points quickly — tap a participant to open scoring.
              </p>
            </div>
          </div>

          {/* Header stats */}
          <div className="flex gap-3">
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
          </div>
        </div>

        {/* Search + Filter */}
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          {sortedParticipants.length > 0 ? (
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
          )}
        </div>
      </div>

      {/* RIGHT-SIDE DRAWER */}
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
            {/* Header of Drawer */}
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
                      {selectedParticipant.department || "No department"}
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

            {/* Positive / Negative Groups */}
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
                        participantId={selectedParticipant.id}
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
                        participantId={selectedParticipant.id}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
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
