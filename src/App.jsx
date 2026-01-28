import { useEffect } from 'react'
import './App.css'
import { useAuth, useFirebaseSync } from './useFirebase'
import { useStore, DEFAULT_WEEKLY_PLAN, ensureExerciseIds } from './store'
import SignInScreen from './components/SignInScreen'
import TrackerView from './components/TrackerView'
import PlannerView from './components/PlannerView'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { loadData: loadWeeklyPlan, saveData: saveWeeklyPlan } = useFirebaseSync(user, DEFAULT_WEEKLY_PLAN, 'weekly_plans');
  const { loadData: loadCompletedSets, saveData: saveCompletedSets } = useFirebaseSync(user, {}, 'completed_sets');

  // Zustand store
  const {
    view,
    setView,
    weeklyPlan,
    setWeeklyPlan,
    completedSets,
    setCompletedSets,
  } = useStore();

  // Load data from Firebase when user logs in
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

  // Auto-save to Firebase when data changes (debounced)
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
    return <SignInScreen signInWithGoogle={signInWithGoogle} />;
  }

  // Planner view
  if (view === 'planner') {
    return <PlannerView user={user} signOut={signOut} setView={setView} />;
  }

  // Tracker view (default)
  return <TrackerView user={user} signOut={signOut} setView={setView} />;
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
