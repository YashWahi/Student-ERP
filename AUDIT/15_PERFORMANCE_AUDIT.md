# Performance Audit — EduERP Pro

## Optimizations Verified
- **Lazy Loading**: `lazyRetry` wrapper in `App.jsx` handles code splitting and automatic dynamic chunk retry on deployment hash updates.
- **Bundle Optimization**: Built via Vite 8 with chunk size warning limits and Rolldown/ESbuild minification.
- **State Caching**: TanStack React Query (`staleTime: 5 min`) prevents duplicate network requests.
