import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Auth/Home";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import QuickScoring from "./components/QuickScoring";
import Participants from "./components/Participants";
import Settings from "./components/Settings";
import ParticipantJoin from "./components/ParticipantJoin"
import {
  mockTrainings,
  mockParticipants,
  mockGroups,
  scoringCategories,
} from "./data/mockData";

// Improved level system based on cumulative positive contributions
const calculateLevel = (participant) => {
  const positiveContributions = Object.entries(participant.scores)
    .filter(([key]) => scoringCategories.positive[key])
    .reduce((sum, [, value]) => sum + Math.max(0, value), 0);

  // Using blue theme for levels as requested
  if (positiveContributions >= 50)
    return {
      level: 5,
      title: "Master",
      color: "bg-gradient-to-r from-blue-600 to-indigo-700",
    };
  if (positiveContributions >= 30)
    return {
      level: 4,
      title: "Expert",
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
    };
  if (positiveContributions >= 20)
    return {
      level: 3,
      title: "Proficient",
      color: "bg-gradient-to-r from-blue-400 to-blue-500",
    };
  if (positiveContributions >= 10)
    return {
      level: 2,
      title: "Contributor",
      color: "bg-gradient-to-r from-blue-300 to-blue-400",
    };
  return {
    level: 1,
    title: "Newcomer",
    color: "bg-gradient-to-r from-slate-400 to-slate-500",
  };
};

// Main App Layout Component (for authenticated users)
const MainAppLayout = () => {
  const [participants, setParticipants] = useState(mockParticipants);
  const [scoringMode, setScoringMode] = useState("individual");
  const [scoringScale, setScoringScale] = useState({ min: -10, max: 10 });
  const [selectedTraining] = useState(mockTrainings[0]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Helper function to update participant scores
  const updateParticipantScore = (participantId, category, change) => {
    setParticipants((prevParticipants) =>
      prevParticipants.map((participant) => {
        if (participant.id === participantId) {
          const newScores = {
            ...participant.scores,
            [category]: (participant.scores[category] || 0) + change,
          };

          // Calculate new total score
          const newTotalScore = Object.values(newScores).reduce(
            (sum, score) => sum + score,
            0
          );

          return {
            ...participant,
            scores: newScores,
            totalScore: newTotalScore,
          };
        }
        return participant;
      })
    );
  };

const handleParticipantAdded = (newParticipant) => {
  setParticipants((prev) => [...prev, newParticipant]);
};


  // Helper function to get sorted participants
  const getSortedParticipants = () => {
    return [...participants].sort((a, b) => b.totalScore - a.totalScore);
  };

  // Helper function to get sorted groups
  const getSortedGroups = () => {
    return mockGroups
      .map((group) => ({
        ...group,
        totalScore: participants
          .filter((p) => group.participantIds.includes(p.id))
          .reduce((sum, p) => sum + p.totalScore, 0),
        participantCount: group.participantIds.length,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm z-40"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Top Header */}
      <Header
        selectedTraining={selectedTraining}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        participants={participants}
      />

      <div className="flex">
        {/* Sidebar Navigation */}
        <Navigation
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        />

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
          role="main"
        >
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    participants={participants}
                    mockGroups={mockGroups}
                    getSortedParticipants={getSortedParticipants}
                    calculateLevel={calculateLevel}
                  />
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <Leaderboard
                    scoringMode={scoringMode}
                    setScoringMode={setScoringMode}
                    getSortedParticipants={getSortedParticipants}
                    getSortedGroups={getSortedGroups}
                    scoringCategories={scoringCategories}
                    calculateLevel={calculateLevel}
                  />
                }
              />
              <Route
                path="/quick-scoring"
                element={
                  <ProtectedRoute requireRole="trainer">
                    <QuickScoring
                      participants={participants}
                      scoringCategories={scoringCategories}
                      scoringScale={scoringScale}
                      updateParticipantScore={updateParticipantScore}
                      calculateLevel={calculateLevel}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/participants"
                element={
                  <Participants
                    participants={participants}
                    mockGroups={mockGroups}
                    calculateLevel={calculateLevel}
                    selectedTraining={selectedTraining}
                    onParticipantAdded={handleParticipantAdded}
                  />
                }
              />
              <Route path="/join/:joinCode" element={<ParticipantJoin />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireRole="trainer">
                    <Settings
                      selectedTraining={selectedTraining}
                      scoringScale={scoringScale}
                      setScoringScale={setScoringScale}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="*"
                element={
                  <div className="text-center py-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      404
                    </h1>
                    <p className="text-gray-600">Page not found</p>
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public route - Authentication/Landing page */}
          <Route path="/auth" element={<Home />} />

          {/* Protected routes - Main application */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainAppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
