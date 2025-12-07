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
  const lastLocalUpdateRef = useRef(Date.now());

  // Load data from Firestore when user signs in
  useEffect(() => {
    if (!user) {
      // Only set local data once on mount or when user changes
      if (!hasInitialized.current) {
        setSyncedData(localData);
        hasInitialized.current = true;
      }
      return;
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
  }, [user, dataKey]);

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

  // Load notes once on mount
  useEffect(() => {
    if (!user || hasLoaded.current) return;

    const loadNotes = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const cloudNotes = docSnap.data()[dataKey];
          if (cloudNotes) {
            setNotes(cloudNotes);
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

  // Save notes when they change (debounced)
  useEffect(() => {
    if (!user || !hasLoaded.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: notes }, { merge: true });
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [user, notes, dataKey]);

  return [notes, setNotes];
};
