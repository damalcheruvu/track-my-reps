import { useEffect, useState } from 'react';
import { supabase } from './supabase';

// Use Supabase for authentication
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectTo = window.location.hostname === 'localhost'
        ? undefined // Use default for localhost
        : `${window.location.origin}/`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return { user, loading, signInWithGoogle, signOut };
};

// Supabase sync for data storage
export const useSupabaseSync = (user, defaultData, tableName) => {
  const loadData = async () => {
    if (!user) return defaultData;

    try {
      const { data: result, error } = await supabase
        .from(tableName)
        .select('data')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`No ${tableName} found, using default`);
          return defaultData;
        } else {
          console.error(`Error loading ${tableName}:`, error);
          return defaultData;
        }
      } else if (result) {
        console.log(`✅ Loaded ${tableName} from Supabase:`, result.data);
        return result.data;
      }
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      return defaultData;
    }
  };

  const saveData = async (newData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .upsert({
          user_id: user.id,
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

  return { loadData, saveData };
};
