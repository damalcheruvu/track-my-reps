import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, loading, signInWithGoogle, signOut };
};

export const useFirestoreSync = (user, localData, dataKey) => {
  const [syncedData, setSyncedData] = useState(localData);
  const [syncing, setSyncing] = useState(false);
  const hasInitialized = useRef(false);
  const isSaving = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastLocalUpdateRef = useRef(Date.now());
  const lastUserRef = useRef(null);

  // Load data from Firestore when user signs in
  useEffect(() => {
    if (!user) {
      // Reset when user signs out
      if (lastUserRef.current !== null) {
        setSyncedData(localData);
        hasInitialized.current = false;
        lastUserRef.current = null;
      }
      return;
    }

    // Reset if different user
    if (lastUserRef.current !== user.uid) {
      hasInitialized.current = false;
      lastUserRef.current = user.uid;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      // Don't overwrite data while we're saving or within 2 seconds of local update
      const timeSinceLastUpdate = Date.now() - lastLocalUpdateRef.current;
      if (isSaving.current || timeSinceLastUpdate < 2000) {
        return;
      }
      
      if (docSnap.exists()) {
        const cloudData = docSnap.data()[dataKey];
        if (cloudData) {
          setSyncedData(cloudData);
          hasInitialized.current = true;
        }
      } else {
        // First time user - save local data to cloud
        setDoc(userDocRef, { [dataKey]: localData }, { merge: true });
        hasInitialized.current = true;
      }
    });

    return unsubscribe;
  }, [user, dataKey, localData]);

  // Save data to Firestore when it changes
  useEffect(() => {
    if (!user || syncing || !hasInitialized.current) return;

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Mark that we just had a local update
    lastLocalUpdateRef.current = Date.now();

    const saveToFirestore = async () => {
      try {
        setSyncing(true);
        isSaving.current = true;
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: syncedData }, { merge: true });
      } catch (error) {
        console.error('Error syncing to cloud:', error);
      } finally {
        setSyncing(false);
        // Keep isSaving flag for longer to prevent race conditions
        setTimeout(() => {
          isSaving.current = false;
        }, 1500);
      }
    };

    saveTimeoutRef.current = setTimeout(saveToFirestore, 1000); // Debounce saves
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, syncedData, dataKey, syncing]);

  return [syncedData, setSyncedData, syncing];
};

// Simplified sync for notes only - no complex race condition handling needed
export const useNotesSync = (user, dataKey) => {
  const [notes, setNotes] = useState({});
  const hasLoaded = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastUserRef = useRef(null);

  // Function to load notes from Firebase
  const loadNotesFromFirebase = useCallback(async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const cloudNotes = docSnap.data()[dataKey];
        if (cloudNotes) {
          console.log('Loaded notes from Firebase:', cloudNotes);
          setNotes(cloudNotes);
        } else {
          console.log('No notes found in Firebase');
        }
      }
      hasLoaded.current = true;
    } catch (error) {
      console.error('Error loading notes:', error);
      hasLoaded.current = true;
    }
  }, [user, dataKey]);

  // Load notes once on mount or when user changes
  useEffect(() => {
    if (!user) {
      hasLoaded.current = false;
      lastUserRef.current = null;
      return;
    }

    // Reset if different user
    if (lastUserRef.current !== user.uid) {
      hasLoaded.current = false;
      lastUserRef.current = user.uid;
      setNotes({});
    }

    if (hasLoaded.current) return;

    loadNotesFromFirebase();
  }, [user, loadNotesFromFirebase]);

  // Reload when page becomes visible (tab switching)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && hasLoaded.current) {
        console.log('Page visible - reloading notes from Firebase');
        loadNotesFromFirebase();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, loadNotesFromFirebase]);

  // Save notes when they change (debounced)
  useEffect(() => {
    if (!user || !hasLoaded.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Saving notes to Firebase:', notes);
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: notes }, { merge: true });
        console.log('Notes saved successfully');
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, notes, dataKey]);

  // Save immediately before page unload
  useEffect(() => {
    if (!user || !hasLoaded.current) return;

    const handleBeforeUnload = async () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: notes }, { merge: true });
        console.log('Notes saved on unload');
      } catch (error) {
        console.error('Error saving notes on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, notes, dataKey]);

  return [notes, setNotes];
};

// Simple sync for completedSets - no real-time listener to avoid interference
export const useCompletedSetsSync = (user, dataKey) => {
  const [sets, setSets] = useState({});
  const hasLoaded = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastUserRef = useRef(null);

  // Function to load sets from Firebase
  const loadSetsFromFirebase = useCallback(async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const cloudSets = docSnap.data()[dataKey];
        if (cloudSets) {
          console.log('Loaded sets from Firebase:', cloudSets);
          setSets(cloudSets);
        } else {
          console.log('No sets found in Firebase');
        }
      }
      hasLoaded.current = true;
    } catch (error) {
      console.error('Error loading sets:', error);
      hasLoaded.current = true;
    }
  }, [user, dataKey]);

  // Load once on mount or when user changes
  useEffect(() => {
    if (!user) {
      hasLoaded.current = false;
      lastUserRef.current = null;
      return;
    }

    // Reset if different user
    if (lastUserRef.current !== user.uid) {
      hasLoaded.current = false;
      lastUserRef.current = user.uid;
      setSets({});
    }

    if (hasLoaded.current) return;

    loadSetsFromFirebase();
  }, [user, loadSetsFromFirebase]);

  // Reload when page becomes visible (tab switching)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && hasLoaded.current) {
        console.log('Page visible - reloading sets from Firebase');
        loadSetsFromFirebase();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, loadSetsFromFirebase]);

  // Save when they change (debounced)
  useEffect(() => {
    if (!user || !hasLoaded.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Saving sets to Firebase:', sets);
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: sets }, { merge: true });
        console.log('Sets saved successfully');
      } catch (error) {
        console.error('Error saving sets:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, sets, dataKey]);

  // Save immediately before page unload
  useEffect(() => {
    if (!user || !hasLoaded.current) return;

    const handleBeforeUnload = async () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: sets }, { merge: true });
        console.log('Sets saved on unload');
      } catch (error) {
        console.error('Error saving sets on unload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, sets, dataKey]);

  return [sets, setSets];
};
