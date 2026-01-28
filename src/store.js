import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper function to generate unique IDs
const generateId = () => crypto.randomUUID();

// Helper to add IDs to exercises if they don't have them
export const ensureExerciseIds = (weeklyPlan) => {
  const updatedPlan = {};
  for (const day of DAYS) {
    if (weeklyPlan[day]) {
      updatedPlan[day] = {
        ...weeklyPlan[day],
        exercises: (weeklyPlan[day].exercises || []).map(ex => ({
          ...ex,
          id: ex.id || generateId()
        }))
      };
    }
  }
  return updatedPlan;
};

export const DEFAULT_WEEKLY_PLAN = {
  Monday: { isRest: true, exercises: [] },
  Tuesday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'Back Squat', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Bench Press', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Wide Row', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'RDL', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Barbell Curl', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Behind-Back Wrist Curl', sets: 2, reps: '', weight: null },
    ]
  },
  Wednesday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'HIIT: 20s/40s ×10', sets: 1, reps: '10 rounds', weight: null },
    ]
  },
  Thursday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'Deadlift', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'OHP', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Underhand Row', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Barbell Curl', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Reverse Curl', sets: 2, reps: '', weight: null },
      { id: generateId(), name: 'Barbell Hold', sets: 2, reps: '', weight: null },
    ]
  },
  Friday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'Steady Cardio', sets: 1, reps: '20-30 min', weight: null },
    ]
  },
  Saturday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'Front Squat', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Incline Bench', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Med Row', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Sumo DL', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Wrist Curl Up', sets: 2, reps: '', weight: null },
      { id: generateId(), name: 'Wrist Curl Down', sets: 2, reps: '', weight: null },
    ]
  },
  Sunday: {
    isRest: false,
    exercises: [
      { id: generateId(), name: 'Light Back Squat', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Light OHP', sets: 4, reps: '', weight: null },
      { id: generateId(), name: 'Row Variation', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'RDL/GM', sets: 3, reps: '', weight: null },
      { id: generateId(), name: 'Curl+RevCurl', sets: 3, reps: '', weight: null },
    ]
  },
};

// Exercise library for searchable dropdown
export const EXERCISE_LIBRARY = [
  // Compound Movements
  { name: 'Back Squat', category: 'Legs' },
  { name: 'Front Squat', category: 'Legs' },
  { name: 'Deadlift', category: 'Back' },
  { name: 'Sumo Deadlift', category: 'Back' },
  { name: 'Romanian Deadlift', category: 'Back' },
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Incline Bench Press', category: 'Chest' },
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Barbell Row', category: 'Back' },
  { name: 'Pull-ups', category: 'Back' },
  { name: 'Chin-ups', category: 'Back' },
  { name: 'Dips', category: 'Chest' },
  // Isolation Movements
  { name: 'Barbell Curl', category: 'Arms' },
  { name: 'Dumbbell Curl', category: 'Arms' },
  { name: 'Hammer Curl', category: 'Arms' },
  { name: 'Tricep Pushdown', category: 'Arms' },
  { name: 'Skull Crushers', category: 'Arms' },
  { name: 'Lateral Raise', category: 'Shoulders' },
  { name: 'Face Pull', category: 'Shoulders' },
  { name: 'Leg Press', category: 'Legs' },
  { name: 'Leg Curl', category: 'Legs' },
  { name: 'Leg Extension', category: 'Legs' },
  { name: 'Calf Raise', category: 'Legs' },
  { name: 'Cable Fly', category: 'Chest' },
  { name: 'Lat Pulldown', category: 'Back' },
  { name: 'Seated Row', category: 'Back' },
  // Cardio
  { name: 'HIIT', category: 'Cardio' },
  { name: 'Steady State Cardio', category: 'Cardio' },
  { name: 'Running', category: 'Cardio' },
  { name: 'Cycling', category: 'Cardio' },
  { name: 'Rowing', category: 'Cardio' },
];

export const useStore = create((set, get) => ({
  // View state
  view: 'tracker',
  setView: (view) => set({ view }),

  // Current day
  currentDay: (() => {
    const today = new Date().getDay();
    return DAYS[today === 0 ? 6 : today - 1];
  })(),
  setCurrentDay: (day) => set({ currentDay: day }),

  // Weekly plan
  weeklyPlan: DEFAULT_WEEKLY_PLAN,
  setWeeklyPlan: (plan) => set({ weeklyPlan: plan }),

  // Completed sets
  completedSets: {},
  setCompletedSets: (sets) => set({ completedSets: sets }),

  // Modal state for add exercise
  isAddExerciseModalOpen: false,
  addExerciseModalDay: null,
  openAddExerciseModal: (day) => set({ isAddExerciseModalOpen: true, addExerciseModalDay: day }),
  closeAddExerciseModal: () => set({ isAddExerciseModalOpen: false, addExerciseModalDay: null }),

  // Toggle set completion
  toggleSet: (exerciseIndex, setIndex) => {
    const { currentDay, completedSets, weeklyPlan } = get();
    let dayState = completedSets[currentDay] || {};
    const key = `${exerciseIndex}-${setIndex}`;

    // Initialize if empty
    if (Object.keys(dayState).length === 0) {
      const todayPlan = weeklyPlan[currentDay];
      if (!todayPlan.exercises) return;
      dayState = {};
      todayPlan.exercises.forEach((exercise, ei) => {
        for (let si = 0; si < exercise.sets; si++) {
          dayState[`${ei}-${si}`] = false;
        }
      });
    }

    if (setIndex > 0) {
      const previousKey = `${exerciseIndex}-${setIndex - 1}`;
      if (!dayState[previousKey]) return;
    }

    const newDayState = {
      ...dayState,
      [key]: !dayState[key]
    };

    set({ completedSets: { ...completedSets, [currentDay]: newDayState } });
  },

  // Reset all sets for today
  resetAll: () => {
    const { currentDay, weeklyPlan } = get();
    if (window.confirm('Reset all checkboxes for today?')) {
      const todayPlan = weeklyPlan[currentDay];
      if (!todayPlan.exercises) return;

      const resetState = {};
      todayPlan.exercises.forEach((exercise, exerciseIndex) => {
        for (let setIndex = 0; setIndex < exercise.sets; setIndex++) {
          resetState[`${exerciseIndex}-${setIndex}`] = false;
        }
      });

      set({ completedSets: { ...get().completedSets, [currentDay]: resetState } });
    }
  },

  // Get progress for current day
  getTotalProgress: () => {
    const { currentDay, weeklyPlan, completedSets } = get();
    const todayPlan = weeklyPlan[currentDay];
    if (!todayPlan?.exercises || todayPlan.exercises.length === 0) {
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
  },

  // Toggle rest day
  toggleRestDay: (day) => {
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          isRest: !weeklyPlan[day].isRest,
          exercises: !weeklyPlan[day].isRest ? [] : weeklyPlan[day].exercises
        }
      }
    });
  },

  // Add exercise with validation
  addExercise: (day, newExercise) => {
    // Validate exercise data
    if (!newExercise.name || newExercise.name.trim() === '') {
      return { success: false, error: 'Exercise name is required' };
    }
    if (!newExercise.sets || newExercise.sets < 1 || newExercise.sets > 20) {
      return { success: false, error: 'Sets must be between 1 and 20' };
    }

    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: [...(weeklyPlan[day].exercises || []), {
            id: generateId(),
            name: newExercise.name.trim(),
            sets: parseInt(newExercise.sets),
            reps: newExercise.reps || '',
            weight: newExercise.weight || null,
            notes: newExercise.notes || ''
          }]
        }
      }
    });
    return { success: true };
  },

  // Remove exercise with confirmation
  removeExercise: (day, exerciseIndex, exerciseName) => {
    if (!window.confirm(`Remove "${exerciseName || 'this exercise'}" from ${day}?`)) {
      return;
    }
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.filter((_, i) => i !== exerciseIndex)
        }
      }
    });
  },

  // Update exercise name
  updateExerciseName: (day, exerciseIndex, newName) => {
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, name: newName } : ex
          )
        }
      }
    });
  },

  // Update exercise sets
  updateExerciseSets: (day, exerciseIndex, newSets) => {
    const { weeklyPlan } = get();
    const validSets = Math.max(1, Math.min(20, parseInt(newSets) || 1));
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, sets: validSets } : ex
          )
        }
      }
    });
  },

  // Update exercise reps
  updateExerciseReps: (day, exerciseIndex, newReps) => {
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, reps: newReps } : ex
          )
        }
      }
    });
  },

  // Update exercise weight
  updateExerciseWeight: (day, exerciseIndex, newWeight) => {
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, weight: newWeight } : ex
          )
        }
      }
    });
  },

  // Update exercise notes
  updateExerciseNotes: (day, exerciseIndex, newNotes) => {
    const { weeklyPlan } = get();
    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: weeklyPlan[day].exercises.map((ex, i) =>
            i === exerciseIndex ? { ...ex, notes: newNotes } : ex
          )
        }
      }
    });
  },

  // Handle drag end for reordering (uses exercise IDs)
  handleDragEnd: (day, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const { weeklyPlan } = get();
    const exercises = weeklyPlan[day].exercises || [];
    const oldIndex = exercises.findIndex(ex => ex.id === active.id);
    const newIndex = exercises.findIndex(ex => ex.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newExercises = arrayMove(exercises, oldIndex, newIndex);

    set({
      weeklyPlan: {
        ...weeklyPlan,
        [day]: {
          ...weeklyPlan[day],
          exercises: newExercises
        }
      }
    });
  },
}));

export default useStore;
