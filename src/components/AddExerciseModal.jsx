import { useState, useMemo, useCallback, memo } from 'react';
import { useStore, EXERCISE_LIBRARY } from '../store';
import './AddExerciseModal.css';

const AddExerciseModal = memo(function AddExerciseModal() {
  const { isAddExerciseModalOpen, addExerciseModalDay, closeAddExerciseModal, addExercise } = useStore();
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');

  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return EXERCISE_LIBRARY;
    const query = searchQuery.toLowerCase();
    return EXERCISE_LIBRARY.filter(
      ex => ex.name.toLowerCase().includes(query) || ex.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectExercise = useCallback((exerciseName) => {
    setName(exerciseName);
    setSearchQuery(exerciseName);
    setShowSuggestions(false);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setError('');
    
    const result = addExercise(addExerciseModalDay, {
      name: name || searchQuery,
      sets,
      reps,
      weight: weight ? parseFloat(weight) : null,
      notes
    });
    
    if (result.success) {
      // Reset form
      setName('');
      setSets(3);
      setReps('8-12');
      setWeight('');
      setNotes('');
      setSearchQuery('');
      closeAddExerciseModal();
    } else {
      setError(result.error);
    }
  }, [name, searchQuery, sets, reps, weight, notes, addExerciseModalDay, addExercise, closeAddExerciseModal]);

  const handleClose = useCallback(() => {
    setError('');
    setName('');
    setSets(3);
    setReps('8-12');
    setWeight('');
    setNotes('');
    setSearchQuery('');
    closeAddExerciseModal();
  }, [closeAddExerciseModal]);

  if (!isAddExerciseModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title">Add Exercise to {addExerciseModalDay}</h2>
          <button 
            className="modal-close-btn" 
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error" role="alert">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="exercise-name">Exercise Name *</label>
            <div className="search-container">
              <input
                id="exercise-name"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setName('');
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search or type exercise name..."
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="exercise-suggestions"
                required
              />
              {showSuggestions && filteredExercises.length > 0 && (
                <ul id="exercise-suggestions" className="suggestions-list" role="listbox">
                  {filteredExercises.slice(0, 8).map((ex, idx) => (
                    <li
                      key={idx}
                      onClick={() => handleSelectExercise(ex.name)}
                      role="option"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelectExercise(ex.name)}
                    >
                      <span className="exercise-suggestion-name">{ex.name}</span>
                      <span className="exercise-suggestion-category">{ex.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exercise-sets">Sets *</label>
              <input
                id="exercise-sets"
                type="number"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 1)}
                min="1"
                max="20"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="exercise-reps">Reps</label>
              <input
                id="exercise-reps"
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g., 8-12"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exercise-weight">Weight (kg)</label>
              <input
                id="exercise-weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Optional"
                step="0.5"
                min="0"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="exercise-notes">Notes</label>
            <textarea
              id="exercise-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes (e.g., focus on form)"
              rows={2}
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AddExerciseModal;
