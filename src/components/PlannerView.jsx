import { memo } from 'react';
import { useStore, DAYS } from '../store';
import AddExerciseModal from './AddExerciseModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const PlannerView = memo(function PlannerView({ user, signOut, setView }) {
    const {
        weeklyPlan,
        toggleRestDay,
        removeExercise,
        updateExerciseName,
        updateExerciseSets,
        updateExerciseReps,
        updateExerciseWeight,
        handleDragEnd,
        openAddExerciseModal,
    } = useStore();

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
});

export default PlannerView;
