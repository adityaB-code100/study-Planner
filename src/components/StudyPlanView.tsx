import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

type Difficulty = 'easy' | 'medium' | 'hard';

interface PlanItem {
  day: string;
  course: string;
  topic: string;
  difficulty: Difficulty;
  suggested_minutes: number;
  ai_hint?: string;
  part?: number | null;
  break_after?: number | null;
  completed?: boolean;
  time_spent?: number;
}

interface PlanResponse {
  plan_id: string;
  user_id: string;
  student_name: string;
  exam_date: string;
  daily_hours: string;
  created_at: string;
  plan: PlanItem[];
}

const difficultyTone: Record<Difficulty, { emoji: string }> = {
  easy: { emoji: '😊' },
  medium: { emoji: '⚡' },
  hard: { emoji: '🔥' },
};

const StudyPlanView: React.FC = () => {
  const navigate = useNavigate();
  const [planData, setPlanData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [lastHint, setLastHint] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const fetchPlan = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user token
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

      // Try to get plan from session storage first
      const storedPlan = sessionStorage.getItem('studyPlan');
      if (storedPlan) {
        const parsedPlan = JSON.parse(storedPlan);
        if (parsedPlan && parsedPlan.plan) {
          setPlanData(parsedPlan);
          setLoading(false);
          return;
        }
      }

      // If no stored plan, try to fetch latest plan from API
      const apiUrl = API_BASE ? `${API_BASE}/api/user-plans` : '/api/user-plans';
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.plans && data.plans.length > 0) {
          // Get the most recent plan
          const latestPlan = data.plans[0];
          setPlanData(latestPlan);
          sessionStorage.setItem('studyPlan', JSON.stringify(latestPlan));
        } else {
          setError('No study plans found. Please create a plan first.');
        }
      } else {
        throw new Error('Failed to fetch study plans');
      }
      
    } catch (error: any) {
      console.error('Failed to fetch study plan:', error);
      setError('Failed to load study plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const saveProgress = useCallback(async (taskIndex: number, completed: boolean) => {
    if (!planData) return;

    try {
      const userStr = sessionStorage.getItem('user');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      const token = user.user_id || user.token;
      
      const updateUrl = API_BASE ? `${API_BASE}/api/update-progress` : '/api/update-progress';
      await fetch(updateUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: planData.plan_id,
          task_index: taskIndex,
          completed,
          time_spent: 300 // 5 minutes for demo
        }),
      });

      // Update local state
      const updatedPlan = { ...planData };
      if (updatedPlan.plan[taskIndex]) {
        updatedPlan.plan[taskIndex].completed = completed;
        updatedPlan.plan[taskIndex].time_spent = 
          (updatedPlan.plan[taskIndex].time_spent || 0) + 300;
      }
      
      setPlanData(updatedPlan);
      sessionStorage.setItem('studyPlan', JSON.stringify(updatedPlan));
      
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [planData]);

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
    fetchPlan();
  }, [fetchPlan]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((s) => Math.max(0, s - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0 && activeId && planData) {
      setIsRunning(false);
      const taskIndex = parseInt(activeId.split('-')[0]);
      saveProgress(taskIndex, true);
      setLastHint('✅ Topic completed!');
    }
  }, [remainingSeconds, activeId, planData, saveProgress]);

  const startTimer = (taskIndex: number, minutes: number) => {
    setActiveId(`${taskIndex}`);
    setRemainingSeconds(minutes * 60);
    setIsRunning(true);
    setLastHint(null);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (activeId && planData) {
      const taskIndex = parseInt(activeId.split('-')[0]);
      saveProgress(taskIndex, false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="page-grid">
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px' }}></div>
          <h3>Loading study plan...</h3>
          <p className="muted">Please wait while we fetch your plan</p>
        </div>
      </div>
    );
  }

  if (error || !planData) {
    return (
      <div className="page-grid">
        <div className="glass-card error-banner">
          <h3>⚠️ No Study Plan Found</h3>
          <p>{error || 'You need to create a study plan first.'}</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-primary-neo" 
              onClick={() => navigate('/create-plan')}
            >
              Create New Plan
            </button>
            <button 
              className="btn-ghost" 
              onClick={fetchPlan}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <div className="hero">
        <h1 style={{ fontSize: isMobile ? '24px' : '32px' }}>
          Study Plan for {planData.student_name} 🎯
        </h1>
        <p style={{ fontSize: isMobile ? '14px' : '16px' }}>
          Daily {planData.daily_hours}h • {planData.plan?.length || 0} topics
        </p>
      </div>

      {planData.plan && planData.plan.length > 0 ? (
        <>
          {planData.plan.map((task, index) => {
            const difficulty = task.difficulty as Difficulty;
            const emoji = difficultyTone[difficulty]?.emoji || '⚡';
            
            return (
              <div key={index} className="glass-card" style={{ padding: isMobile ? '14px' : '18px' }}>
                <h3 style={{ fontSize: isMobile ? '18px' : '24px' }}>
                  {emoji} {task.course}
                </h3>
                <p style={{ fontSize: isMobile ? '14px' : '16px', marginBottom: '8px' }}>{task.topic}</p>

                <p style={{ fontSize: isMobile ? '13px' : '14px', marginBottom: '12px' }}>
                  ⏱ {task.suggested_minutes} min{' '}
                  {task.completed && '✅ Completed'}
                </p>

                {activeId === `${index}` ? (
                  <>
                    <p style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '12px' }}>⌛ {formatTime(remainingSeconds)}</p>
                    {isRunning ? (
                      <button 
                        className="btn-mini" 
                        onClick={pauseTimer}
                        style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '8px 12px' : '10px 14px' }}
                      >
                        ⏸ Pause
                      </button>
                    ) : (
                      <button 
                        className="btn-mini" 
                        onClick={() => setIsRunning(true)}
                        style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '8px 12px' : '10px 14px' }}
                      >
                        ▶ Resume
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    className="btn-mini" 
                    onClick={() => startTimer(index, task.suggested_minutes)}
                    disabled={task.completed}
                    style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '8px 12px' : '10px 14px' }}
                  >
                    {task.completed ? '✓ Completed' : '▶ Start'}
                  </button>
                )}
              </div>
            );
          })}

          {lastHint && <div className="chip chip-solid">{lastHint}</div>}
        </>
      ) : (
        <div className="glass-card">
          <h3>No tasks in this plan</h3>
          <p>This study plan doesn't have any tasks yet.</p>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '8px' : '1rem', 
        marginTop: '1rem',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-ghost"
          style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '10px 14px' : '12px 16px' }}
        >
          ← Back to Home
        </button>
        <button 
          onClick={() => navigate('/create-plan')} 
          className="btn-primary-neo"
          style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '10px 14px' : '12px 16px' }}
        >
          Create New Plan
        </button>
      </div>
    </div>
  );
};

export default StudyPlanView;