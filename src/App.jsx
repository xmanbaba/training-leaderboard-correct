import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import QuickScoring from "./components/QuickScoring";
import Participants from "./components/Participants";
import Settings from "./components/Settings";
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

  if (positiveContributions >= 50)
    return {
      level: 5,
      title: "Master",
      color: "bg-gradient-to-r from-purple-500 to-indigo-600",
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
      color: "bg-gradient-to-r from-green-500 to-emerald-600",
    };
  if (positiveContributions >= 10)
    return {
      level: 2,
      title: "Contributor",
      color: "bg-gradient-to-r from-yellow-500 to-orange-500",
    };
  return {
    level: 1,
    title: "Newcomer",
    color: "bg-gradient-to-r from-gray-400 to-gray-500",
  };
};

export default function App() {
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
    <Router>
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
                    <QuickScoring
                      participants={participants}
                      scoringCategories={scoringCategories}
                      scoringScale={scoringScale}
                      updateParticipantScore={updateParticipantScore}
                      calculateLevel={calculateLevel}
                    />
                  }
                />
                <Route
                  path="/participants"
                  element={
                    <Participants
                      participants={participants}
                      mockGroups={mockGroups}
                      calculateLevel={calculateLevel}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      selectedTraining={selectedTraining}
                      scoringScale={scoringScale}
                      setScoringScale={setScoringScale}
                    />
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
    </Router>
  );
}
