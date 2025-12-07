import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';

// Keep Firebase for authentication only
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

// Supabase sync for data storage
export const useSupabaseSync = (user, defaultData, tableName) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setData(defaultData);
        setLoading(false);
        return;
      }

      try {
        const { data: result, error } = await supabase
          .from(tableName)
          .select('data')
          .eq('user_id', user.uid)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No data exists yet, use default
            console.log(`No ${tableName} found, using default`);
            setData(defaultData);
          } else {
            console.error(`Error loading ${tableName}:`, error);
          }
        } else if (result) {
          console.log(`✅ Loaded ${tableName} from Supabase:`, result.data);
          setData(result.data);
        }
      } catch (error) {
        console.error(`Error loading ${tableName}:`, error);
      }
      
      setLoading(false);
    };

    loadData();
  }, [user]);

  // Save function
  const saveData = async (newData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert({ 
          user_id: user.uid, 
          data: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error(`❌ Error saving ${tableName}:`, error);
      } else {
        console.log(`✅ Saved ${tableName} to Supabase`);
      }
    } catch (error) {
      console.error(`Error saving ${tableName}:`, error);
    }
  };

  return [data, setData, saveData, loading];
};
