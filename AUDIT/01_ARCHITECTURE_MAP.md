# Architecture Map — EduERP Pro

## Core Technology Stack
- **Framework**: React 19 + Vite 8
- **Router**: React Router DOM v7 (`BrowserRouter`)
- **State Management**: Zustand v5 (`authStore`, `studentStore`, `crmStore`) with `persist` middleware
- **Data Fetching / Caching**: TanStack React Query v5
- **Backend / DB / Auth**: Firebase 12 (Firebase Auth, Cloud Firestore, Firebase Hosting)
- **UI & Styling**: Vanilla CSS Tokenized Design System (`src/styles/globals.css`, `src/styles/themes.css`, `src/styles/variables.css`)
- **Icons & Animation**: Lucide React + Framer Motion
- **PDF & Export Engine**: jsPDF, html2canvas, XLSX parser/exporter
- **Payments**: Razorpay Checkout SDK Integration (`src/services/razorpayService.js`)

## Architectural Layers
```
┌─────────────────────────────────────────────────────────────┐
│                       React Router (App.jsx)                 │
├─────────────────────────────────────────────────────────────┤
│   Layout Shells (AdminLayout, StudentLayout, Teacher, etc.)  │
├─────────────────────────────────────────────────────────────┤
│   Feature Pages (AdmissionsCRM, StudentList, FeeStructure)   │
├─────────────────────────────────────────────────────────────┤
│   Zustand Stores (authStore, studentStore, crmStore)         │
├─────────────────────────────────────────────────────────────┤
│   Service Abstraction Layer (tenantService, feeService, etc.) │
├─────────────────────────────────────────────────────────────┤
│   Firebase SDK (auth, db / Cloud Firestore)                  │
└─────────────────────────────────────────────────────────────┘
```

## Security & Multi-Tenancy Architecture
- **Tenant Context Key**: `tenantId` (e.g. `tenant_gvis`, `tenant_1234_...`)
- **Branch Context Key**: `branchId` (e.g. `branch_main`)
- **Role Scoping**: Enforced via `ProtectedRoute` in `App.jsx`, `usePermissions` hook, and collection-level query filters.
