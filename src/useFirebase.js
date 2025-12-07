import { useEffect, useState, useRef } from 'react';
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
  const lastLocalUpdateRef = useRef(0); // Start at 0, not Date.now()
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
      // Don't overwrite data while we're actively saving
      if (isSaving.current) {
        console.log('Skipping snapshot update - currently saving');
        return;
      }
      
      // Only block updates if we've recently made a local change (within 1 second)
      const timeSinceLastUpdate = Date.now() - lastLocalUpdateRef.current;
      if (hasInitialized.current && timeSinceLastUpdate < 1000) {
        console.log('Skipping snapshot update - recent local change');
        return;
      }
      
      if (docSnap.exists()) {
        const cloudData = docSnap.data()[dataKey];
        if (cloudData !== undefined) {
          console.log(`Loading ${dataKey} from Firebase:`, cloudData);
          setSyncedData(cloudData);
          hasInitialized.current = true;
        }
      } else {
        // First time user - save local data to cloud
        console.log(`First time - saving initial ${dataKey} to Firebase`);
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
        console.log(`Saving ${dataKey} to Firebase:`, syncedData);
        setSyncing(true);
        isSaving.current = true;
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: syncedData }, { merge: true });
        console.log(`✓ ${dataKey} saved successfully`);
      } catch (error) {
        console.error(`Error syncing ${dataKey}:`, error);
      } finally {
        setSyncing(false);
        // Keep isSaving flag for a bit to prevent race conditions
        setTimeout(() => {
          isSaving.current = false;
        }, 500);
      }
    };

    saveTimeoutRef.current = setTimeout(saveToFirestore, 500); // Quick debounce
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, syncedData, dataKey, syncing]);

  return [syncedData, setSyncedData, syncing];
};

// Simplified sync for notes - Firebase offline persistence handles caching
export const useNotesSync = (user, dataKey) => {
  const [notes, setNotes] = useState({});
  const hasLoaded = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastUserRef = useRef(null);

  // Load notes once on mount or when user changes
  useEffect(() => {
    if (!user) {
      hasLoaded.current = false;
      lastUserRef.current = null;
      setNotes({});
      return;
    }

    // Reset if different user
    if (lastUserRef.current !== user.uid) {
      hasLoaded.current = false;
      lastUserRef.current = user.uid;
      setNotes({});
    }

    if (hasLoaded.current) return;

    const loadNotes = async () => {
      try {
        console.log('Loading notes from Firebase...');
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudNotes = docSnap.data()[dataKey];
          if (cloudNotes) {
            console.log('Notes loaded:', cloudNotes);
            setNotes(cloudNotes);
          } else {
            console.log('No notes in Firebase');
          }
        }
        hasLoaded.current = true;
      } catch (error) {
        console.error('Error loading notes:', error);
        hasLoaded.current = true;
      }
    };

    loadNotes();
  }, [user, dataKey]);

  // Save notes with minimal debounce
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
        console.log('✓ Notes saved to Firebase successfully');
      } catch (error) {
        console.error('✗ Error saving notes to Firebase:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, notes, dataKey]);

  return [notes, setNotes];
};

// Simple sync for completedSets - Firebase offline persistence handles caching
export const useCompletedSetsSync = (user, dataKey) => {
  const [sets, setSets] = useState({});
  const hasLoaded = useRef(false);
  const saveTimeoutRef = useRef(null);
  const lastUserRef = useRef(null);

  // Load sets once on mount or when user changes
  useEffect(() => {
    if (!user) {
      hasLoaded.current = false;
      lastUserRef.current = null;
      setSets({});
      return;
    }

    // Reset if different user
    if (lastUserRef.current !== user.uid) {
      hasLoaded.current = false;
      lastUserRef.current = user.uid;
      setSets({});
    }

    if (hasLoaded.current) return;

    const loadSets = async () => {
      try {
        console.log('Loading sets from Firebase...');
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudSets = docSnap.data()[dataKey];
          if (cloudSets) {
            console.log('Sets loaded:', cloudSets);
            setSets(cloudSets);
          } else {
            console.log('No sets in Firebase');
          }
        }
        hasLoaded.current = true;
      } catch (error) {
        console.error('Error loading sets:', error);
        hasLoaded.current = true;
      }
    };

    loadSets();
  }, [user, dataKey]);

  // Save sets with minimal debounce
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
        console.log('✓ Sets saved to Firebase successfully');
      } catch (error) {
        console.error('✗ Error saving sets to Firebase:', error);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, sets, dataKey]);

  return [sets, setSets];
};
