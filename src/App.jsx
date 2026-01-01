import { useEffect, useCallback, memo } from 'react'
import './App.css'
import { useAuth, useFirebaseSync } from './useFirebase'
import { useStore, DAYS, DEFAULT_WEEKLY_PLAN, ensureExerciseIds } from './store'
import AddExerciseModal from './components/AddExerciseModal'
import ErrorBoundary from './components/ErrorBoundary'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Memoized Sortable Exercise Component with enhanced drag feedback
const SortableExercise = memo(function SortableExercise({
  exercise,
  index,
  day,
  updateExerciseName,
  updateExerciseSets,
  updateExerciseReps,
  updateExerciseWeight,
  removeExercise
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`exercise-edit ${isDragging ? 'dragging' : ''}`}
      role="listitem"
      aria-label={`Exercise: ${exercise.name}`}
    >
      <div
        className="drag-handle"
        {...attributes}
        {...listeners}
        role="button"
        aria-label="Drag to reorder"
        tabIndex={0}
      >
        ⋮⋮
      </div>
      <div className="exercise-info">
        <input
          type="text"
          className="exercise-name-input"
          value={exercise.name}
          onChange={(e) => updateExerciseName(day, index, e.target.value)}
          placeholder="Exercise name"
          aria-label="Exercise name"
        />
        <div className="exercise-sets-reps">
          <input
            type="number"
            className="sets-input"
            value={exercise.sets}
            onChange={(e) => updateExerciseSets(day, index, parseInt(e.target.value) || 1)}
            min="1"
            max="20"
            aria-label="Number of sets"
          />
          <span aria-hidden="true">×</span>
          <input
            type="text"
            className="reps-input"
            value={exercise.reps}
            onChange={(e) => updateExerciseReps(day, index, e.target.value)}
            placeholder="reps"
            aria-label="Reps"
          />
        </div>
        <div className="exercise-weight-input">
          <input
            type="number"
            className="weight-input"
            value={exercise.weight || ''}
            onChange={(e) => updateExerciseWeight(day, index, e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="kg"
            step="0.5"
            min="0"
            aria-label="Weight in kg"
          />
          <span className="weight-label">kg</span>
        </div>
      </div>
      <button
        className="remove-btn-small"
        onClick={() => removeExercise(day, index, exercise.name)}
        aria-label={`Remove ${exercise.name}`}
      >
        ✕
      </button>
    </div>
  );
});

// Memoized Exercise Card for Tracker view
const ExerciseCard = memo(function ExerciseCard({
  exercise,
  exerciseIndex,
  currentDay,
  completedSets,
  toggleSet
}) {
  return (
    <div className="exercise-card" role="article" aria-label={`${exercise.name} exercise`}>
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.name}</h3>
        <span className="exercise-reps">{exercise.sets} × {exercise.reps || 'reps'}</span>
      </div>
      {exercise.weight && (
        <div className="exercise-weight-display">
          <span className="weight-badge">{exercise.weight} kg</span>
        </div>
      )}
      {exercise.notes && (
        <div className="exercise-notes-display">
          <span className="notes-text">{exercise.notes}</span>
        </div>
      )}
      <div className="sets-container" role="group" aria-label="Sets">
        {Array.from({ length: exercise.sets }, (_, setIndex) => (
          <label key={setIndex} className="set-checkbox">
            <input
              type="checkbox"
              checked={completedSets[currentDay]?.[`${exerciseIndex}-${setIndex}`] || false}
              onChange={() => toggleSet(exerciseIndex, setIndex)}
              aria-label={`Set ${setIndex + 1} of ${exercise.name}`}
            />
            <span className="checkbox-label">Set {setIndex + 1}</span>
          </label>
        ))}
      </div>
    </div>
  );
});

// Day Selector Component
const DaySelector = memo(function DaySelector({ currentDay, setCurrentDay, weeklyPlan }) {
  return (
    <div className="day-selector" role="tablist" aria-label="Select day">
      {DAYS.map(day => (
        <button
          key={day}
          role="tab"
          aria-selected={currentDay === day}
          className={`day-btn ${currentDay === day ? 'active' : ''} ${weeklyPlan[day]?.isRest ? 'rest' : ''}`}
          onClick={() => setCurrentDay(day)}
        >
          {day.slice(0, 3)}
        </button>
      ))}
    </div>
  );
});

// Progress Bar Component
const ProgressBar = memo(function ProgressBar({ progress }) {
  return (
    <div className="progress-section" role="progressbar" aria-valuenow={progress.percentage} aria-valuemin="0" aria-valuemax="100">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress.percentage}%` }}></div>
      </div>
      <p className="progress-text">
        {progress.completed} / {progress.total} sets completed ({progress.percentage}%)
      </p>
    </div>
  );
});

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { loadData: loadWeeklyPlan, saveData: saveWeeklyPlan } = useFirebaseSync(user, DEFAULT_WEEKLY_PLAN, 'weekly_plans');
  const { loadData: loadCompletedSets, saveData: saveCompletedSets } = useFirebaseSync(user, {}, 'completed_sets');

  // Zustand store
  const {
    view,
    setView,
    currentDay,
    setCurrentDay,
    weeklyPlan,
    setWeeklyPlan,
    completedSets,
    setCompletedSets,
    toggleSet,
    resetAll,
    getTotalProgress,
    toggleRestDay,
    removeExercise,
    updateExerciseName,
    updateExerciseSets,
    updateExerciseReps,
    updateExerciseWeight,
    handleDragEnd,
    openAddExerciseModal,
  } = useStore();

  // Load data from Supabase when user logs in
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        const plan = await loadWeeklyPlan();
        if (plan) {
          // Ensure all exercises have IDs (for backward compatibility)
          setWeeklyPlan(ensureExerciseIds(plan));
        }

        const sets = await loadCompletedSets();
        if (sets) setCompletedSets(sets);
      }
    };
    loadUserData();
  }, [user]);

  // Auto-save to Supabase when data changes (debounced)
  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => {
      saveWeeklyPlan(weeklyPlan);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [weeklyPlan, user]);

  useEffect(() => {
    if (!user) return;
    const timeout = setTimeout(() => {
      saveCompletedSets(completedSets);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [completedSets, user]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const progress = getTotalProgress();
  const todayPlan = weeklyPlan[currentDay];

  // Loading state
  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner" aria-label="Loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Sign-in screen
  if (!user) {
    return (
      <div className="app">
        <div className="sign-in-screen">
          <div className="sign-in-card">
            <h1>💪 Workout Tracker</h1>
            <p className="sign-in-subtitle">Track your workouts across all devices</p>

            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">✅</span>
                <span>Custom weekly workout plans</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">📊</span>
                <span>Track your progress daily</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">☁️</span>
                <span>Sync across all devices</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon" aria-hidden="true">📱</span>
                <span>Mobile-friendly interface</span>
              </div>
            </div>

            <button className="google-sign-in-btn" onClick={signInWithGoogle}>
              <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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

  // Planner view
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
              <img
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="user-avatar"
              />
              <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
            </div>
          </div>
        </header>

        <div className="planner-container" role="list" aria-label="Weekly plan">
          {DAYS.map(day => (
            <div key={day} className="day-planner" role="listitem">
              <div className="day-header">
                <h2>{day}</h2>
                <div className="day-controls">
                  <label className="rest-toggle">
                    <input
                      type="checkbox"
                      checked={weeklyPlan[day]?.isRest || false}
                      onChange={() => toggleRestDay(day)}
                      aria-label={`Mark ${day} as rest day`}
                    />
                    <span>Rest Day</span>
                  </label>
                </div>
              </div>

              {weeklyPlan[day]?.isRest ? (
                <div className="rest-day-message" aria-label="Rest day">🌴 Rest & Recovery</div>
              ) : (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(day, event)}
                  >
                    <SortableContext
                      items={(weeklyPlan[day]?.exercises || []).map(ex => ex.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="exercises-list" role="list" aria-label={`${day} exercises`}>
                        {(weeklyPlan[day]?.exercises || []).map((exercise, exIndex) => (
                          <SortableExercise
                            key={exercise.id}
                            exercise={exercise}
                            index={exIndex}
                            day={day}
                            updateExerciseName={updateExerciseName}
                            updateExerciseSets={updateExerciseSets}
                            updateExerciseReps={updateExerciseReps}
                            updateExerciseWeight={updateExerciseWeight}
                            removeExercise={removeExercise}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  <button
                    className="add-exercise-btn"
                    onClick={() => openAddExerciseModal(day)}
                    aria-label={`Add exercise to ${day}`}
                  >
                    + Add Exercise
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <AddExerciseModal />
      </div>
    );
  }

  // Tracker view (default)
  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>💪 Workout Tracker</h1>
          <div className="header-actions">
            <div className="user-info">
              <img
                src={user.user_metadata?.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="user-avatar"
              />
              <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
            </div>
          </div>
        </div>
        <DaySelector
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          weeklyPlan={weeklyPlan}
        />
        <p className="date">{new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </header>

      {todayPlan?.isRest ? (
        <div className="rest-day-view">
          <div className="rest-card">
            <div className="rest-icon" aria-hidden="true">🌴</div>
            <h2>Rest Day</h2>
            <p>Take it easy and let your muscles recover!</p>
            <button className="edit-plan-btn" onClick={() => setView('planner')}>
              Edit Weekly Plan
            </button>
          </div>
        </div>
      ) : (
        <>
          <ProgressBar progress={progress} />

          <div className="workout-container" role="main" aria-label="Today's workout">
            {(todayPlan?.exercises || []).map((exercise, exerciseIndex) => (
              <ExerciseCard
                key={exercise.id || exerciseIndex}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                currentDay={currentDay}
                completedSets={completedSets}
                toggleSet={toggleSet}
              />
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
      <nav className="bottom-nav" aria-label="Main navigation">
        <button
          className={`nav-item ${view === 'tracker' ? 'active' : ''}`}
          onClick={() => setView('tracker')}
          aria-current={view === 'tracker' ? 'page' : undefined}
        >
          <div className="nav-icon" aria-hidden="true">💪</div>
          <span>Tracker</span>
        </button>
        <button
          className={`nav-item ${view === 'planner' ? 'active' : ''}`}
          onClick={() => setView('planner')}
          aria-current={view === 'planner' ? 'page' : undefined}
        >
          <div className="nav-icon" aria-hidden="true">📅</div>
          <span>Plan</span>
        </button>
        <button
          className="nav-item"
          onClick={resetAll}
          aria-label="Reset today's progress"
        >
          <div className="nav-icon" aria-hidden="true">🔄</div>
          <span>Reset</span>
        </button>
      </nav>

      <AddExerciseModal />
    </div>
  );
}

// Wrap App with ErrorBoundary
function AppWithErrorBoundary() {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;
