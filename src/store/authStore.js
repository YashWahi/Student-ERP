// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

try {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('custom_users');
  }
} catch (error) {
  console.error('Unable to clear legacy local user records:', error);
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      role: null,
      tenantId: null,
      branchId: null,
      academicSession: '2026-27',
      loading: true,

      setUser: (user) => set({ user }),
      setUserProfile: (profile) => set({
        userProfile: profile,
        role: profile?.role || null,
        tenantId: profile?.tenantId || null,
        branchId: profile?.branchId || null,
      }),
      setRole: (role) => set((state) => ({
        role,
        userProfile: state.userProfile ? { ...state.userProfile, role } : { role }
      })),
      setTenantId: (tenantId) => set((state) => ({
        tenantId,
        userProfile: state.userProfile ? { ...state.userProfile, tenantId } : { tenantId }
      })),
      setBranchId: (branchId) => set((state) => ({
        branchId,
        userProfile: state.userProfile ? { ...state.userProfile, branchId } : { branchId }
      })),
      setAcademicSession: (academicSession) => set({ academicSession }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({
        user: null,
        userProfile: null,
        role: null,
        tenantId: null,
        branchId: null,
        academicSession: '2026-27',
        loading: false,
      }),
    }),
    {
      name: 'auth-storage',
      version: 1,
      partialize: (state) => ({ academicSession: state.academicSession }),
      migrate: (persistedState) => ({
        academicSession: persistedState?.academicSession || '2026-27',
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        academicSession: persistedState?.academicSession || currentState.academicSession,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Unable to restore ERP preferences:', error);
          return;
        }
        state?.setAcademicSession(state.academicSession);
      },
    }
  )
);
