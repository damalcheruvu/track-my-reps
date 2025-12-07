import { useState, useEffect, useRef } from 'react'
import './App.css'
import { useAuth, useFirestoreSync } from './useFirebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_WEEKLY_PLAN = {
  Monday: {
    isRest: false,
    exercises: [
      { name: 'Bench Press', sets: 3, reps: 8, weight: null },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: null },
      { name: 'Cable Flyes', sets: 3, reps: 12, weight: null },
    ]
  },
  Tuesday: {
    isRest: false,
    exercises: [
      { name: 'Pull-ups', sets: 3, reps: 8, weight: null },
      { name: 'Barbell Rows', sets: 3, reps: 10, weight: null },
      { name: 'Lat Pulldown', sets: 3, reps: 12, weight: null },
    ]
  },
  Wednesday: { isRest: true, exercises: [] },
  Thursday: {
    isRest: false,
    exercises: [
      { name: 'Squats', sets: 4, reps: 10, weight: null },
      { name: 'Leg Press', sets: 3, reps: 12, weight: null },
      { name: 'Leg Curls', sets: 3, reps: 12, weight: null },
    ]
  },
  Friday: {
    isRest: false,
    exercises: [
      { name: 'Overhead Press', sets: 3, reps: 10, weight: null },
      { name: 'Lateral Raises', sets: 3, reps: 12, weight: null },
      { name: 'Barbell Curls', sets: 3, reps: 10, weight: null },
      { name: 'Tricep Dips', sets: 3, reps: 10, weight: null },
    ]
  },
  Saturday: { isRest: true, exercises: [] },
  Sunday: { isRest: true, exercises: [] },
};

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [view, setView] = useState('tracker'); // 'tracker' or 'planner'
  const hasMigrated = useRef(false);
  const initializedDays = useRef(new Set());
  const completedSetsRef = useRef({});
  const lastUserRef = useRef(null);
  
  // Sync weekly plan with Firebase (requires login)
  const [weeklyPlan, setWeeklyPlan] = useFirestoreSync(
    user, 
    DEFAULT_WEEKLY_PLAN, 
    'weeklyPlan'
  );
  
  const [currentDay, setCurrentDay] = useState(() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1]; // Convert Sunday=0 to index 6
  });

  // Sync completed sets with Firebase - SIMPLE DIRECT SAVE/LOAD
  const [completedSets, setCompletedSets] = useState({});
  const hasSynced = useRef({ completedSets: false });

  // Load data from Firebase on mount or user change
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setCompletedSets({});
        hasSynced.current = { completedSets: false };
        return;
      }

      console.log('🔄 Loading workout data from Firebase...');
      try {
        // Load completed sets
        const setsDoc = await getDoc(doc(db, 'users', user.uid, 'workoutData', 'completedSets'));
        if (setsDoc.exists()) {
          console.log('✅ Loaded completedSets:', setsDoc.data());
          setCompletedSets(setsDoc.data());
        } else {
          console.log('ℹ️ No completedSets found in Firebase');
        }
        
        hasSynced.current = { completedSets: true };
      } catch (error) {
        console.error('❌ Error loading workout data:', error);
      }
    };

    loadData();
  }, [user]);

  // Keep ref in sync with state
  useEffect(() => {
    completedSetsRef.current = completedSets;
  }, [completedSets]);

  // Reset migration state when user changes
  useEffect(() => {
    if (!user) {
      lastUserRef.current = null;
      hasMigrated.current = false;
      initializedDays.current.clear();
      return;
    }

    if (lastUserRef.current !== user.uid) {
      lastUserRef.current = user.uid;
      hasMigrated.current = false;
      initializedDays.current.clear();
    }
  }, [user]);

  // Migrate old category-based data to new flat structure
  useEffect(() => {
    if (!weeklyPlan || hasMigrated.current || !user) return;
    
    let needsMigration = false;
    const migratedPlan = {};
    
    DAYS.forEach(day => {
      if (!weeklyPlan[day]) {
        migratedPlan[day] = { isRest: true, exercises: [] };
        needsMigration = true;
        return;
      }
      
      // Create a copy of the day's plan
      migratedPlan[day] = { ...weeklyPlan[day] };
      
      // Migrate from categories to exercises
      if (migratedPlan[day].categories && !migratedPlan[day].exercises) {
        needsMigration = true;
        migratedPlan[day].exercises = migratedPlan[day].categories.flatMap(cat => cat.exercises || []);
        delete migratedPlan[day].categories;
      }
      // Ensure exercises array exists
      if (!migratedPlan[day].exercises) {
        needsMigration = true;
        migratedPlan[day].exercises = [];
      }
    });
    
    if (needsMigration) {
      console.log('Migrating data structure from categories to exercises');
      hasMigrated.current = true;
      setWeeklyPlan(migratedPlan);
    } else {
      hasMigrated.current = true;
    }
    
    // Also migrate completedSets from nested arrays to flat structure
    const migratedSets = { ...completedSets };
    let setsNeedMigration = false;
    
    DAYS.forEach(day => {
      const dayState = migratedSets[day];
      // Check if it's old nested array format
      if (Array.isArray(dayState)) {
        setsNeedMigration = true;
        const flatState = {};
        dayState.forEach((exerciseSets, exerciseIndex) => {
          if (Array.isArray(exerciseSets)) {
            exerciseSets.forEach((isCompleted, setIndex) => {
              flatState[`${exerciseIndex}-${setIndex}`] = isCompleted;
            });
          }
        });
        migratedSets[day] = flatState;
      }
    });
    
    if (setsNeedMigration) {
      console.log('Migrating completedSets from nested arrays to flat structure');
      setCompletedSets(migratedSets);
    }
  }, [weeklyPlan, setWeeklyPlan, completedSets]);

  // Initialize completedSets for current day if not exists
  useEffect(() => {
    if (!hasMigrated.current) return; // Wait for migration to complete
    if (initializedDays.current.has(currentDay)) return; // Already initialized this day
    
    const todayPlan = weeklyPlan[currentDay];
    if (!todayPlan || todayPlan.isRest || !todayPlan.exercises) return;
    
    // Use ref to check current value, avoiding dependency on completedSets
    if (!completedSetsRef.current[currentDay]) {
      console.log('Initializing completedSets for', currentDay);
      // Convert to flat structure: { "0-0": false, "0-1": false, "1-0": false, ... }
      const newState = {};
      todayPlan.exercises.forEach((exercise, exerciseIndex) => {
        for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
          newState[`${exerciseIndex}-${setIndex}`] = false;
        }
      });
      setCompletedSets(prev => ({ ...prev, [currentDay]: newState }));
    }
    
    initializedDays.current.add(currentDay);
  }, [currentDay, weeklyPlan]);

  // Simple direct save to Firebase
  const saveCompletedSets = async (newSets) => {
    if (!user) return;
    try {
      console.log('💾 Saving completedSets to Firebase...');
      await setDoc(doc(db, 'users', user.uid, 'workoutData', 'completedSets'), newSets);
      console.log('✅ Saved completedSets successfully');
    } catch (error) {
      console.error('❌ Error saving completedSets:', error);
    }
  };


  const toggleSet = (exerciseIndex, setIndex) => {
    setCompletedSets(prev => {
      const dayState = prev[currentDay] || {};
      const key = `${exerciseIndex}-${setIndex}`;
      
      // Ensure dayState is properly initialized
      if (Object.keys(dayState).length === 0) {
        const todayPlan = weeklyPlan[currentDay];
        if (!todayPlan.exercises) return prev;
        const initialState = {};
        todayPlan.exercises.forEach((exercise, ei) => {
          for (let si = 0; si < exercise.sets; si++) {
            initialState[`${ei}-${si}`] = false;
          }
        });
        initialState[key] = true;
        const newState = { ...prev, [currentDay]: initialState };
        saveCompletedSets(newState); // Save immediately
        return newState;
      }
      
      // Check if previous sets are completed (sequential checking)
      if (setIndex > 0) {
        const previousKey = `${exerciseIndex}-${setIndex - 1}`;
        if (!dayState[previousKey]) {
          // Don't allow clicking this set if previous set not done
          return prev;
        }
      }
      
      const newState = {
        ...prev,
        [currentDay]: {
          ...dayState,
          [key]: !dayState[key]
        }
      };
      saveCompletedSets(newState); // Save immediately
      return newState;
    });
  };

  const resetAll = () => {
    if (window.confirm('Reset all checkboxes for today?')) {
      const todayPlan = weeklyPlan[currentDay];
      if (!todayPlan.exercises) return;
      
      // Create flat structure
      const resetState = {};
      todayPlan.exercises.forEach((exercise, exerciseIndex) => {
        for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
          resetState[`${exerciseIndex}-${setIndex}`] = false;
        }
      });
      
      const newState = { ...completedSets, [currentDay]: resetState };
      setCompletedSets(newState);
      saveCompletedSets(newState); // Save immediately
    }
  };

  const getTotalProgress = () => {
    const todayPlan = weeklyPlan[currentDay];
    if (!todayPlan.exercises || todayPlan.exercises.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const dayState = completedSets[currentDay] || {};
    let completed = 0;
    let total = 0;

    todayPlan.exercises.forEach((exercise, exerciseIndex) => {
      for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
        total++;
        if (dayState[`${exerciseIndex}-${setIndex}`]) {
          completed++;
        }
      }
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
        exercises: !prev[day].isRest ? [] : prev[day].exercises
      }
    }));
  };

  const addExercise = (day) => {
    const name = prompt('Exercise name:');
    if (!name) return;
    const sets = parseInt(prompt('Number of sets:', '3'));
    const reps = prompt('Reps (e.g., 8-12 or 15):', '8-12');
    
    if (!name || !sets || !reps) return;

    setWeeklyPlan(prev => {
      const newPlan = { ...prev };
      newPlan[day] = {
        ...newPlan[day],
        exercises: [...(newPlan[day].exercises || []), { name, sets, reps }]
      };
      return newPlan;
    });
  };

  const removeExercise = (day, exerciseIndex) => {
    setWeeklyPlan(prev => {
      const newPlan = { ...prev };
      newPlan[day] = {
        ...newPlan[day],
        exercises: (newPlan[day].exercises || []).filter((_, i) => i !== exerciseIndex)
      };
      return newPlan;
    });
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
                  <div className="exercises-list">
                    {(weeklyPlan[day].exercises || []).map((exercise, exIndex) => (
                      <div key={exIndex} className="exercise-edit">
                        <div className="exercise-info">
                          <span className="exercise-name-small">{exercise.name}</span>
                          <span className="exercise-details">{exercise.sets} × {exercise.reps}</span>
                        </div>
                        <button 
                          className="remove-btn-small"
                          onClick={() => removeExercise(day, exIndex)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="add-exercise-btn"
                    onClick={() => addExercise(day)}
                  >
                    + Add Exercise
                  </button>
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
            {(todayPlan.exercises || []).map((exercise, exerciseIndex) => (
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
                        checked={completedSets[currentDay]?.[`${exerciseIndex}-${setIndex}`] || false}
                        onChange={() => toggleSet(exerciseIndex, setIndex)}
                      />
                      <span className="checkbox-label">Set {setIndex + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="footer">
            <button className="edit-plan-btn" onClick={() => setView('planner')}>
              📅 Weekly Plan
            </button>
            <button className="reset-button" onClick={resetAll}>
              🔄 Reset Today
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
          <span>Tracker</span>
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
          onClick={resetAll}
        >
          <div className="nav-icon">🔄</div>
          <span>Reset</span>
        </button>
      </nav>
    </div>
  );
}

export default App
