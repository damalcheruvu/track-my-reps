import { useState, useEffect, useRef } from 'react'
import './App.css'
import { useAuth, useSupabaseSync } from './useSupabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_WEEKLY_PLAN = {
  Monday: {
    isRest: false,
    categories: [
      {
        name: 'Warm Up',
        type: 'warmup',
        exercises: [
          { name: '5-10 min light cardio', sets: 1, reps: 1, weight: null, isStatic: true },
        ]
      },
      {
        name: 'Cardio',
        type: 'cardio',
        exercises: [
          { name: 'Running/Cycling/Swimming', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      },
      {
        name: 'Strength Training',
        type: 'strength',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 8, weight: null },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: null },
          { name: 'Cable Flyes', sets: 3, reps: 12, weight: null },
        ]
      },
      {
        name: 'Cool Down',
        type: 'cooldown',
        exercises: [
          { name: 'Stretching & Mobility', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      }
    ]
  },
  Tuesday: {
    isRest: false,
    categories: [
      {
        name: 'Warm Up',
        type: 'warmup',
        exercises: [
          { name: '5-10 min light cardio', sets: 1, reps: 1, weight: null, isStatic: true },
        ]
      },
      {
        name: 'Cardio',
        type: 'cardio',
        exercises: [
          { name: 'Running/Cycling/Swimming', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      },
      {
        name: 'Strength Training',
        type: 'strength',
        exercises: [
          { name: 'Pull-ups', sets: 3, reps: 8, weight: null },
          { name: 'Barbell Rows', sets: 3, reps: 10, weight: null },
          { name: 'Lat Pulldown', sets: 3, reps: 12, weight: null },
        ]
      },
      {
        name: 'Cool Down',
        type: 'cooldown',
        exercises: [
          { name: 'Stretching & Mobility', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      }
    ]
  },
  Wednesday: { isRest: true, categories: [] },
  Thursday: {
    isRest: false,
    categories: [
      {
        name: 'Warm Up',
        type: 'warmup',
        exercises: [
          { name: '5-10 min light cardio', sets: 1, reps: 1, weight: null, isStatic: true },
        ]
      },
      {
        name: 'Cardio',
        type: 'cardio',
        exercises: [
          { name: 'Running/Cycling/Swimming', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      },
      {
        name: 'Strength Training',
        type: 'strength',
        exercises: [
          { name: 'Squats', sets: 4, reps: 10, weight: null },
          { name: 'Leg Press', sets: 3, reps: 12, weight: null },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: null },
        ]
      },
      {
        name: 'Cool Down',
        type: 'cooldown',
        exercises: [
          { name: 'Stretching & Mobility', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      }
    ]
  },
  Friday: {
    isRest: false,
    categories: [
      {
        name: 'Warm Up',
        type: 'warmup',
        exercises: [
          { name: '5-10 min light cardio', sets: 1, reps: 1, weight: null, isStatic: true },
        ]
      },
      {
        name: 'Cardio',
        type: 'cardio',
        exercises: [
          { name: 'Running/Cycling/Swimming', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      },
      {
        name: 'Strength Training',
        type: 'strength',
        exercises: [
          { name: 'Overhead Press', sets: 3, reps: 10, weight: null },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: null },
          { name: 'Barbell Curls', sets: 3, reps: 10, weight: null },
          { name: 'Tricep Dips', sets: 3, reps: 10, weight: null },
        ]
      },
      {
        name: 'Cool Down',
        type: 'cooldown',
        exercises: [
          { name: 'Stretching & Mobility', sets: 1, reps: 1, weight: null, notesOnly: true },
        ]
      }
    ]
  },
  Saturday: { isRest: true, categories: [] },
  Sunday: { isRest: true, categories: [] },
};

function App() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [view, setView] = useState('tracker'); // 'tracker' or 'planner'
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const hasUpgraded = useRef(false); // Track if we've already upgraded
  
  // Local state for when not signed in
  const [localWeeklyPlan] = useState(() => {
    const saved = localStorage.getItem('weeklyWorkoutPlan');
    return saved ? JSON.parse(saved) : DEFAULT_WEEKLY_PLAN;
  });

  // Sync weekly plan with Supabase if signed in, otherwise use local
  const [weeklyPlan, setWeeklyPlan] = useSupabaseSync(
    user, 
    localWeeklyPlan, 
    'weeklyPlan'
  );
  
  // Auto-upgrade old plans to 4-category structure on login
  useEffect(() => {
    if (weeklyPlan && user && Object.keys(weeklyPlan).length > 0 && !hasUpgraded.current) {
      const needsUpgrade = Object.keys(weeklyPlan).some(day => {
        if (weeklyPlan[day].isRest) return false;
        const categories = weeklyPlan[day].categories || [];
        // Check if missing 'type' field or doesn't have 4 categories
        return categories.length < 4 || !categories.some(cat => cat.type);
      });
      
      if (needsUpgrade) {
        console.log('🔄 Upgrading plan to 4-category structure...', weeklyPlan);
        hasUpgraded.current = true; // Prevent multiple upgrades
        
        const upgraded = {};
        Object.keys(DEFAULT_WEEKLY_PLAN).forEach(day => {
          if (DEFAULT_WEEKLY_PLAN[day].isRest) {
            upgraded[day] = DEFAULT_WEEKLY_PLAN[day];
          } else {
            // Keep old strength exercises if they exist
            const oldStrengthExercises = weeklyPlan[day]?.categories?.[0]?.exercises || 
                                        DEFAULT_WEEKLY_PLAN[day].categories[2].exercises;
            
            upgraded[day] = {
              isRest: false,
              categories: [
                DEFAULT_WEEKLY_PLAN[day].categories[0], // Warm Up
                DEFAULT_WEEKLY_PLAN[day].categories[1], // Cardio
                {
                  ...DEFAULT_WEEKLY_PLAN[day].categories[2], // Strength Training
                  exercises: oldStrengthExercises
                },
                DEFAULT_WEEKLY_PLAN[day].categories[3], // Cool Down
              ]
            };
          }
        });
        console.log('✅ Plan upgraded! Setting new plan...');
        setWeeklyPlan(upgraded);
      }
    }
  }, [weeklyPlan, user]); // Run when weeklyPlan OR user changes
  
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1]; // Convert Sunday=0 to index 6
  });

  // Rest timer state
  const [restTimer, setRestTimer] = useState({ active: false, remaining: 0, duration: 90 });
  const [timerInterval, setTimerInterval] = useState(null);

  // Save to localStorage as backup when not signed in
  useEffect(() => {
    if (!user) {
      localStorage.setItem('weeklyWorkoutPlan', JSON.stringify(weeklyPlan));
    }
  }, [weeklyPlan, user]);

  // Load completion state from localStorage or initialize
  const [localCompletedSets] = useState(() => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('workoutState');
    
    if (saved) {
      const { date, state } = JSON.parse(saved);
      if (date === today) {
        return state;
      }
    }
    return {};
  });

  // Track workout data per set: { weight, reps, completed }
  const [setData, setSetData] = useSupabaseSync(
    user,
    {},
    'setData'
  );

  // Track exercise notes
  const [exerciseNotes, setExerciseNotes] = useSupabaseSync(
    user,
    {},
    'exerciseNotes'
  );

  // Track personal records (PRs)
  const [personalRecords, setPersonalRecords] = useSupabaseSync(
    user,
    {},
    'personalRecords'
  );

  // Track which exercise note inputs are visible
  const [showNoteInputs, setShowNoteInputs] = useState({});

  // Sync completed sets with Supabase if signed in, otherwise use local
  const [completedSets, setCompletedSets] = useSupabaseSync(
    user,
    localCompletedSets,
    'completedSets'
  );

  // Initialize completedSets for current day if not exists
  useEffect(() => {
    const todayPlan = weeklyPlan[currentDay];
    if (!todayPlan || todayPlan.isRest) return;
    
    if (!completedSets[currentDay]) {
      const newState = todayPlan.categories.map(category => 
        category.exercises.map(exercise => 
          Array(exercise.sets).fill(false)
        )
      );
      setCompletedSets(prev => ({ ...prev, [currentDay]: newState }));
    }
  }, [currentDay, weeklyPlan, completedSets]);

  // Save to localStorage as backup when not signed in
  useEffect(() => {
    if (!user) {
      const today = new Date().toDateString();
      localStorage.setItem('workoutState', JSON.stringify({
        date: today,
        state: completedSets
      }));
    }
  }, [completedSets, user]);

  const toggleSet = (categoryIndex, exerciseIndex, setIndex) => {
    setCompletedSets(prev => {
      const dayState = prev[currentDay] || [];
      
      // Ensure dayState is properly initialized
      if (dayState.length === 0) {
        const todayPlan = weeklyPlan[currentDay];
        const initialState = todayPlan.categories.map(category => 
          category.exercises.map(exercise => 
            Array(exercise.sets).fill(false)
          )
        );
        const newState = initialState.map((category, ci) =>
          category.map((exercise, ei) =>
            exercise.map((set, si) =>
              ci === categoryIndex && ei === exerciseIndex && si === setIndex
                ? true
                : set
            )
          )
        );
        return { ...prev, [currentDay]: newState };
      }
      
      const newDayState = dayState.map((category, ci) =>
        category.map((exercise, ei) =>
          exercise.map((set, si) =>
            ci === categoryIndex && ei === exerciseIndex && si === setIndex
              ? !set
              : set
          )
        )
      );
      
      // Start rest timer and check for PR if set was just completed
      const wasCompleted = dayState[categoryIndex]?.[exerciseIndex]?.[setIndex];
      if (!wasCompleted) {
        startRestTimer();
        
        // Check for PR
        const todayPlan = weeklyPlan[currentDay];
        const exercise = todayPlan.categories[categoryIndex]?.exercises[exerciseIndex];
        const data = getSetData(categoryIndex, exerciseIndex, setIndex);
        if (exercise && data.weight && data.reps) {
          const isNewPR = checkAndUpdatePR(exercise.name, data.weight, data.reps);
          if (isNewPR) {
            setTimeout(() => alert(`🎉 New PR for ${exercise.name}! ${data.weight}kg × ${data.reps} reps`), 100);
          }
        }
      }
      
      return { ...prev, [currentDay]: newDayState };
    });
  };

  const updateSetData = (categoryIndex, exerciseIndex, setIndex, field, value) => {
    const key = `${currentDay}-${categoryIndex}-${exerciseIndex}-${setIndex}`;
    setSetData(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const getSetData = (categoryIndex, exerciseIndex, setIndex) => {
    const key = `${currentDay}-${categoryIndex}-${exerciseIndex}-${setIndex}`;
    return setData[key] || { weight: '', reps: '' };
  };

  const startRestTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setRestTimer({ active: true, remaining: restTimer.duration, duration: restTimer.duration });
    
    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev.remaining <= 1) {
          clearInterval(interval);
          return { ...prev, active: false, remaining: 0 };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  const skipRestTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setRestTimer(prev => ({ ...prev, active: false, remaining: 0 }));
  };

  const addTime = (seconds) => {
    setRestTimer(prev => ({
      ...prev,
      remaining: prev.remaining + seconds,
      duration: prev.duration + seconds
    }));
  };

  // Calculate 1RM using Epley formula: weight × (1 + reps/30)
  const calculate1RM = (weight, reps) => {
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30));
  };

  // Get or update exercise note
  const getExerciseNote = (exerciseName) => {
    return exerciseNotes[exerciseName] || '';
  };

  const updateExerciseNote = (exerciseName, note) => {
    setExerciseNotes(prev => ({ ...prev, [exerciseName]: note }));
  };

  // Get exercise PR
  const getExercisePR = (exerciseName) => {
    return personalRecords[exerciseName] || { weight: 0, reps: 0, date: null, oneRM: 0 };
  };

  // Update PR if new record is set
  const checkAndUpdatePR = (exerciseName, weight, reps) => {
    if (!weight || !reps) return;
    
    const oneRM = calculate1RM(Number(weight), Number(reps));
    const currentPR = getExercisePR(exerciseName);
    
    if (oneRM > currentPR.oneRM) {
      setPersonalRecords(prev => ({
        ...prev,
        [exerciseName]: {
          weight: Number(weight),
          reps: Number(reps),
          date: new Date().toISOString(),
          oneRM
        }
      }));
      return true; // New PR!
    }
    return false;
  };

  const resetAll = () => {
    if (window.confirm('Reset all checkboxes for today?')) {
      const todayPlan = weeklyPlan[currentDay];
      const newState = todayPlan.categories.map(category => 
        category.exercises.map(exercise => 
          Array(exercise.sets).fill(false)
        )
      );
      setCompletedSets(prev => ({ ...prev, [currentDay]: newState }));
    }
  };

  const getTotalProgress = () => {
    const dayState = completedSets[currentDay] || [];
    let completed = 0;
    let total = 0;
    dayState.forEach(category => {
      category.forEach(exercise => {
        exercise.forEach(set => {
          total++;
          if (set) completed++;
        });
      });
    });
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // Planner functions
  const toggleRestDay = (day) => {
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isRest: !prev[day].isRest,
        categories: !prev[day].isRest ? [] : prev[day].categories
      }
    }));
  };

  const addCategory = (day) => {
    const categoryName = prompt('Enter category name (e.g., Chest, Back, Legs):');
    if (!categoryName) return;
    
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        categories: [...prev[day].categories, { name: categoryName, exercises: [] }]
      }
    }));
  };

  const removeCategory = (day, categoryIndex) => {
    if (!window.confirm('Remove this category?')) return;
    setWeeklyPlan(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        categories: prev[day].categories.filter((_, i) => i !== categoryIndex)
      }
    }));
  };

  const addExercise = (day, categoryIndex) => {
    const name = prompt('Exercise name:');
    if (!name) return;
    const sets = parseInt(prompt('Number of sets:', '3'));
    const reps = prompt('Reps (e.g., 8-12 or 15):', '8-12');
    
    if (!name || !sets || !reps) return;

    setWeeklyPlan(prev => {
      const newPlan = { ...prev };
      newPlan[day].categories[categoryIndex].exercises.push({ name, sets, reps });
      return newPlan;
    });
  };

  const removeExercise = (day, categoryIndex, exerciseIndex) => {
    setWeeklyPlan(prev => {
      const newPlan = { ...prev };
      newPlan[day].categories[categoryIndex].exercises = 
        newPlan[day].categories[categoryIndex].exercises.filter((_, i) => i !== exerciseIndex);
      return newPlan;
    });
  };

  const copyDayPlan = (fromDay, toDay) => {
    if (!window.confirm(`Copy ${fromDay}'s plan to ${toDay}?`)) return;
    setWeeklyPlan(prev => ({
      ...prev,
      [toDay]: JSON.parse(JSON.stringify(prev[fromDay]))
    }));
  };

  const progress = getTotalProgress();
  const todayPlan = weeklyPlan[currentDay];

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in screen if not authenticated
  if (!user) {
    const handleAuth = async (e) => {
      e.preventDefault();
      setAuthError('');
      setAuthLoading(true);
      
      try {
        if (authMode === 'signup') {
          await signUp(email, password);
          alert('Account created! Please check your email to verify your account.');
        } else {
          await signIn(email, password);
        }
      } catch (error) {
        setAuthError(error.message || 'Authentication failed');
      } finally {
        setAuthLoading(false);
      }
    };

    return (
      <div className="app">
        <div className="sign-in-screen">
          <div className="sign-in-card">
            <h1>💪 Workout Tracker</h1>
            <p className="sign-in-subtitle">Track your workouts across all devices</p>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <span>Custom weekly workout plans</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <span>Track your progress daily</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">☁️</span>
                <span>Sync across all devices</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Mobile-friendly interface</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-input"
              />
              
              {authError && <p className="auth-error">{authError}</p>}
              
              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={authLoading}
              >
                {authLoading ? 'Loading...' : (authMode === 'signup' ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <button 
              className="auth-toggle-btn" 
              onClick={() => {
                setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
                setAuthError('');
              }}
            >
              {authMode === 'signup' 
                ? 'Already have an account? Sign In' 
                : "Don't have an account? Sign Up"}
            </button>

            <p className="privacy-note">
              Your data is private and synced securely with Supabase
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'planner') {
    return (
      <div className="app">
        <header className="header">
          <h1>📅 Weekly Planner</h1>
          <div className="header-buttons">
            <button className="nav-button" onClick={() => setView('tracker')}>
              Back to Tracker
            </button>
            <div className="user-info">
              <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
              <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
            </div>
          </div>
        </header>

        <div className="planner-container">
          {DAYS.map(day => (
            <div key={day} className="day-planner">
              <div className="day-header">
                <h2>{day}</h2>
                <div className="day-controls">
                  <label className="rest-toggle">
                    <input
                      type="checkbox"
                      checked={weeklyPlan[day].isRest}
                      onChange={() => toggleRestDay(day)}
                    />
                    <span>Rest Day</span>
                  </label>
                </div>
              </div>

              {weeklyPlan[day].isRest ? (
                <div className="rest-day-message">🌴 Rest & Recovery</div>
              ) : (
                <>
                  {weeklyPlan[day].categories.map((category, catIndex) => (
                    <div key={catIndex} className="planner-category">
                      <div className="category-header-edit">
                        <h3>{category.name}</h3>
                        <button 
                          className="remove-btn"
                          onClick={() => removeCategory(day, catIndex)}
                        >
                          ✕
                        </button>
                      </div>
                      
                      {category.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="exercise-edit">
                          <div className="exercise-info">
                            <span className="exercise-name-small">{exercise.name}</span>
                            <span className="exercise-details">{exercise.sets} × {exercise.reps}</span>
                          </div>
                          <button 
                            className="remove-btn-small"
                            onClick={() => removeExercise(day, catIndex, exIndex)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      <button 
                        className="add-exercise-btn"
                        onClick={() => addExercise(day, catIndex)}
                      >
                        + Add Exercise
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    className="add-category-btn"
                    onClick={() => addCategory(day)}
                  >
                    + Add Category
                  </button>

                  {DAYS.some(d => d !== day && !weeklyPlan[d].isRest) && (
                    <select 
                      className="copy-select"
                      onChange={(e) => {
                        if (e.target.value) {
                          copyDayPlan(e.target.value, day);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Copy from another day...</option>
                      {DAYS.filter(d => d !== day && !weeklyPlan[d].isRest).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>💪 Workout Tracker</h1>
          <div className="user-info">
            <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
            <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
          </div>
        </div>
        <div className="day-selector">
          {DAYS.map(day => (
            <button
              key={day}
              className={`day-btn ${currentDay === day ? 'active' : ''} ${weeklyPlan[day].isRest ? 'rest' : ''}`}
              onClick={() => setCurrentDay(day)}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
        <p className="date">{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </header>

      {todayPlan.isRest ? (
        <div className="rest-day-view">
          <div className="rest-card">
            <div className="rest-icon">🌴</div>
            <h2>Rest Day</h2>
            <p>Take it easy and let your muscles recover!</p>
            <button className="edit-plan-btn" onClick={() => setView('planner')}>
              Edit Weekly Plan
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress.percentage}%` }}></div>
            </div>
            <p className="progress-text">
              {progress.completed} / {progress.total} sets completed ({progress.percentage}%)
            </p>
          </div>

          <div className="workout-container">
            {todayPlan.categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="category-section">
                <h2 className="category-title">{category.name}</h2>
                
                {category.exercises.map((exercise, exerciseIndex) => {
                  const pr = getExercisePR(exercise.name);
                  const note = getExerciseNote(exercise.name);
                  const noteKey = `${currentDay}-${categoryIndex}-${exerciseIndex}`;
                  const showNoteInput = showNoteInputs[noteKey] || false;
                  const isNotesOnly = exercise.notesOnly || category.type === 'cardio' || category.type === 'cooldown';
                  const isStatic = exercise.isStatic || category.type === 'warmup';
                  
                  return (
                    <div key={exerciseIndex} className={`exercise-card ${isNotesOnly ? 'notes-only' : ''} ${isStatic ? 'static' : ''}`}>
                    <div className="exercise-header">
                      <div className="exercise-title-section">
                        <h3 className="exercise-name">{exercise.name}</h3>
                        {pr.oneRM > 0 && !isNotesOnly && (
                          <span className="pr-badge" title={`PR: ${pr.weight}kg × ${pr.reps} reps on ${new Date(pr.date).toLocaleDateString()}`}>
                            🏆 1RM: {pr.oneRM}kg
                          </span>
                        )}
                      </div>
                      {!isNotesOnly && !isStatic && (
                        <span className="exercise-reps">{exercise.sets} × {exercise.reps}</span>
                      )}
                    </div>
                    
                    {/* Show sets first for strength training exercises */}
                    {!isNotesOnly && !isStatic && (
                      <div className="sets-container">
                        {Array.from({ length: exercise.sets }, (_, setIndex) => {
                          const data = getSetData(categoryIndex, exerciseIndex, setIndex);
                          const isCompleted = completedSets[currentDay]?.[categoryIndex]?.[exerciseIndex]?.[setIndex] || false;
                          
                          return (
                            <div key={setIndex} className={`set-row ${isCompleted ? 'completed' : ''}`}>
                              <span className="set-number">{setIndex + 1}</span>
                              <input
                                type="number"
                                className="weight-input"
                                placeholder="kg"
                                value={data.weight || ''}
                                onChange={(e) => updateSetData(categoryIndex, exerciseIndex, setIndex, 'weight', e.target.value)}
                              />
                              <span className="input-separator">×</span>
                              <input
                                type="number"
                                className="reps-input"
                                placeholder="reps"
                                value={data.reps || ''}
                                onChange={(e) => updateSetData(categoryIndex, exerciseIndex, setIndex, 'reps', e.target.value)}
                              />
                              <label className="set-checkbox-compact">
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={() => toggleSet(categoryIndex, exerciseIndex, setIndex)}
                                />
                                <span className="checkmark">✓</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Static exercises just show as complete */}
                    {isStatic && (
                      <div className="static-complete">
                        <label className="static-checkbox">
                          <input
                            type="checkbox"
                            checked={completedSets[currentDay]?.[categoryIndex]?.[exerciseIndex]?.[0] || false}
                            onChange={() => toggleSet(categoryIndex, exerciseIndex, 0)}
                          />
                          <span>Mark as complete</span>
                        </label>
                      </div>
                    )}
                    
                    {/* Exercise Notes - AFTER the workout */}
                    <div className="exercise-notes-section">
                      {showNoteInput ? (
                        <div className="note-input-container">
                          <textarea
                            className="note-input"
                            placeholder={isNotesOnly ? "Add details (duration, distance, time...)" : "Add notes (e.g., form tips, how you felt...)"}
                            value={note}
                            onChange={(e) => updateExerciseNote(exercise.name, e.target.value)}
                            rows={isNotesOnly ? 3 : 2}
                          />
                          <button className="note-btn" onClick={() => setShowNoteInputs(prev => ({ ...prev, [noteKey]: false }))}>Done</button>
                        </div>
                      ) : (
                        <button className="note-btn-show" onClick={() => setShowNoteInputs(prev => ({ ...prev, [noteKey]: true }))}>
                          📝 {note ? 'Edit Note' : (isNotesOnly ? 'Add Details' : 'Add Note')}
                        </button>
                      )}
                      {note && !showNoteInput && (
                        <p className="exercise-note">{note}</p>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Rest Timer */}
          {restTimer.active && (
            <div className="rest-timer">
              <div className="timer-content">
                <span className="timer-label">Rest</span>
                <span className="timer-display">
                  {Math.floor(restTimer.remaining / 60)}:{String(restTimer.remaining % 60).padStart(2, '0')}
                </span>
                <div className="timer-controls">
                  <button className="timer-btn" onClick={() => addTime(15)}>+15s</button>
                  <button className="timer-btn" onClick={() => addTime(30)}>+30s</button>
                  <button className="timer-btn skip" onClick={skipRestTimer}>Skip</button>
                </div>
              </div>
            </div>
          )}

          <div className="footer">
            <button className="edit-plan-btn" onClick={() => setView('planner')}>
              Edit Plan
            </button>
            <button className="reset-button" onClick={resetAll}>
              Reset Today
            </button>
          </div>
        </>
      )}

      {/* Bottom Navigation for Mobile */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${view === 'tracker' ? 'active' : ''}`}
          onClick={() => setView('tracker')}
        >
          <div className="nav-icon">💪</div>
          <span>Workout</span>
        </button>
        <button 
          className={`nav-item ${view === 'planner' ? 'active' : ''}`}
          onClick={() => setView('planner')}
        >
          <div className="nav-icon">📅</div>
          <span>Plan</span>
        </button>
        <button 
          className="nav-item"
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm(`Signed in as ${user?.email}\n\nDo you want to sign out?`)) {
              signOut();
            }
          }}
        >
          <div className="nav-icon">👤</div>
          <span>{user?.email || 'Account'}</span>
        </button>
      </nav>
    </div>
  );
}

export default App
