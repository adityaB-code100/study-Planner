import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { API_BASE } from '../config';

interface DashboardStats {
  user: {
    user_id: string;
    name: string;
    email: string;
    created_at: string;
  };
  stats: {
    total_study_time: number;
    completed_topics: number;
    total_plans: number;
    active_plans: number;
    completion_rate: number;
    total_tasks?: number;
    completed_tasks?: number;
  };
  recent_plans: Array<{
    plan_id: string;
    student_name: string;
    created_at: string;
    progress: number;
    total_tasks: number;
    completed_tasks: number;
    daily_hours: string;
  }>;
  daily_activity: Array<{
    date: string;
    day: string;
    study_time: number;
  }>;
}

// Sound utility functions
const playSound = (soundName: string, volume: number = 0.3) => {
  try {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = volume;
    audio.play().catch((e) => console.log(`Audio play failed for ${soundName}:`, e));
  } catch (e) {
    console.log('Sound error:', e);
  }
};

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Framer Motion Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const cardHover = {
    scale: 1.02,
    boxShadow: "0 20px 80px rgba(255, 122, 195, 0.3)"
  };

  const buttonHover = {
    scale: 1.05
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity as number,
      ease: "easeInOut" as const
    }
  };

  const fetchDashboardStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const userStr = sessionStorage.getItem('user');
      if (!userStr) {
        navigate('/auth');
        return;
      }
      
      const user = JSON.parse(userStr);
      const token = user.user_id || user.token;
      
      if (!token) {
        navigate('/auth');
        return;
      }

      const apiUrl = API_BASE ? `${API_BASE}/api/dashboard` : '/api/dashboard';
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        sessionStorage.removeItem('user');
        navigate('/auth');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.user) {
        throw new Error('Invalid dashboard data received');
      }
      
      setStats(data);
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      setError(error.message || 'Failed to load dashboard. Please try again.');
      
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        sessionStorage.removeItem('user');
        navigate('/auth');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardStats();
    
    // Play welcome sound
    setTimeout(() => playSound('welcome', 0.3), 500);
  }, [fetchDashboardStats]);

  // Helper functions
  const getUserName = () => {
    if (!stats) return 'Student';
    return stats.user?.name || 'Student';
  };

  const getJoinDate = () => {
    if (!stats || !stats.user?.created_at) return 'Recently';
    
    try {
      const date = new Date(stats.user.created_at);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  const getStatsValue = (key: keyof DashboardStats['stats'], fallback: number = 0) => {
    if (!stats || !stats.stats) return fallback;
    return stats.stats[key] ?? fallback;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Navigation handlers
  const handleNavigation = (path: string) => {
    playSound('click', 0.2);
    navigate(path);
  };

  // Loading State
  if (loading) {
    return (
      <div className="page-grid">
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ 
            textAlign: 'center', 
            padding: isMobile ? '2rem 1rem' : '3rem',
            margin: '0 auto',
            maxWidth: '500px'
          }}
        >
          <motion.div 
            className="spinner"
            style={{ 
              margin: '0 auto 1.5rem', 
              width: '50px', 
              height: '50px',
              borderRadius: '50%',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTop: '3px solid var(--accent)'
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Loading your dashboard...
          </motion.h3>
          <motion.p 
            className="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: '0.5rem' }}
          >
            Please wait while we fetch your data
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="page-grid">
        <motion.div 
          className="glass-card"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" }}
          style={{
            padding: isMobile ? '1.5rem' : '2rem',
            borderLeft: '4px solid #f87171'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ margin: 0 }}>Error Loading Dashboard</h3>
          </div>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button 
              className="btn-primary-neo" 
              onClick={() => {
                playSound('click', 0.2);
                fetchDashboardStats();
              }}
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
            <motion.button 
              className="btn-ghost" 
              onClick={() => {
                playSound('click', 0.2);
                navigate('/auth');
              }}
              whileHover={buttonHover}
              whileTap={{ scale: 0.95 }}
            >
              Go to Login
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="page-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Welcome Section */}
      <motion.div 
        className="hero"
        variants={itemVariants}
        whileHover={{ scale: 1.005 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          animate={pulseAnimation}
        >
          <h1 style={{ fontSize: isMobile ? '28px' : '32px' }}>
            Welcome back, <span className="accent">{getUserName()}</span>! 🎉
          </h1>
        </motion.div>
        <motion.p 
          className="lead"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: isMobile ? '14px' : '16px' }}
        >
          Ready to continue your learning journey? Track your progress and plan your next study session.
        </motion.p>
        <motion.div 
          className="hero-badges"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginTop: '1rem'
          }}
        >
          <motion.span 
            className="chip chip-ghost"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{ fontSize: isMobile ? '12px' : '13px' }}
          >
            Member since {getJoinDate()}
          </motion.span>
          <motion.span 
            className="chip chip-ghost"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{ fontSize: isMobile ? '12px' : '13px' }}
          >
            🎯 {getStatsValue('active_plans')} Active Plans
          </motion.span>
          <motion.span 
            className="chip chip-ghost"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{ fontSize: isMobile ? '12px' : '13px' }}
          >
            ⚡ {getStatsValue('completion_rate', 0).toFixed(1)}% Completion Rate
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div 
        className="glass-card"
        variants={itemVariants}
        whileHover={cardHover}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ padding: isMobile ? '1.5rem' : '2rem' }}
      >
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Quick Actions</p>
            <h3 style={{ fontSize: isMobile ? '24px' : '28px' }}>Get Started</h3>
          </div>
        </div>
        
        <div 
          className="grid-two"
          style={{ 
            marginTop: '1.5rem',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))'
          }}
        >
          {/* Create New Plan Card */}
          <motion.div 
            className="glass-card"
            style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(255, 122, 195, 0.05)',
              borderColor: 'rgba(255, 122, 195, 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation('/create-plan')}
            onMouseEnter={() => playSound('hover', 0.1)}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(255, 122, 195, 0.2), rgba(255, 122, 195, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span style={{ fontSize: '24px' }}>📝</span>
            </motion.div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '18px' : '20px' }}>Create New Plan</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', marginBottom: '1rem' }}>
              Start a new study plan with AI assistance
            </p>
            <motion.span 
              className="chip chip-solid"
              style={{ marginTop: 'auto', fontSize: isMobile ? '12px' : '13px' }}
              whileHover={{ scale: 1.05 }}
            >
              Get Started →
            </motion.span>
          </motion.div>

          {/* View Current Plan Card */}
          <motion.div 
            className="glass-card"
            style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(80, 198, 255, 0.05)',
              borderColor: 'rgba(80, 198, 255, 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation('/plan')}
            onMouseEnter={() => playSound('hover', 0.1)}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(80, 198, 255, 0.2), rgba(80, 198, 255, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            >
              <span style={{ fontSize: '24px' }}>📊</span>
            </motion.div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '18px' : '20px' }}>View Current Plan</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', marginBottom: '1rem' }}>
              Continue your active study sessions
            </p>
            <motion.span 
              className="chip chip-solid"
              style={{ 
                marginTop: 'auto',
                fontSize: isMobile ? '12px' : '13px',
                background: 'var(--accent-secondary, #50c6ff)'
              }}
              whileHover={{ scale: 1.05 }}
            >
              Continue →
            </motion.span>
          </motion.div>

          {/* View Analytics Card */}
          <motion.div 
            className="glass-card"
            style={{
              padding: isMobile ? '1.25rem' : '1.5rem',
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(124, 58, 237, 0.05)',
              borderColor: 'rgba(124, 58, 237, 0.3)'
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigation('/dashboard')}
            onMouseEnter={() => playSound('hover', 0.1)}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span style={{ fontSize: '24px' }}>📈</span>
            </motion.div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '18px' : '20px' }}>View Analytics</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', marginBottom: '1rem' }}>
              Check your progress and statistics
            </p>
            <motion.span 
              className="chip chip-solid"
              style={{ 
                marginTop: 'auto',
                fontSize: isMobile ? '12px' : '13px',
                background: 'var(--accent-tertiary, #7c3aed)'
              }}
              whileHover={{ scale: 1.05 }}
            >
              View Stats →
            </motion.span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div 
        className="glass-card"
        variants={itemVariants}
        whileHover={cardHover}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ padding: isMobile ? '1.5rem' : '2rem' }}
      >
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Your Progress</p>
            <motion.h3
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: isMobile ? '24px' : '28px' }}
            >
              Study Statistics
            </motion.h3>
          </div>
        </div>
        
        <div 
          className="grid-two"
          style={{ 
            marginTop: '1.5rem',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}
        >
          {/* Total Study Time */}
          <motion.div 
            className="stat-card"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(255, 122, 195, 0.08)',
              borderColor: 'rgba(255, 122, 195, 0.3)'
            }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(255, 122, 195, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <span style={{ fontSize: '24px' }}>⏱️</span>
            </motion.div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: isMobile ? '24px' : '28px' }}>
                {formatTime(getStatsValue('total_study_time'))}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Total Study Time</p>
            </div>
          </motion.div>

          {/* Topics Completed */}
          <motion.div 
            className="stat-card"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(80, 198, 255, 0.08)',
              borderColor: 'rgba(80, 198, 255, 0.3)'
            }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(80, 198, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span style={{ fontSize: '24px' }}>✅</span>
            </motion.div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: isMobile ? '24px' : '28px' }}>
                {getStatsValue('completed_topics')}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Topics Completed</p>
            </div>
          </motion.div>

          {/* Total Plans */}
          <motion.div 
            className="stat-card"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(124, 58, 237, 0.08)',
              borderColor: 'rgba(124, 58, 237, 0.3)'
            }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(124, 58, 237, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
            >
              <span style={{ fontSize: '24px' }}>📚</span>
            </motion.div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: isMobile ? '24px' : '28px' }}>
                {getStatsValue('total_plans')}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Total Plans</p>
            </div>
          </motion.div>

          {/* Completion Rate */}
          <motion.div 
            className="stat-card"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: 'rgba(34, 197, 94, 0.08)',
              borderColor: 'rgba(34, 197, 94, 0.3)'
            }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                background: 'rgba(34, 197, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span style={{ fontSize: '24px' }}>🎯</span>
            </motion.div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem 0', fontSize: isMobile ? '24px' : '28px' }}>
                {getStatsValue('completion_rate', 0).toFixed(1)}%
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Completion Rate</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Recent Plans */}
      <motion.div 
        className="glass-card"
        variants={itemVariants}
        whileHover={cardHover}
        transition={{ type: "spring", stiffness: 300 }}
        style={{ padding: isMobile ? '1.5rem' : '2rem' }}
      >
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Recent Plans</p>
            <h3 style={{ fontSize: isMobile ? '24px' : '28px' }}>Your Study History</h3>
          </div>
          <motion.button 
            className="btn-ghost" 
            onClick={() => handleNavigation('/dashboard')}
            whileHover={{ 
              scale: 1.05,
              borderColor: 'var(--accent)',
              x: 5
            }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={() => playSound('hover', 0.1)}
            style={{ fontSize: isMobile ? '13px' : '14px' }}
          >
            View All →
          </motion.button>
        </div>
        
        <AnimatePresence>
          <div style={{ marginTop: '1.5rem' }}>
            {stats?.recent_plans && stats.recent_plans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recent_plans.slice(0, isMobile ? 3 : 5).map((plan, index) => (
                  <motion.div 
                    key={plan.plan_id || index}
                    className="glass-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderColor: 'var(--accent)'
                    }}
                    style={{
                      padding: isMobile ? '1rem' : '1.25rem',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      gap: isMobile ? '1rem' : '1.5rem'
                    }}
                    onMouseEnter={() => playSound('hover', 0.1)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? '0.5rem' : '1rem',
                        marginBottom: '0.5rem'
                      }}>
                        <h4 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>
                          {plan.student_name || 'Study Plan'}
                        </h4>
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}>
                          <span className="badge-neo" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                            📅 {new Date(plan.created_at).toLocaleDateString()}
                          </span>
                          <span className="badge-neo" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                            📚 {plan.total_tasks || 0} topics
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '13px'
                        }}>
                          ⏰ {plan.daily_hours || 2}h/day
                        </div>
                        <div style={{ 
                          background: 'linear-gradient(90deg, var(--accent) 0%, var(--accent) ' + plan.progress + '%, transparent ' + plan.progress + '%)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: isMobile ? '12px' : '13px'
                        }}>
                          {plan.progress}% Complete
                        </div>
                      </div>
                    </div>
                    <motion.button 
                      className="btn-ghost"
                      onClick={() => {
                        playSound('click', 0.2);
                        sessionStorage.setItem('studyPlan', JSON.stringify(plan));
                        navigate('/plan');
                      }}
                      whileHover={{ 
                        scale: 1.05,
                        borderColor: 'var(--accent)'
                      }}
                      whileTap={{ scale: 0.95 }}
                      style={{ fontSize: isMobile ? '13px' : '14px' }}
                    >
                      Continue →
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="glass-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  border: '2px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📚</div>
                <h4 style={{ marginBottom: '0.5rem' }}>No Recent Plans</h4>
                <p className="muted" style={{ marginBottom: '1.5rem' }}>
                  You haven't created any study plans yet. Start your learning journey!
                </p>
                <motion.button 
                  className="btn-primary-neo" 
                  onClick={() => handleNavigation('/create-plan')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  onMouseEnter={() => playSound('hover', 0.1)}
                >
                  Create Your First Plan
                </motion.button>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </motion.div>

      {/* Floating Particles Animation */}
      {!isMobile && (
        <div className="floating-particles" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                background: `rgba(${Math.random() > 0.5 ? '255, 122, 195' : '80, 198, 255'}, ${Math.random() * 0.3 + 0.1})`,
                borderRadius: '50%'
              }}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                scale: Math.random() * 0.5 + 0.5,
                opacity: Math.random() * 0.2 + 0.1
              }}
              animate={{
                y: [null, -Math.random() * 100, Math.random() * 100],
                x: [null, Math.random() * 50 - 25, Math.random() * 50 - 25],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: Math.random() * 15 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HomePage;