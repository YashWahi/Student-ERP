// src/hooks/useAuth.js
import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { getUserProfile } from '../services/authService';

export const useAuth = () => {
  useEffect(() => {
    let active = true;
    let authChangeId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentChangeId = ++authChangeId;
      const { logout, setLoading, setUser, setUserProfile } = useAuthStore.getState();

      if (!firebaseUser) {
        logout();
        return;
      }

      setLoading(true);
      try {
        const profile = await getUserProfile(firebaseUser.uid);
        if (!active || currentChangeId !== authChangeId) {
          return;
        }

        if (!profile) {
          console.error('Authenticated Firebase user has no valid ERP profile.');
          await signOut(auth);
          return;
        }

        setUser(firebaseUser);
        setUserProfile(profile);
      } catch (error) {
        if (!active || currentChangeId !== authChangeId) {
          return;
        }
        console.error('Unable to resolve the authenticated Firebase user profile:', error);
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error('Unable to clear Firebase session after profile resolution failed:', signOutError);
        }
      } finally {
        if (active && currentChangeId === authChangeId) {
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Firebase authentication state listener failed:', error);
      useAuthStore.getState().logout();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
};
