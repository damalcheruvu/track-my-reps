import { useState, useEffect } from 'react'
import './App.css'
import { useAuth, useFirestoreSync } from './useFirebase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_WEEKLY_PLAN = {
  Monday: {
    isRest: false,
    categories: [
      {
        name: 'Chest',
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 8, weight: null },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: null },
          { name: 'Cable Flyes', sets: 3, reps: 12, weight: null },
        ]
      }
    ]
  },
  Tuesday: {
    isRest: false,
    categories: [
      {
        name: 'Back',
        exercises: [
          { name: 'Pull-ups', sets: 3, reps: 8, weight: null },
          { name: 'Barbell Rows', sets: 3, reps: 10, weight: null },
          { name: 'Lat Pulldown', sets: 3, reps: 12, weight: null },
        ]
      }
    ]
  },
  Wednesday: { isRest: true, categories: [] },
  Thursday: {
    isRest: false,
    categories: [
      {
        name: 'Legs',
        exercises: [
          { name: 'Squats', sets: 4, reps: 10, weight: null },
          { name: 'Leg Press', sets: 3, reps: 12, weight: null },
          { name: 'Leg Curls', sets: 3, reps: 12, weight: null },
        ]
      }
    ]
  },
  Friday: {
    isRest: false,
    categories: [
      {
        name: 'Shoulders & Arms',
        exercises: [
          { name: 'Overhead Press', sets: 3, reps: 10, weight: null },
          { name: 'Lateral Raises', sets: 3, reps: 12, weight: null },
          { name: 'Barbell Curls', sets: 3, reps: 10, weight: null },
          { name: 'Tricep Dips', sets: 3, reps: 10, weight: null },
        ]
      }
    ]
  },
  Saturday: { isRest: true, categories: [] },
  Sunday: { isRest: true, categories: [] },
};

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [view, setView] = useState('tracker'); // 'tracker' or 'planner'
  
  // Local state for when not signed in
  const [localWeeklyPlan] = useState(() => {
    const saved = localStorage.getItem('weeklyWorkoutPlan');
    return saved ? JSON.parse(saved) : DEFAULT_WEEKLY_PLAN;
  });

  // Sync weekly plan with Firebase if signed in, otherwise use local
  const [weeklyPlan, setWeeklyPlan] = useFirestoreSync(
    user, 
    localWeeklyPlan, 
    'weeklyPlan'
  );
  
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1]; // Convert Sunday=0 to index 6
  });

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

  // Sync completed sets with Firebase if signed in, otherwise use local
  const [completedSets, setCompletedSets] = useFirestoreSync(
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
      return { ...prev, [currentDay]: newDayState };
    });
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

            <button className="google-sign-in-btn" onClick={signInWithGoogle}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>

            <p className="privacy-note">
              Your data is private and synced securely to your Google account
            </p>

            <button className="continue-local-btn" onClick={() => {
              // Allow using app without sign-in (local storage only)
              alert('Note: Without signing in, your data will only be saved on this device and may be lost if you clear browser data.');
            }}>
              Continue without sign-in (Local only)
            </button>
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
                
                {category.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="exercise-card">
                    <div className="exercise-header">
                      <h3 className="exercise-name">{exercise.name}</h3>
                      <span className="exercise-reps">{exercise.sets} × {exercise.reps}</span>
                    </div>
                    
                    <div className="sets-container">
                      {Array.from({ length: exercise.sets }, (_, setIndex) => (
                        <label key={setIndex} className="set-checkbox">
                          <input
                            type="checkbox"
                            checked={completedSets[currentDay]?.[categoryIndex]?.[exerciseIndex]?.[setIndex] || false}
                            onChange={() => toggleSet(categoryIndex, exerciseIndex, setIndex)}
                          />
                          <span className="checkbox-label">Set {setIndex + 1}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

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
          onClick={user ? signOut : signInWithGoogle}
        >
          <div className="nav-icon">{user ? '👤' : '🔐'}</div>
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </button>
      </nav>
    </div>
  );
}

export default App
