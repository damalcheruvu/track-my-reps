import { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

// Firebase Authentication Hook
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Map Firebase user to a format similar to our previous Supabase user
                setUser({
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    user_metadata: {
                        full_name: firebaseUser.displayName,
                        avatar_url: firebaseUser.photoURL
                    }
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Error signing in:', error);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert('Failed to sign in. Please try again.');
            }
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

// Firestore Sync Hook (replaces useSupabaseSync)
export const useFirebaseSync = (user, defaultData, collectionName) => {
    const loadData = async () => {
        if (!user) return defaultData;

        try {
            const docRef = doc(db, 'users', user.id, collectionName, 'data');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log(`✅ Loaded ${collectionName} from Firestore:`, docSnap.data().value);
                return docSnap.data().value;
            } else {
                console.log(`No ${collectionName} found, using default`);
                return defaultData;
            }
        } catch (error) {
            console.error(`Error loading ${collectionName}:`, error);
            return defaultData;
        }
    };

    const saveData = async (newData) => {
        if (!user) return;

        try {
            const docRef = doc(db, 'users', user.id, collectionName, 'data');
            await setDoc(docRef, {
                value: newData,
                updated_at: new Date().toISOString()
            });
            console.log(`✅ Saved ${collectionName} to Firestore`);
        } catch (error) {
            console.error(`❌ Error saving ${collectionName}:`, error);
        }
    };

    return { loadData, saveData };
};
