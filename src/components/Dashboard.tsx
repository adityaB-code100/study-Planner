import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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
      console.log('Dashboard data received:', data);
      setStats(data);
      
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      setError(error.message || 'Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Check screen size for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  // Helper functions
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getSafeValue = <T,>(value: T | undefined, fallback: T): T => {
    return value !== undefined ? value : fallback;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recently';
    }
  };

  const getUserName = () => {
    return stats?.user?.name || 'Student';
  };

  const getCompletionRate = () => {
    return getSafeValue(stats?.stats?.completion_rate, 0).toFixed(1);
  };

  const getTotalStudyTime = () => {
    return formatTime(getSafeValue(stats?.stats?.total_study_time, 0));
  };

  const getTotalPlans = () => {
    return getSafeValue(stats?.stats?.total_plans, 0);
  };

  const getActivePlans = () => {
    return getSafeValue(stats?.stats?.active_plans, 0);
  };

  const getCompletedTopics = () => {
    return getSafeValue(stats?.stats?.completed_topics, 0);
  };

  const getTotalTasks = () => {
    return getSafeValue(stats?.stats?.total_tasks, 0);
  };

  if (loading) {
    return (
      <div className="page-grid">
        <div className="glass-card" style={{ 
          textAlign: 'center', 
          padding: isMobile ? '2rem 1rem' : '3rem',
          margin: '0 auto',
          maxWidth: '500px'
        }}>
          <div className="spinner" style={{ 
            margin: '0 auto 1.5rem', 
            width: '50px', 
            height: '50px',
            borderRadius: '50%',
            border: '3px solid rgba(255, 255, 255, 0.1)',
            borderTop: '3px solid var(--accent)',
            animation: 'spin 1s linear infinite'
          }}></div>
          <h3>Loading dashboard...</h3>
          <p className="muted">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-grid">
        <div className="glass-card" style={{
          padding: isMobile ? '1.5rem' : '2rem',
          borderLeft: '4px solid #f87171'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h3 style={{ margin: 0 }}>Error Loading Dashboard</h3>
          </div>
          <p style={{ marginBottom: '1.5rem' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              className="btn-primary-neo" 
              onClick={fetchDashboardStats}
            >
              Try Again
            </button>
            <button 
              className="btn-ghost" 
              onClick={() => navigate('/auth')}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-grid">
      {/* Dashboard Header */}
      <div className="hero">
        <h1 style={{ fontSize: isMobile ? '28px' : '32px' }}>
          Your Learning Dashboard 📊
        </h1>
        <p className="lead" style={{ fontSize: isMobile ? '14px' : '16px' }}>
          Welcome, <span className="accent">{getUserName()}</span>! Track your progress and manage your study plans.
        </p>
        <div className="hero-badges" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px',
          marginTop: '1rem'
        }}>
          <span className="chip chip-ghost" style={{ fontSize: isMobile ? '12px' : '13px' }}>
            Member since {stats?.user?.created_at ? formatDate(stats.user.created_at) : 'Recently'}
          </span>
          <span className="chip chip-ghost" style={{ fontSize: isMobile ? '12px' : '13px' }}>📊 Real-time Analytics</span>
          <span className="chip chip-ghost" style={{ fontSize: isMobile ? '12px' : '13px' }}>🎯 Personalized Insights</span>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div 
        className="grid-two" 
        style={{ 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}
      >
        {/* Study Time Card */}
        <div className="glass-card stat-card" style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(255, 122, 195, 0.08), transparent)',
          border: '1px solid rgba(255, 122, 195, 0.15)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <p className="eyebrow">Total Learning</p>
              <h3 style={{ margin: '0.5rem 0' }}>Study Time</h3>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(255, 122, 195, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>⏱️</span>
            </div>
          </div>
          <h2 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: isMobile ? '32px' : '40px',
            background: 'linear-gradient(90deg, #ff7ac3, #50c6ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {getTotalStudyTime()}
          </h2>
          <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>
            Cumulative time spent studying
          </p>
        </div>

        {/* Completion Rate Card */}
        <div className="glass-card stat-card" style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(80, 198, 255, 0.08), transparent)',
          border: '1px solid rgba(80, 198, 255, 0.15)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <div>
              <p className="eyebrow">Overall Progress</p>
              <h3 style={{ margin: '0.5rem 0' }}>Completion Rate</h3>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(80, 198, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>✅</span>
            </div>
          </div>
          <h2 style={{ 
            margin: '0 0 0.5rem 0', 
            fontSize: isMobile ? '32px' : '40px'
          }}>
            {getCompletionRate()}%
          </h2>
          <div className="progress-bar" style={{ 
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            margin: '1rem 0',
            overflow: 'hidden'
          }}>
            <div 
              className="progress-fill" 
              style={{ 
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent), #50c6ff)',
                borderRadius: '4px',
                width: `${getCompletionRate()}%`,
                transition: 'width 0.5s ease'
              }}
            />
          </div>
          <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>
            Overall task completion rate
          </p>
        </div>
      </div>

      {/* Plans & Topics Statistics */}
      <div 
        className="grid-two" 
        style={{ 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}
      >
        {/* Plans Statistics Card */}
        <div className="glass-card stat-card" style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08), transparent)',
          border: '1px solid rgba(124, 58, 237, 0.15)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <p className="eyebrow">Study Organization</p>
              <h3 style={{ margin: '0.5rem 0' }}>Plans Overview</h3>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>📚</span>
            </div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: isMobile ? '28px' : '32px'
              }}>
                {getTotalPlans()}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Total Plans</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: isMobile ? '28px' : '32px',
                color: 'var(--accent)'
              }}>
                {getActivePlans()}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Active Plans</p>
            </div>
          </div>
          <div style={{ 
            marginTop: '1.5rem',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <p style={{ 
              fontSize: isMobile ? '13px' : '14px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: 'var(--accent)' }}>→</span>
              <span>{Math.round((getActivePlans() / getTotalPlans()) * 100) || 0}% of plans are active</span>
            </p>
          </div>
        </div>

        {/* Topics Statistics Card */}
        <div className="glass-card stat-card" style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), transparent)',
          border: '1px solid rgba(34, 197, 94, 0.15)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <p className="eyebrow">Learning Progress</p>
              <h3 style={{ margin: '0.5rem 0' }}>Topics Completed</h3>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
            </div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: isMobile ? '28px' : '32px',
                color: '#22c55e'
              }}>
                {getCompletedTopics()}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Completed</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: isMobile ? '28px' : '32px'
              }}>
                {getTotalTasks()}
              </h2>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Total Topics</p>
            </div>
          </div>
          <div style={{ 
            marginTop: '1.5rem',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px'
          }}>
            <p style={{ 
              fontSize: isMobile ? '13px' : '14px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ color: '#22c55e' }}>→</span>
              <span>{Math.round((getCompletedTopics() / getTotalTasks()) * 100) || 0}% completion rate</span>
            </p>
          </div>
        </div>
      </div>

      {/* Activity Chart & Recent Plans Side by Side on Desktop */}
      <div 
        className="grid-two" 
        style={{ 
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem'
        }}
      >
        {/* Daily Activity Chart */}
        <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
          <div className="card-header-inline">
            <div>
              <p className="eyebrow">Weekly Insights</p>
              <h3 style={{ fontSize: isMobile ? '20px' : '24px' }}>Daily Study Time</h3>
            </div>
            <span className="ai-pill" style={{ fontSize: isMobile ? '12px' : '13px' }}>Last 7 Days</span>
          </div>
          <div className="activity-chart" style={{ marginTop: '1.5rem' }}>
            {stats?.daily_activity && stats.daily_activity.length > 0 ? (
              <div className="chart-bars" style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                height: '200px',
                padding: '20px 0'
              }}>
                {stats.daily_activity.map((day, index) => {
                  const maxHeight = Math.max(...stats.daily_activity.map(d => d.study_time), 1);
                  const height = maxHeight > 0 ? (day.study_time / maxHeight) * 100 : 0;
                  
                  return (
                    <div key={index} className="chart-bar-container" style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      margin: '0 4px'
                    }}>
                      <div className="chart-bar-label" style={{ 
                        fontSize: isMobile ? '11px' : '12px',
                        marginBottom: '8px',
                        color: 'var(--muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {day.day.substring(0, 3)}
                      </div>
                      <div className="chart-bar-wrapper" style={{ 
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center'
                      }}>
                        <div 
                          className="chart-bar" 
                          style={{ 
                            height: `${height}%`,
                            width: isMobile ? '20px' : '24px',
                            background: 'linear-gradient(to top, var(--accent), #50c6ff)',
                            borderRadius: '6px 6px 0 0',
                            minHeight: '4px'
                          }}
                          title={`${day.study_time} minutes`}
                        />
                      </div>
                      <div className="chart-bar-value" style={{ 
                        fontSize: isMobile ? '11px' : '12px',
                        marginTop: '8px',
                        fontWeight: '600'
                      }}>
                        {day.study_time}m
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '1rem' }}>📊</span>
                <p className="muted">No activity data available yet</p>
                <p className="muted" style={{ fontSize: isMobile ? '12px' : '13px', marginTop: '0.5rem' }}>
                  Start studying to see your activity chart
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Plans */}
        <div className="glass-card" style={{ padding: isMobile ? '1.25rem' : '1.5rem' }}>
          <div className="card-header-inline">
            <div>
              <p className="eyebrow">Your Studies</p>
              <h3 style={{ fontSize: isMobile ? '20px' : '24px' }}>Recent Plans</h3>
            </div>
            <button 
              className="btn-primary-neo" 
              onClick={() => navigate('/create-plan')}
              style={{ fontSize: isMobile ? '13px' : '14px' }}
            >
              + New Plan
            </button>
          </div>
          <div className="plans-table" style={{ marginTop: '1.5rem' }}>
            {stats?.recent_plans && stats.recent_plans.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recent_plans.slice(0, isMobile ? 3 : 4).map((plan, index) => {
                  const progress = plan.progress || 0;
                  
                  return (
                    <div 
                      key={index} 
                      className="glass-card"
                      style={{
                        padding: isMobile ? '1rem' : '1.25rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        sessionStorage.setItem('currentPlanId', plan.plan_id);
                        navigate('/plan');
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.backgroundColor = '';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        gap: isMobile ? '0.75rem' : '1rem',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ 
                            margin: '0 0 0.25rem 0',
                            fontSize: isMobile ? '16px' : '18px'
                          }}>
                            {plan.student_name || 'Study Plan'}
                          </h4>
                          <p className="muted" style={{ 
                            fontSize: isMobile ? '12px' : '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span>📅 {new Date(plan.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>⏰ {plan.daily_hours || 2}h/day</span>
                          </p>
                        </div>
                        <span className="chip chip-solid" style={{ 
                          fontSize: isMobile ? '12px' : '13px',
                          background: progress >= 100 ? '#22c55e' : 'var(--accent)'
                        }}>
                          {progress >= 100 ? 'Completed' : `${progress}%`}
                        </span>
                      </div>
                      
                      <div className="plan-progress" style={{ marginBottom: '0.75rem' }}>
                        <div className="progress-bar-small" style={{ 
                          height: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div 
                            className="progress-fill" 
                            style={{ 
                              height: '100%',
                              background: progress >= 100 
                                ? '#22c55e' 
                                : 'linear-gradient(90deg, var(--accent), #ff7ac3)',
                              width: `${progress}%`,
                              transition: 'width 0.5s ease'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}>
                        <span style={{ 
                          fontSize: isMobile ? '12px' : '13px',
                          color: 'var(--muted)'
                        }}>
                          {plan.completed_tasks || 0}/{plan.total_tasks || 0} topics completed
                        </span>
                        <button 
                          className="btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            sessionStorage.setItem('currentPlanId', plan.plan_id);
                            navigate('/plan');
                          }}
                          style={{ fontSize: isMobile ? '12px' : '13px' }}
                        >
                          {progress >= 100 ? 'Review →' : 'Continue →'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ 
                textAlign: 'center', 
                padding: '3rem 1rem',
                border: '2px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: '12px'
              }}>
                <span className="emoji-large" style={{ fontSize: '48px', display: 'block', marginBottom: '1rem' }}>📝</span>
                <h3 style={{ marginBottom: '0.5rem' }}>No plans yet</h3>
                <p className="muted" style={{ marginBottom: '1.5rem' }}>
                  Create your first study plan to get started!
                </p>
                <button 
                  className="btn-primary-neo" 
                  onClick={() => navigate('/create-plan')}
                  style={{ fontSize: isMobile ? '13px' : '14px' }}
                >
                  Create Your First Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Study Tips */}
      <div className="glass-card" style={{ 
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'linear-gradient(135deg, rgba(255, 122, 195, 0.05), rgba(80, 198, 255, 0.05))',
        border: '1px solid rgba(255, 122, 195, 0.1)'
      }}>
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Smart Learning</p>
            <h3 style={{ fontSize: isMobile ? '20px' : '24px' }}>AI Study Tips</h3>
          </div>
          <span className="ai-pill" style={{ fontSize: isMobile ? '12px' : '13px' }}>🤖 AI Powered</span>
        </div>
        <div 
          className="grid-two" 
          style={{ 
            marginTop: '1.5rem',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '1rem' : '1.5rem'
          }}
        >
          <div className="tip-item" style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 122, 195, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '20px' }}>⏰</span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '16px' : '18px' }}>Consistent Schedule</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
              Study at the same time daily to build a strong habit and improve retention.
            </p>
          </div>

          <div className="tip-item" style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(80, 198, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '20px' }}>🧠</span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '16px' : '18px' }}>Active Recall</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
              Test yourself frequently instead of just reviewing to strengthen memory connections.
            </p>
          </div>

          <div className="tip-item" style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '20px' }}>🔄</span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '16px' : '18px' }}>Spaced Repetition</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
              Review material at increasing intervals for better long-term retention.
            </p>
          </div>

          <div className="tip-item" style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '20px' }}>💤</span>
            </div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: isMobile ? '16px' : '18px' }}>Quality Sleep</h4>
            <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px', margin: 0 }}>
              Get 7-9 hours of sleep for optimal memory consolidation and cognitive function.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;