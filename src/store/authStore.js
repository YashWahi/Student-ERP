// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
        role: state.role,
        tenantId: state.tenantId,
        branchId: state.branchId,
        academicSession: state.academicSession,
      }),
    }
  )
);

