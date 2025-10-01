// QuickScoring.jsx
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

import { ParticipantService } from "../services/participantService";
import { useAuth } from "../contexts/AuthContext";

const DEFAULT_SCALE = { min: -5, max: 5 };

export default function QuickScoring({
  participants = [],
  scoringCategories = { positive: {}, negative: {} },
  scoringScale = DEFAULT_SCALE,
  updateParticipantScore, // optional callback from parent
  calculateLevel, // optional
}) {
  const { user } = useAuth();
  const participantService = useMemo(() => new ParticipantService(), []);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const backdropRef = useRef(null);

  // search + filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Derived values (do not mutate props)
  const sortedParticipants = useMemo(() => {
    let list = [...participants];

    // search (name OR department)
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

  // Toasts helper (safe id, auto-dismiss)
  const pushToast = (message, isError = false, duration = 3500) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration
    );
  };

  // Prefer updateParticipantScore prop, else fallback to ParticipantService
  const performUpdate = async (participantId, categoryKey, changeAmount) => {
    if (typeof updateParticipantScore === "function") {
      try {
        const attempt = updateParticipantScore(
          participantId,
          categoryKey,
          changeAmount,
          user?.uid
        );
        if (attempt && typeof attempt.then === "function") await attempt;
        return;
      } catch (err) {
        console.warn(
          "updateParticipantScore failed, falling back to ParticipantService",
          err
        );
      }
    }

    // fallback
    await participantService.updateParticipantScore(
      participantId,
      categoryKey,
      changeAmount,
      user?.uid,
      "Manual scoring via Quick Scoring"
    );
  };

  // Called when user presses +/- for a category
  const handleScoreChange = async (
    participantId,
    categoryKey,
    changeAmount
  ) => {
    try {
      await performUpdate(participantId, categoryKey, changeAmount);

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

  // Backdrop click handler (close only when clicking the backdrop itself)
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

  // ScoreRow component (compact, inline)
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

    const Icon = category?.icon || User;
    const pct = computeProgressPercent(currentScore);

    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-white/6 rounded-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 text-blue-50">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">
              {category?.name || categoryKey}
            </div>
            <div className="text-xs text-slate-200 truncate">
              {category?.description || ""}
            </div>
            <div className="mt-2 h-2 w-full bg-white/10 rounded-full overflow-hidden">
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
                ? "bg-blue-600 hover:scale-105"
                : "bg-white/10 opacity-50 cursor-not-allowed"
            }`}
            aria-label="decrease"
          >
            <Minus className="w-4 h-4" />
          </button>

          <div className="w-12 text-center font-bold">
            {currentScore > 0 ? "+" : ""}
            {currentScore}
          </div>

          <button
            onClick={handlePlus}
            disabled={!canApplyDelta(currentScore, plusDelta)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition ${
              canApplyDelta(currentScore, plusDelta)
                ? "bg-sky-500 hover:scale-105"
                : "bg-white/10 opacity-50 cursor-not-allowed"
            }`}
            aria-label="increase"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ParticipantListItem (click to open drawer)
  const ParticipantListItem = ({ p, index }) => {
    const rank = index + 1;
    const levelInfo = (typeof calculateLevel === "function" &&
      calculateLevel(p)) || { title: "Level", level: "-" };

    return (
      <div
        onClick={() => setSelectedParticipantId(p.id)}
        className="cursor-pointer p-4 rounded-2xl bg-white/6 hover:bg-white/8 transition flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white">
            <User className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{p.name}</div>
            <div className="text-xs text-slate-200 truncate">
              {p.department}
            </div>
            <div className="mt-1 text-xs inline-flex items-center gap-2 bg-white/8 px-2 py-0.5 rounded-full">
              <Award className="w-3 h-3" />
              <span className="text-xs">
                {levelInfo.title} • L{levelInfo.level}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right min-w-[88px]">
          <div
            className={`px-3 py-1 rounded-2xl font-bold ${
              p.totalScore >= 0
                ? "bg-sky-50 text-sky-800"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {p.totalScore > 0 ? "+" : ""}
            {p.totalScore}
          </div>
          <div className="text-xs text-slate-300 mt-1">#{rank}</div>
        </div>
      </div>
    );
  };

  // departments for filter select
  const departmentOptions = useMemo(
    () => [...new Set(participants.map((p) => p.department).filter(Boolean))],
    [participants]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-indigo-900 text-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl p-3 bg-white/6">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Quick Scoring</h1>
              <p className="text-sm text-slate-200">
                Award points quickly — tap a participant to open scoring.
              </p>
            </div>
          </div>

          {/* Header stats */}
          <div className="flex gap-3">
            <div className="bg-white/6 px-4 py-2 rounded-2xl flex items-center gap-3">
              <Users className="w-5 h-5" />
              <div>
                <div className="font-bold text-lg">{participants.length}</div>
                <div className="text-xs text-slate-200">Participants</div>
              </div>
            </div>

            <div className="bg-white/6 px-4 py-2 rounded-2xl flex items-center gap-3">
              <Trophy className="w-5 h-5" />
              <div>
                <div className="font-bold text-lg">{totalPoints}</div>
                <div className="text-xs text-slate-200">Total Points</div>
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
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-300" />
          </div>
          <div className="relative">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-slate-300 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          <div className="text-sm font-semibold text-slate-200 mb-1">
            Participants
          </div>
          <div className="flex flex-col gap-2">
            {sortedParticipants.map((p, i) => (
              <ParticipantListItem key={p.id} p={p} index={i} />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="p-4 rounded-2xl bg-white/6">
            <h2 className="font-semibold text-lg">Scoring workflow</h2>
            <p className="text-sm text-slate-200 mt-1">
              Click a participant to open scoring. Use the +/- controls to
              adjust category scores.
            </p>
          </div>

          {/* Top 3 preview (optional) */}
          <div className="p-4 rounded-2xl bg-white/6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortedParticipants.slice(0, 3).map((p, idx) => (
              <div
                key={p.id}
                className="rounded-lg p-3 bg-gradient-to-br from-white/6 to-white/4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                      {idx === 0 ? (
                        <Crown className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-200">
                        {p.department}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {p.totalScore > 0 ? `+${p.totalScore}` : p.totalScore}
                    </div>
                    <div className="text-xs text-slate-300">#{idx + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT-SIDE DRAWER (the one you preferred) */}
      {selectedParticipant && (
        <div
          ref={backdropRef}
          onMouseDown={onBackdropClick}
          className="fixed inset-0 z-40 bg-black/50 flex justify-end md:items-stretch"
          aria-modal="true"
        >
          <div
            className="w-full md:w-[480px] max-w-full h-full md:h-auto bg-white text-slate-900 p-6 overflow-auto rounded-l-2xl"
            onMouseDown={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
          >
            {/* Header of Drawer */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedParticipant.name}
                    </h3>
                    <div className="text-xs text-slate-500">
                      {selectedParticipant.department}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="text-sm font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-800">
                    {selectedParticipant.totalScore > 0
                      ? `+${selectedParticipant.totalScore}`
                      : selectedParticipant.totalScore}
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
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sky-700 flex items-center gap-2">
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
                  <h4 className="font-semibold text-rose-600 flex items-center gap-2">
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
                ? "bg-rose-600 text-white"
                : "bg-white/95 text-slate-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
