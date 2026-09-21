// src/hooks/useAuth.js
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { getUserProfile } from '../services/authService';

export const useAuth = () => {
  const { user: storedUser, userProfile: storedProfile, setUser, setUserProfile, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentProfile = useAuthStore.getState().userProfile;
      if (currentProfile?.isImpersonating) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile && !useAuthStore.getState().userProfile?.isImpersonating) {
            setUserProfile(profile);
          }
        } catch (e) {
          console.warn('Profile fetch error:', e);
        }
      } else {
        // If no stored local session exists, set user to null
        if (!storedUser && !storedProfile) {
          setUser(null);
          setUserProfile(null);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);
};
