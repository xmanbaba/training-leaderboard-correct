import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import QuickScoring from './components/QuickScoring';
import Participants from './components/Participants';
import Settings from './components/Settings';
import { mockTrainings, mockParticipants, mockGroups, scoringCategories } from './data/mockData';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Top Header */}
        <Header />

        <div className="flex flex-1">
          {/* Sidebar Navigation */}
          <Navigation /> {/* Removed currentView and setCurrentView props */}

          {/* Main Content Area */}
          <main className="flex-1 p-4" role="main">
            <Routes>
              <Route path="/" element={<Dashboard participants={mockParticipants} groups={mockGroups} />} />
              <Route path="/leaderboard" element={<Leaderboard participants={mockParticipants} groups={mockGroups} />} />
              <Route path="/quick-scoring" element={<QuickScoring categories={scoringCategories} />} />
              <Route path="/participants" element={<Participants participants={mockParticipants} />} />
              <Route path="/settings" element={<Settings />} />
              {/* Catch-all for unknown routes */}
              <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}