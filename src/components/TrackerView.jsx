import { memo } from 'react';
import { useStore, DAYS } from '../store';
import AddExerciseModal from './AddExerciseModal';

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

const TrackerView = memo(function TrackerView({ user, signOut, setView }) {
    const {
        view,
        currentDay,
        setCurrentDay,
        weeklyPlan,
        completedSets,
        toggleSet,
        resetAll,
        getTotalProgress,
    } = useStore();

    const progress = getTotalProgress();
    const todayPlan = weeklyPlan[currentDay];

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
});

export default TrackerView;
