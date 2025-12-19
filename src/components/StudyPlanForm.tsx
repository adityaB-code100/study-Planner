import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

type Difficulty = 'easy' | 'medium' | 'hard';

interface TopicInput {
  course: string;
  topic: string;
  difficulty: Difficulty;
}

interface FormState {
  student_name: string;
  exam_date: string;
  daily_hours: string;
  topics: TopicInput[];
}

interface PlanItem {
  day: string;
  course: string;
  topic: string;
  difficulty: Difficulty;
  suggested_minutes: number;
  ai_hint?: string;
  part?: number | null;
  break_after?: number | null;
}

interface AiMeta {
  model: string;
  summary: string;
  tips: string[];
  exam_date?: string;
}

interface PlanResponse {
  message: string;
  plan_id: string;
  student_name: string;
  exam_date: string;
  daily_hours: string;
  plan: PlanItem[];
  ai?: AiMeta;
}

const StudyPlanForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({
    student_name: '',
    exam_date: '',
    daily_hours: '3',
    topics: [{ course: '', topic: '', difficulty: 'medium' }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size for responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input
  };

  const handleTopicChange = (index: number, field: keyof TopicInput, value: string) => {
    setFormData(prev => {
      const topics = [...prev.topics];
      topics[index] = { ...topics[index], [field]: value } as TopicInput;
      return { ...prev, topics };
    });
    setError(''); // Clear error on input
  };

  const addTopic = () =>
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, { course: '', topic: '', difficulty: 'medium' }],
    }));

  const removeTopic = (index: number) => {
    if (formData.topics.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    // Get user token
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = user.user_id || sessionStorage.getItem('token');

    if (!token) {
      setError('Please login first');
      setIsLoading(false);
      navigate('/auth');
      return;
    }

    // Validate form
    if (formData.topics.some(topic => !topic.topic.trim())) {
      setError('Please fill in all topic fields');
      setIsLoading(false);
      return;
    }

    try {
      const requestData = {
        student_name: formData.student_name || user.name || 'Student',
        exam_date: formData.exam_date,
        daily_hours: formData.daily_hours,
        topics: formData.topics.filter(topic => topic.topic.trim())
      };

      console.log('Sending request:', requestData); // Debug log

      const apiUrl = API_BASE ? `${API_BASE}/api/generate-plan` : '/api/generate-plan';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status); // Debug log

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }

      // Store plan data
      const planData = {
        plan_id: data.plan_id,
        student_name: data.student_name,
        exam_date: data.exam_date,
        daily_hours: data.daily_hours,
        plan: data.plan,
        ai: data.ai,
        user_id: user.user_id
      };

      sessionStorage.setItem('studyPlan', JSON.stringify(planData));
      
      // Show success message
      alert('✅ Study plan generated successfully!');
      
      // Navigate to plan view
      navigate('/plan');
    } catch (err: any) {
      console.error('Generate plan error:', err);
      setError(err.message || 'Could not generate plan. Please try again.');
      alert(`❌ Error: ${err.message || 'Failed to generate plan'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="hero">
        <p className="eyebrow">AI study planner • personalized learning</p>
        <h1>
          🚀 Create Your <span className="accent">Study Plan</span>
        </h1>
        <p className="lead">
          Add your topics, set difficulty levels, and get a personalized study schedule.
        </p>
        <div className="hero-badges">
          <span className="chip chip-ghost">🧠 Smart Scheduling</span>
          <span className="chip chip-ghost">⏱️ Time Management</span>
          <span className="chip chip-ghost">📊 Progress Tracking</span>
        </div>
      </div>

      <div className="glass-card">
        <div className="card-header-inline">
          <div>
            <p className="eyebrow">Plan Creator</p>
            <h3>Build Your Study Schedule</h3>
          </div>
          <div className="ai-pill">🤖 AI Assistant</div>
        </div>

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="input-stack">
            <label className="form-label">Your Name</label>
            <input
              type="text"
              name="student_name"
              className="input-neo"
              placeholder="Enter your name"
              value={formData.student_name}
              onChange={handleInputChange}
            />
            <p className="input-hint">Optional - defaults to your account name</p>
          </div>

          <div className="grid-two">
            <div className="input-stack">
              <label className="form-label">Exam Date (Optional)</label>
              <input
                type="date"
                name="exam_date"
                className="input-neo"
                value={formData.exam_date}
                onChange={handleInputChange}
              />
              <p className="input-hint">YYYY-MM-DD format</p>
            </div>
            <div className="input-stack">
              <label className="form-label">Daily Study Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                name="daily_hours"
                className="input-neo"
                value={formData.daily_hours}
                onChange={handleInputChange}
                required
              />
              <p className="input-hint">Recommended: 2-4 hours</p>
            </div>
          </div>

          <div className="topics-header">
            <div>
              <p className="eyebrow">Study Topics</p>
              <h4 style={{ fontSize: isMobile ? '20px' : '24px' }}>Add Your Learning Topics</h4>
              <p className="muted" style={{ fontSize: isMobile ? '13px' : '14px' }}>Each topic will be scheduled based on difficulty and available time.</p>
            </div>
            <button 
              type="button" 
              className="btn-primary-neo btn-mini" 
              onClick={addTopic}
              style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '8px 12px' : '10px 14px' }}
            >
              + Add Topic
            </button>
          </div>

          <div className="topics-wrap">
            {formData.topics.map((item, index) => (
              <div key={index} className={`topic-row-neo ${isMobile ? 'mobile' : ''}`}>
                <div className="input-stack">
                  <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Subject/Course</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="e.g., Mathematics, Physics"
                    value={item.course}
                    onChange={e => handleTopicChange(index, 'course', e.target.value)}
                    required
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                  />
                </div>
                <div className="input-stack">
                  <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Topic Name *</label>
                  <input
                    type="text"
                    className="input-neo"
                    placeholder="e.g., Calculus, Thermodynamics"
                    value={item.topic}
                    onChange={e => handleTopicChange(index, 'topic', e.target.value)}
                    required
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                  />
                </div>
                <div className="input-stack">
                  <label className="form-label" style={{ fontSize: isMobile ? '14px' : '16px' }}>Difficulty</label>
                  <select
                    className="input-neo select"
                    value={item.difficulty}
                    onChange={e => handleTopicChange(index, 'difficulty', e.target.value as Difficulty)}
                    style={{ fontSize: isMobile ? '16px' : 'inherit' }}
                  >
                    <option value="easy">Easy 😊 (Less time)</option>
                    <option value="medium">Medium ⚡ (Standard)</option>
                    <option value="hard">Hard 🔥 (More time)</option>
                  </select>
                </div>
                <div className="topic-actions">
                  <button
                    type="button"
                    className="btn-ghost danger btn-mini"
                    onClick={() => removeTopic(index)}
                    disabled={formData.topics.length === 1}
                    title="Remove this topic"
                    style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '6px 10px' : '8px 12px' }}
                  >
                    × Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`submit-row ${isMobile ? 'mobile' : ''}`}>
            <div className="form-info">
              <span className="info-icon">💡</span>
              <p style={{ fontSize: isMobile ? '13px' : '14px' }}>AI will create a balanced schedule with breaks and optimal study intervals.</p>
            </div>
            <div className={`form-actions ${isMobile ? 'mobile' : ''}`}>
              <button 
                type="button" 
                className="btn-ghost"
                onClick={() => navigate('/dashboard')}
                style={{ fontSize: isMobile ? '14px' : '16px', padding: isMobile ? '10px 14px' : '12px 16px' }}
              >
                ← Back to Dashboard
              </button>
              <button 
                type="submit" 
                className="btn-primary-neo" 
                disabled={isLoading || formData.topics.some(t => !t.topic.trim())}
                style={{ fontSize: isMobile ? '16px' : '18px', padding: isMobile ? '12px 16px' : '14px 20px' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Generating Plan...
                  </>
                ) : (
                  '🚀 Generate Study Plan'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudyPlanForm;