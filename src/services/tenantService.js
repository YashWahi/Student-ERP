// src/services/tenantService.js
import { db } from '../config/firebase.js';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { logAuditEvent } from './auditService.js';
import { DEFAULT_THEME, createTenantDefaultTheme } from '../components/theme/themeUtils.js';

// DEFAULT MODULES ENTITLEMENT MATRIX
export const DEFAULT_MODULE_CONFIG = {
  students: true,
  teachers: true,
  staff: true,
  attendance: true,
  fees: true,
  exams: true,
  homework: true,
  timetable: true,
  library: true,
  transport: true,
  hostel: true,
  payroll: true,
  communication: true,
  complaints: true,
  reports: true,
  idcards: true,
};

// Safe Firestore Promise wrapper with timeout to prevent hanging on offline/unauthenticated calls
export const safeQuery = async (promise, timeoutMs = 800) => {
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), timeoutMs))
    ]);
  } catch (err) {
    return null;
  }
};

// REAL TENANT PROVISIONING WORKFLOW
export const provisionNewCollegeTenant = async (provisionData) => {
  const {
    collegeName,
    collegeCode,
    email,
    phone,
    address,
    state,
    city,
    slug,
    planTier = 'Standard',
    adminName,
    adminEmail,
    adminPassword = 'password123',
    creatorUid = 'superadmin',
    themeConfig,
    websiteConfig,
    enabledModules,
  } = provisionData;

  const tenantId = `tenant_${collegeCode.toLowerCase()}_${Date.now()}`;
  const branchId = `branch_main_${Date.now()}`;
  const adminUid = `user_admin_${Date.now()}`;
  const subId = `sub_${Date.now()}`;

  const tenantDoc = {
    id: tenantId,
    tenantId,
    name: collegeName,
    code: collegeCode.toUpperCase(),
    slug: slug || collegeCode.toLowerCase(),
    email,
    adminEmail,
    adminName,
    phone,
    address: `${address}, ${city}, ${state}`,
    plan: planTier,
    status: 'Active',
    studentsCount: planTier === 'Enterprise' ? 9800 : planTier === 'Premium' ? 3200 : 1200,
    enabledModules: enabledModules || DEFAULT_MODULE_CONFIG,
    themeConfig: themeConfig || createTenantDefaultTheme({ name: collegeName, code: collegeCode }),
    draftTheme: null,
    themeHistory: [
      {
        version: 1,
        publishedAt: new Date().toISOString(),
        publishedBy: 'Super Admin',
        themeConfig: themeConfig || createTenantDefaultTheme({ name: collegeName, code: collegeCode }),
      }
    ],
    websiteConfig: websiteConfig || null,
    createdBy: creatorUid,
    createdAtIso: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };

  // 1. Immediate local persistence for 0ms latency and offline resilience
  try {
    const existingTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    existingTenants.unshift(tenantDoc);
    localStorage.setItem('custom_tenants', JSON.stringify(existingTenants));

    const existingUsers = JSON.parse(localStorage.getItem('custom_users') || '[]');
    const adminUser = {
      uid: adminUid,
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      role: 'admin',
      tenantId,
      branchId,
      status: 'Active',
      schoolName: collegeName,
    };
    existingUsers.unshift(adminUser);
    localStorage.setItem('custom_users', JSON.stringify(existingUsers));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }

  // 2. Asynchronous Firestore Cloud Sync
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    setDoc(tenantRef, {
      ...tenantDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(e => console.warn('Firestore setDoc tenant non-blocking:', e.message));

    const schoolRef = doc(db, 'schools', tenantId);
    setDoc(schoolRef, {
      ...tenantDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).catch(e => console.warn('Firestore setDoc school non-blocking:', e.message));

    const branchRef = doc(db, 'branches', branchId);
    const branchDoc = {
      branchId,
      tenantId,
      name: `${collegeName} — Main Campus`,
      code: `${collegeCode.toUpperCase()}-MAIN`,
      address: `${address}, ${city}, ${state}`,
      headAdminName: adminName,
      headAdminEmail: adminEmail,
      status: 'Active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    setDoc(branchRef, branchDoc).catch(e => console.warn('Firestore setDoc branch non-blocking:', e.message));

    const adminUserRef = doc(db, 'users', adminUid);
    const adminUserDoc = {
      uid: adminUid,
      email: adminEmail,
      name: adminName,
      password: adminPassword,
      role: 'admin',
      tenantId,
      branchId,
      status: 'Active',
      enabledModules: DEFAULT_MODULE_CONFIG,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    setDoc(adminUserRef, adminUserDoc).catch(e => console.warn('Firestore setDoc user non-blocking:', e.message));

    const subRef = doc(db, 'subscriptions', subId);
    const subDoc = {
      id: subId,
      subId,
      tenantId,
      college: collegeName,
      collegeName,
      plan: planTier,
      planTier,
      amount: planTier === 'Enterprise' ? 120000 : planTier === 'Premium' ? 48000 : planTier === 'Standard' ? 24000 : 12000,
      billing: 'Annual',
      billingCycle: 'Annual',
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    setDoc(subRef, subDoc).catch(e => console.warn('Firestore setDoc sub non-blocking:', e.message));
  } catch (err) {
    console.warn('Firestore setDoc fallback:', err.message);
  }

  // 3. Log Security Audit Event
  await logAuditEvent({
    action: 'CREATE_TENANT',
    actor: 'Super Admin',
    target: collegeName,
    details: `Provisioned college tenant ${collegeCode} with ${planTier} plan and main branch.`,
    tenantId,
  });

  return { tenantId, branchId, adminUid, subId };
};

// SUBADMIN BRANCH PROVISIONING
export const provisionNewBranch = async (branchData) => {
  const {
    collegeName,
    collegeCode,
    email,
    phone,
    address,
    city,
    state,
    adminName,
    adminEmail,
    tenantId = 'tenant_gvis',
  } = branchData;

  const branchId = `branch_${(collegeCode || 'br').toLowerCase()}_${Date.now()}`;
  const branchName = collegeName || `Campus Branch ${collegeCode || ''}`;

  const branchDoc = {
    id: branchId,
    branchId,
    tenantId,
    name: branchName,
    location: `${city || 'Location'}, ${state || ''}`,
    admin: adminName || 'Branch Head',
    email: adminEmail || 'admin@branch.edu',
    students: 850,
    teachers: 45,
    attendance: '93%',
    feeStatus: '₹18.5L collected',
    status: 'Active',
    createdAtIso: new Date().toISOString(),
  };

  try {
    const branchRef = doc(db, 'branches', branchId);
    await setDoc(branchRef, { ...branchDoc, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  } catch (err) {
    console.warn('Firestore branch creation fallback:', err.message);
  }

  try {
    const existing = JSON.parse(localStorage.getItem('custom_branches') || '[]');
    existing.unshift(branchDoc);
    localStorage.setItem('custom_branches', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage branch save error:', e);
  }

  await logAuditEvent({
    action: 'CREATE_BRANCH',
    actor: 'Sub Admin',
    target: branchName,
    details: `Provisioned new campus branch ${branchName} under tenant ${tenantId}.`,
    tenantId,
  });

  return branchDoc;
};

// Fetch All Branches for SubAdmin
export const getBranches = async () => {
  try {
    const branchesRef = collection(db, 'branches');
    const snap = await safeQuery(getDocs(branchesRef), 500);
    const firestoreBranches = snap ? snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) : [];
    const localBranches = JSON.parse(localStorage.getItem('custom_branches') || '[]');
    return [...firestoreBranches, ...localBranches];
  } catch (err) {
    return JSON.parse(localStorage.getItem('custom_branches') || '[]');
  }
};

// Fetch All Tenants with optional status filter from 'tenants' and 'schools' Firestore collections
export const getColleges = async (statusFilter = null) => {
  let firestoreTenants = [];
  try {
    const tenantsRef = collection(db, 'tenants');
    let q = query(tenantsRef, orderBy('createdAt', 'desc'));
    if (statusFilter) {
      q = query(tenantsRef, where('status', '==', statusFilter));
    }
    const snap = await safeQuery(getDocs(q), 500);
    if (snap) {
      firestoreTenants = snap.docs.map(doc => ({ id: doc.id, tenantId: doc.id, ...doc.data() }));
    }
  } catch (err) {
    console.warn('Firestore tenants fetch fallback:', err.message);
  }

  // Also query 'schools' collection if tenants is empty or to complement
  if (firestoreTenants.length === 0) {
    try {
      const schoolsRef = collection(db, 'schools');
      let qSchools = query(schoolsRef, orderBy('createdAt', 'desc'));
      if (statusFilter) {
        qSchools = query(schoolsRef, where('status', '==', statusFilter));
      }
      const snapSchools = await safeQuery(getDocs(qSchools), 500);
      if (snapSchools) {
        const schoolDocs = snapSchools.docs.map(doc => ({ id: doc.id, tenantId: doc.id, ...doc.data() }));
        firestoreTenants = [...firestoreTenants, ...schoolDocs];
      }
    } catch (err) {
      console.warn('Firestore schools fetch fallback:', err.message);
    }
  }

  const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
  const combined = [...firestoreTenants, ...localTenants];

  // Deduplicate by ID and preserve latest published theme
  const seenMap = new Map();
  combined.forEach(item => {
    const key = item.tenantId || item.id;
    if (!key) return;

    // Check if there's a cached published theme in localStorage
    try {
      const cachedThemeRaw = localStorage.getItem(`published_theme_${key}`);
      if (cachedThemeRaw) {
        const cachedTheme = JSON.parse(cachedThemeRaw);
        if ((cachedTheme.version || 0) >= (item.themeConfig?.version || 0)) {
          item.themeConfig = cachedTheme;
        }
      }
    } catch {}

    if (!seenMap.has(key)) {
      seenMap.set(key, item);
    } else {
      const existing = seenMap.get(key);
      // Merge newer theme config if present
      const existingVersion = Number(existing.themeConfig?.version || 0);
      const itemVersion = Number(item.themeConfig?.version || 0);
      if (itemVersion > existingVersion || (!existing.themeConfig && item.themeConfig)) {
        seenMap.set(key, { ...existing, ...item });
      }
    }
  });

  const deduped = Array.from(seenMap.values());

  if (statusFilter) {
    return deduped.filter(c => c.status === statusFilter);
  }
  return deduped;
};

// Fetch All Subscriptions from 'subscriptions' collection
export const getSubscriptions = async (statusFilter = null) => {
  let firestoreSubs = [];
  try {
    const subsRef = collection(db, 'subscriptions');
    const snap = await safeQuery(getDocs(subsRef), 500);
    if (snap) {
      firestoreSubs = snap.docs.map(doc => ({
        id: doc.id,
        subId: doc.id,
        college: doc.data().college || doc.data().collegeName || 'College Tenant',
        plan: doc.data().plan || doc.data().planTier || 'Standard',
        amount: doc.data().amount || 24000,
        billing: doc.data().billing || doc.data().billingCycle || 'Annual',
        expiryDate: doc.data().expiryDate || '2027-08-31',
        status: doc.data().status || 'Active',
        ...doc.data(),
      }));
    }
  } catch (err) {
    console.warn('Firestore subscriptions fetch fallback:', err.message);
  }

  const localSubs = JSON.parse(localStorage.getItem('custom_subscriptions') || '[]');
  const combined = [...firestoreSubs, ...localSubs];

  const seen = new Set();
  const deduped = combined.filter(item => {
    const key = item.id || item.subId;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (statusFilter) {
    return deduped.filter(s => s.status === statusFilter);
  }
  return deduped;
};

// Create a subscription record in Firestore 'subscriptions' collection
export const createSubscriptionRecord = async (subData) => {
  const subId = `sub_${Date.now()}`;
  const subDoc = {
    id: subId,
    subId,
    college: subData.college,
    collegeName: subData.college,
    plan: subData.plan,
    planTier: subData.plan,
    amount: Number(subData.amount),
    billing: 'Annual',
    billingCycle: 'Annual',
    expiryDate: subData.expiryDate,
    status: 'Active',
    createdAtIso: new Date().toISOString(),
  };

  try {
    const subRef = doc(db, 'subscriptions', subId);
    await setDoc(subRef, {
      ...subDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore subscription setDoc fallback:', err.message);
  }

  try {
    const existing = JSON.parse(localStorage.getItem('custom_subscriptions') || '[]');
    existing.unshift(subDoc);
    localStorage.setItem('custom_subscriptions', JSON.stringify(existing));
  } catch (e) {
    console.warn('LocalStorage sub save error:', e);
  }

  await logAuditEvent({
    action: 'CREATE_SUBSCRIPTION',
    actor: 'Super Admin',
    target: subData.college,
    details: `Issued ${subData.plan} subscription valid until ${subData.expiryDate}`,
  });

  return subDoc;
};

// Renew or update subscription record in Firestore 'subscriptions' collection
export const renewSubscriptionRecord = async (subId, updates = {}) => {
  const subRef = doc(db, 'subscriptions', subId);
  try {
    await updateDoc(subRef, {
      ...updates,
      status: updates.status || 'Active',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Firestore subscription update fallback:', err.message);
  }

  try {
    const existing = JSON.parse(localStorage.getItem('custom_subscriptions') || '[]');
    const updated = existing.map(s => (s.id === subId || s.subId === subId) ? { ...s, ...updates, status: updates.status || 'Active' } : s);
    localStorage.setItem('custom_subscriptions', JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage sub update error:', e);
  }
};

// Update College Tenant Status or Modules in 'tenants' and 'schools' collections
export const updateCollegeTenant = async (tenantId, updates) => {
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore tenants update fallback:', err.message);
  }

  try {
    const schoolRef = doc(db, 'schools', tenantId);
    await setDoc(schoolRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore schools update fallback:', err.message);
  }

  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const updatedLocal = localTenants.map(t => (t.id === tenantId || t.tenantId === tenantId) ? { ...t, ...updates } : t);
    localStorage.setItem('custom_tenants', JSON.stringify(updatedLocal));
  } catch (e) {
    console.warn('LocalStorage update error:', e);
  }

  await logAuditEvent({
    action: 'UPDATE_TENANT',
    actor: 'Super Admin',
    target: tenantId,
    details: `Updated tenant properties: ${Object.keys(updates).join(', ')}`,
    tenantId,
  });
};

// Suspend / Delete Tenant in 'tenants' and 'schools' collections
export const deleteCollegeTenant = async (tenantId, collegeName) => {
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { status: 'Suspended', updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore delete/suspend fallback:', err.message);
  }

  try {
    const schoolRef = doc(db, 'schools', tenantId);
    await setDoc(schoolRef, { status: 'Suspended', updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore schools delete/suspend fallback:', err.message);
  }

  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const updatedLocal = localTenants.map(t => (t.id === tenantId || t.tenantId === tenantId) ? { ...t, status: 'Suspended' } : t);
    localStorage.setItem('custom_tenants', JSON.stringify(updatedLocal));
  } catch (e) {
    console.warn('LocalStorage suspend error:', e);
  }

  await logAuditEvent({
    action: 'SUSPEND_TENANT',
    actor: 'Super Admin',
    target: collegeName || tenantId,
    details: `Suspended college tenant access.`,
    tenantId,
  });
};

/**
 * Fetch a single tenant document by tenantId or slug (multi-source: Firestore + LocalStorage fallback)
 */
export const getTenant = async (tenantIdOrSlug) => {
  if (!tenantIdOrSlug) return null;

  // 0. Pre-fetch cached published theme from localStorage for instant accuracy
  let cachedTheme = null;
  try {
    const raw = localStorage.getItem(`published_theme_${tenantIdOrSlug}`);
    if (raw) cachedTheme = JSON.parse(raw);
  } catch {}

  // 1. Check LocalStorage 'custom_tenants'
  let localMatch = null;
  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    localMatch = localTenants.find(t =>
      t.id === tenantIdOrSlug ||
      t.tenantId === tenantIdOrSlug ||
      t.slug === tenantIdOrSlug ||
      t.code?.toLowerCase() === tenantIdOrSlug.toLowerCase()
    );
    if (localMatch && cachedTheme) {
      if ((cachedTheme.version || 0) >= (localMatch.themeConfig?.version || 0)) {
        localMatch.themeConfig = cachedTheme;
      }
    }
  } catch (e) {
    console.warn('LocalStorage getTenant fallback error:', e);
  }

  // 2. Check Firestore 'tenants' collection
  try {
    const tenantRef = doc(db, 'tenants', tenantIdOrSlug);
    const snap = await safeQuery(getDoc(tenantRef), 600);
    if (snap && snap.exists()) {
      const data = { id: snap.id, tenantId: snap.id, ...snap.data() };
      if (cachedTheme && (!data.themeConfig || (cachedTheme.version || 0) >= (data.themeConfig.version || 0))) {
        data.themeConfig = cachedTheme;
      }
      return data;
    }
  } catch (err) {
    console.warn('Firestore getTenant fallback:', err.message);
  }

  // 3. Check Firestore 'schools' collection
  try {
    const schoolRef = doc(db, 'schools', tenantIdOrSlug);
    const snap = await safeQuery(getDoc(schoolRef), 600);
    if (snap && snap.exists()) {
      const data = { id: snap.id, tenantId: snap.id, ...snap.data() };
      if (cachedTheme && (!data.themeConfig || (cachedTheme.version || 0) >= (data.themeConfig.version || 0))) {
        data.themeConfig = cachedTheme;
      }
      return data;
    }
  } catch (err) {
    console.warn('Firestore getSchool fallback:', err.message);
  }

  // 4. Return localMatch if found
  if (localMatch) return localMatch;

  return null;
};

/**
 * Get tenant theme configuration (published + draft + history)
 */
export const getTenantThemeConfig = async (tenantId) => {
  if (!tenantId) return { themeConfig: DEFAULT_THEME, draftTheme: null, themeHistory: [], tenantMeta: null };

  const tenant = await getTenant(tenantId);
  if (tenant) {
    const fallbackDefault = createTenantDefaultTheme(tenant);
    let themeConfig = tenant.themeConfig || fallbackDefault;

    // Check if there is an authoritative local published theme cache
    try {
      const cached = localStorage.getItem(`published_theme_${tenantId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if ((parsed.version || 0) >= (themeConfig.version || 0)) {
          themeConfig = parsed;
        }
      }
    } catch {}

    // Check draft cache from sessionStorage
    let draftTheme = tenant.draftTheme || null;
    try {
      const rawDraft = sessionStorage.getItem(`draft_theme_${tenantId}`);
      if (rawDraft) draftTheme = JSON.parse(rawDraft);
    } catch {}

    // Ensure branding has real tenant identity
    const authoritativeName = tenant.name || tenant.collegeName || 'Institution';
    const authoritativeCode = tenant.code || tenant.collegeCode || 'COL';
    const authoritativeTagline = tenant.tagline || 'Empowering Next-Gen Leaders';

    const mergedBranding = {
      collegeName: authoritativeName,
      shortName: authoritativeCode,
      tagline: themeConfig.branding?.tagline || authoritativeTagline,
      logoUrl: themeConfig.branding?.logoUrl || tenant.logoUrl || '',
      faviconUrl: themeConfig.branding?.faviconUrl || tenant.faviconUrl || '',
      welcomeMessage: themeConfig.branding?.welcomeMessage || `Welcome to ${authoritativeName} Portal`,
      ...themeConfig.branding,
      // Priority overwrite for identity
      ...(themeConfig.branding?.collegeName === 'EduERP Platform' || themeConfig.branding?.collegeName === 'Educational Institution'
        ? { collegeName: authoritativeName, shortName: authoritativeCode }
        : {}),
    };

    return {
      themeConfig: { ...themeConfig, branding: mergedBranding },
      draftTheme,
      themeHistory: tenant.themeHistory || [],
      tenantMeta: {
        id: tenant.tenantId || tenant.id,
        name: authoritativeName,
        code: authoritativeCode,
        slug: tenant.slug || authoritativeCode.toLowerCase() || 'college',
        tagline: authoritativeTagline,
        logoUrl: tenant.logoUrl || '',
      }
    };
  }

  return { themeConfig: DEFAULT_THEME, draftTheme: null, themeHistory: [], tenantMeta: null };
};

/**
 * Save draft theme configuration for a tenant (without altering live published theme)
 */
export const saveTenantThemeDraft = async (tenantId, draftConfig) => {
  const draftPayload = {
    ...draftConfig,
    draftUpdatedAt: new Date().toISOString(),
    status: 'draft',
  };

  const updates = {
    draftTheme: draftPayload,
    draftUpdatedAtIso: new Date().toISOString(),
  };

  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore draft save fallback:', err.message);
  }

  try {
    const schoolRef = doc(db, 'schools', tenantId);
    await setDoc(schoolRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore schools draft save fallback:', err.message);
  }

  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const updatedLocal = localTenants.map(t => (t.id === tenantId || t.tenantId === tenantId) ? { ...t, ...updates } : t);
    localStorage.setItem('custom_tenants', JSON.stringify(updatedLocal));
  } catch (e) {
    console.warn('LocalStorage draft save error:', e);
  }

  // Update in-memory draft cache
  try {
    sessionStorage.setItem(`draft_theme_${tenantId}`, JSON.stringify(draftPayload));
  } catch {}

  return draftPayload;
};

/**
 * Publish theme configuration for a tenant (promotes to live themeConfig, increments version, logs version history, broadcasts update)
 */
export const publishTenantTheme = async (tenantId, themeConfig, publishedBy = 'Super Admin') => {
  const currentTenant = await getTenant(tenantId);
  const previousConfig = currentTenant?.themeConfig || null;
  const currentVersion = Number(themeConfig.version || previousConfig?.version || 1);
  const nextVersion = currentVersion + 1;

  const tenantName = currentTenant?.name || currentTenant?.collegeName || themeConfig.branding?.collegeName || 'Institution';
  const tenantCode = currentTenant?.code || themeConfig.branding?.shortName || 'COL';

  const authoritativeBranding = {
    ...themeConfig.branding,
    collegeName: themeConfig.branding?.collegeName || tenantName,
    shortName: themeConfig.branding?.shortName || tenantCode,
  };

  const publishedRecord = {
    ...themeConfig,
    branding: authoritativeBranding,
    version: nextVersion,
    publishedAt: new Date().toISOString(),
    publishedBy,
    status: 'published',
  };

  // Build snapshot for history
  const historySnapshot = {
    version: nextVersion,
    publishedAt: publishedRecord.publishedAt,
    publishedBy,
    themeConfig: { ...publishedRecord },
  };

  const existingHistory = currentTenant?.themeHistory || [];
  const updatedHistory = [historySnapshot, ...existingHistory.filter(h => h.version !== nextVersion)].slice(0, 20);

  const updates = {
    themeConfig: publishedRecord,
    draftTheme: null, // Clear draft once published
    themeHistory: updatedHistory,
    lastThemePublishedAt: publishedRecord.publishedAt,
    updatedAtIso: new Date().toISOString(),
  };

  // 1. Update Firestore 'tenants' using setDoc merge
  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore publish theme fallback:', err.message);
  }

  // 2. Update Firestore 'schools' using setDoc merge
  try {
    const schoolRef = doc(db, 'schools', tenantId);
    await setDoc(schoolRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore schools publish theme fallback:', err.message);
  }

  // 3. Update LocalStorage authoritative caches
  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const exists = localTenants.some(t => t.id === tenantId || t.tenantId === tenantId);
    let updatedLocal;
    if (exists) {
      updatedLocal = localTenants.map(t => (t.id === tenantId || t.tenantId === tenantId) ? { ...t, ...updates, name: tenantName, code: tenantCode } : t);
    } else {
      updatedLocal = [{ id: tenantId, tenantId, name: tenantName, code: tenantCode, ...updates }, ...localTenants];
    }
    localStorage.setItem('custom_tenants', JSON.stringify(updatedLocal));
    localStorage.setItem(`published_theme_${tenantId}`, JSON.stringify(publishedRecord));
    sessionStorage.removeItem(`draft_theme_${tenantId}`);
  } catch (e) {
    console.warn('LocalStorage publish theme error:', e);
  }

  // 4. Realtime Broadcast Event to notify active ThemeProviders and tabs
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('theme_published', {
        detail: { tenantId, themeConfig: publishedRecord }
      }));
    } catch {}
  }

  await logAuditEvent({
    action: 'PUBLISH_THEME',
    actor: publishedBy,
    target: tenantName,
    details: `Published Theme v${nextVersion} (Primary: ${publishedRecord.colors?.primary || '#2563EB'})`,
    tenantId,
  });

  return publishedRecord;
};

/**
 * Rollback tenant theme to a specific past version from themeHistory
 */
export const rollbackTenantTheme = async (tenantId, targetVersion, restoredBy = 'Super Admin') => {
  const currentTenant = await getTenant(tenantId);
  const history = currentTenant?.themeHistory || [];
  const targetSnapshot = history.find(h => h.version === targetVersion);

  if (!targetSnapshot) {
    throw new Error(`Theme version v${targetVersion} not found in history.`);
  }

  const restoredConfig = {
    ...targetSnapshot.themeConfig,
    version: targetVersion,
    restoredAt: new Date().toISOString(),
    restoredBy,
    status: 'published',
  };

  const updates = {
    themeConfig: restoredConfig,
    draftTheme: null,
    lastThemePublishedAt: new Date().toISOString(),
    updatedAtIso: new Date().toISOString(),
  };

  try {
    const tenantRef = doc(db, 'tenants', tenantId);
    await setDoc(tenantRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore rollback fallback:', err.message);
  }

  try {
    const schoolRef = doc(db, 'schools', tenantId);
    await setDoc(schoolRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('Firestore schools rollback fallback:', err.message);
  }

  try {
    const localTenants = JSON.parse(localStorage.getItem('custom_tenants') || '[]');
    const updatedLocal = localTenants.map(t => (t.id === tenantId || t.tenantId === tenantId) ? { ...t, ...updates } : t);
    localStorage.setItem('custom_tenants', JSON.stringify(updatedLocal));
    localStorage.setItem(`published_theme_${tenantId}`, JSON.stringify(restoredConfig));
  } catch (e) {
    console.warn('LocalStorage rollback error:', e);
  }

  // Realtime Broadcast
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('theme_published', {
        detail: { tenantId, themeConfig: restoredConfig }
      }));
    } catch {}
  }

  await logAuditEvent({
    action: 'ROLLBACK_THEME',
    actor: restoredBy,
    target: restoredConfig.branding?.collegeName || tenantId,
    details: `Rolled back theme to version v${targetVersion}`,
    tenantId,
  });

  return restoredConfig;
};

