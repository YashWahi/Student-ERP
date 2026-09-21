// src/components/theme/ThemeProvider.jsx
import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_THEME, applyThemeToDom, createTenantDefaultTheme } from './themeUtils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getTenant } from '../../services/tenantService';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  tenantTheme: DEFAULT_THEME,
  previewTheme: null,
  setPreviewTheme: () => {},
  resetPreviewTheme: () => {},
  isLivePreview: false,
  activeTenantMeta: null,
  reloadTenantTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const { tenantId: authTenantId } = useAuthStore();
  const [tenantTheme, setTenantTheme] = useState(DEFAULT_THEME);
  const [previewTheme, setPreviewThemeState] = useState(null);
  const [activeTenantMeta, setActiveTenantMeta] = useState(null);
  const [publicTenantId, setPublicTenantId] = useState(null);

  // Check URL search parameters or pathname for public tenant (e.g. /login?tenant=... or /college/:slug)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPublicTenant = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTenant = searchParams.get('tenant') || searchParams.get('college');

      let resolvedTenantId = null;
      if (urlTenant) {
        resolvedTenantId = urlTenant;
      } else {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (['college', 'landing', 'website'].includes(pathParts[0]) && pathParts[1]) {
          resolvedTenantId = pathParts[1];
        }
      }

      if (resolvedTenantId) {
        const tenant = await getTenant(resolvedTenantId);
        if (tenant) {
          setPublicTenantId(tenant.tenantId || tenant.id);
          setActiveTenantMeta({
            name: tenant.name,
            code: tenant.code,
            slug: tenant.slug,
          });
          if (tenant.themeConfig) {
            setTenantTheme(tenant.themeConfig);
          }
        }
      }
    };

    checkPublicTenant();
  }, [window.location.pathname, window.location.search]);

  const effectiveTenantId = authTenantId || publicTenantId;

  // Load tenant theme with multi-source fallback (Firestore + LocalStorage cache)
  useEffect(() => {
    if (!effectiveTenantId) {
      setTenantTheme(DEFAULT_THEME);
      setActiveTenantMeta(null);
      return;
    }

    let isMounted = true;

    // 1. Instant local cache resolution for zero flicker
    try {
      const cached = localStorage.getItem(`published_theme_${effectiveTenantId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isMounted) setTenantTheme(parsed);
      } else {
        const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
        const matched = localTenants.find(t => (t.id === effectiveTenantId || t.tenantId === effectiveTenantId || t.slug === effectiveTenantId));
        if (matched && isMounted) {
          setTenantTheme(matched.themeConfig || createTenantDefaultTheme(matched));
          setActiveTenantMeta({ name: matched.name, code: matched.code, slug: matched.slug });
        }
      }
    } catch (e) {
      console.warn('ThemeProvider local cache error:', e);
    }

    // 2. Real-time Firestore subscription
    let unsub = () => {};
    try {
      unsub = onSnapshot(doc(db, 'tenants', effectiveTenantId), (snap) => {
        if (!isMounted) return;
        if (snap.exists() && snap.data().themeConfig) {
          const data = snap.data();
          let effectiveConfig = data.themeConfig;
          try {
            const cached = localStorage.getItem(`published_theme_${effectiveTenantId}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              if ((parsed.version || 0) > (data.themeConfig.version || 0)) {
                effectiveConfig = parsed;
              }
            }
          } catch {}

          setTenantTheme(effectiveConfig);
          setActiveTenantMeta({
            name: data.name,
            code: data.code,
            slug: data.slug,
          });
        } else {
          // Check local fallback
          const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
          const matched = localTenants.find(t => (t.id === effectiveTenantId || t.tenantId === effectiveTenantId));
          if (matched && isMounted) {
            setTenantTheme(matched.themeConfig || createTenantDefaultTheme(matched));
          }
        }
      }, (err) => {
        console.warn('ThemeProvider onSnapshot fallback:', err.message);
        // Fallback to local storage
        const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
        const matched = localTenants.find(t => (t.id === effectiveTenantId || t.tenantId === effectiveTenantId));
        if (matched && isMounted) {
          setTenantTheme(matched.themeConfig || createTenantDefaultTheme(matched));
        }
      });
    } catch (err) {
      console.warn('ThemeProvider Firestore attach error:', err);
    }

    // 3. Realtime event listener for live theme publications
    const handleThemePublished = (e) => {
      const { tenantId, themeConfig } = e.detail || {};
      if (tenantId === effectiveTenantId && themeConfig && isMounted) {
        setTenantTheme(themeConfig);
      }
    };
    window.addEventListener('theme_published', handleThemePublished);

    return () => {
      isMounted = false;
      unsub();
      window.removeEventListener('theme_published', handleThemePublished);
    };
  }, [effectiveTenantId]);

  // Apply theme dynamically to document root whenever theme state updates
  useEffect(() => {
    const activeTheme = previewTheme || tenantTheme || DEFAULT_THEME;
    applyThemeToDom(activeTheme);
  }, [tenantTheme, previewTheme]);

  const setPreviewTheme = (config) => {
    setPreviewThemeState(config);
  };

  const resetPreviewTheme = () => {
    setPreviewThemeState(null);
  };

  const reloadTenantTheme = async () => {
    if (!effectiveTenantId) return;
    const tenant = await getTenant(effectiveTenantId);
    if (tenant?.themeConfig) {
      setTenantTheme(tenant.themeConfig);
    }
  };

  const activeTheme = useMemo(() => {
    return previewTheme || tenantTheme || DEFAULT_THEME;
  }, [previewTheme, tenantTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        tenantTheme,
        previewTheme,
        setPreviewTheme,
        resetPreviewTheme,
        isLivePreview: !!previewTheme,
        activeTenantMeta,
        reloadTenantTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
