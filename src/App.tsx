import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import StudyPlanForm from './components/StudyPlanForm';
import StudyPlanView from './components/StudyPlanView';
import LoginRegister from './components/LoginRegister';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';

export type Theme = {
  accent: string;
  background: string;
  panel: string;
};

const presetThemes: Record<string, Theme> = {
  neon: { accent: '#ff7ac3', background: '#0b1224', panel: '#0f172a' },
  sunrise: { accent: '#ffb347', background: '#1f0a2f', panel: '#2b1440' },
  mint: { accent: '#38f2af', background: '#0f2d2f', panel: '#0e1f24' },
};

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = JSON.parse(sessionStorage.getItem('user') || 'null');
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(presetThemes.neon);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--bg', theme.background);
    root.style.setProperty('--panel', theme.panel);
  }, [theme]);

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('studyPlan');
    setUser(null);
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <Router>
      <div className="app-shell">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <Navbar
          theme={theme}
          onThemeChange={setTheme}
          presets={presetThemes}
          user={user}
          onLogout={handleLogout}
        />
        <div className="container app-container">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/create-plan" element={
              <ProtectedRoute>
                <StudyPlanForm />
              </ProtectedRoute>
            } />
            <Route path="/plan" element={
              <ProtectedRoute>
                <StudyPlanView />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={
              <LoginRegister onLogin={handleLogin} />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;