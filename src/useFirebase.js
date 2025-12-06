import { useEffect, useState } from 'react';
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

  // Load data from Firestore when user signs in
  useEffect(() => {
    if (!user) {
      setSyncedData(localData);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data()[dataKey];
        if (cloudData) {
          setSyncedData(cloudData);
        }
      } else {
        // First time user - save local data to cloud
        setDoc(userDocRef, { [dataKey]: localData }, { merge: true });
      }
    });

    return unsubscribe;
  }, [user, dataKey]);

  // Save data to Firestore when it changes
  useEffect(() => {
    if (!user || syncing) return;

    const saveToFirestore = async () => {
      try {
        setSyncing(true);
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dataKey]: syncedData }, { merge: true });
      } catch (error) {
        console.error('Error syncing to cloud:', error);
      } finally {
        setSyncing(false);
      }
    };

    const timeoutId = setTimeout(saveToFirestore, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [user, syncedData, dataKey]);

  return [syncedData, setSyncedData, syncing];
};
