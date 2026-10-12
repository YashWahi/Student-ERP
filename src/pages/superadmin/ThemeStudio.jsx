// src/pages/superadmin/ThemeStudio.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Palette, Eye, Save, RotateCcw, Check, Sparkles, Layers, Building,
  Monitor, Tablet, Smartphone, Search, Bell, ChevronDown, User, Plus,
  DollarSign, BookOpen, Calendar, GraduationCap, Users, CheckCircle2,
  Send, ExternalLink, Shield, Lock, CreditCard, Activity, ArrowRight,
  History, AlertCircle, Clock, Undo, Redo, CheckCircle, Sliders, Type,
  Layout, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  THEME_PRESETS, DEFAULT_THEME, getThemePresetById,
  createTenantDefaultTheme, validateThemeConfig, isValidHexColor, getThemeCssVariables
} from '../../components/theme/themeUtils';
import { useTheme } from '../../components/theme/ThemeProvider';
import {
  getColleges, getTenantThemeConfig, saveTenantThemeDraft,
  publishTenantTheme, rollbackTenantTheme
} from '../../services/tenantService';
import { DEFAULT_WEBSITE_CONFIG } from '../../services/websiteService';
import { logAuditEvent } from '../../services/auditService';
import CollegeLandingPage from '../public/CollegeLandingPage';
import toast from 'react-hot-toast';

const DEFAULT_TENANTS = [
  { id: 'tenant_gvis', name: 'Greenfield College', domain: 'greenfield.edu.in', code: 'GFC', slug: 'greenfield-college' },
  { id: 'tenant_ogc', name: 'Oxford Global University', domain: 'oxford.edu.in', code: 'OGC', slug: 'oxford-global' },
  { id: 'tenant_sra', name: 'Sunrise International', domain: 'sunrise.edu.in', code: 'SRA', slug: 'sunrise-academy' },
  { id: 'tenant_dpsn', name: 'Bright Future School', domain: 'brightfuture.edu.in', code: 'BFS', slug: 'bright-future' },
];

const FONTS = ['Inter', 'Poppins', 'Outfit', 'Plus Jakarta Sans', 'Roboto'];

const STUDENTS_CHART_DATA = [
  { month: 'Jan', students: 1400 },
  { month: 'Feb', students: 1650 },
  { month: 'Mar', students: 1550 },
  { month: 'Apr', students: 1800 },
  { month: 'May', students: 1720 },
  { month: 'Jun', students: 2200 },
  { month: 'Jul', students: 2750 },
];

const ATTENDANCE_PIE_DATA = [
  { name: 'Present', value: 85 },
  { name: 'Absent', value: 10 },
  { name: 'Late', value: 5 },
];

const ThemeStudio = () => {
  const { reloadTenantTheme } = useTheme();

  const [tenantsList, setTenantsList] = useState(DEFAULT_TENANTS);
  const [selectedTenantId, setSelectedTenantId] = useState('tenant_gvis');
  const [controlTab, setControlTab] = useState('presets'); // presets | colors | surfaces | typography | shapes | branding
  const [previewTab, setPreviewTab] = useState('admin'); // admin | login | student | teacher | parent | website
  const [deviceMode, setDeviceMode] = useState('desktop'); // desktop | tablet | mobile
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(false);

  // Active theme configuration state
  const [themeConfig, setThemeConfig] = useState(DEFAULT_THEME);
  const [savedPublishedTheme, setSavedPublishedTheme] = useState(null);
  const [savedDraftTheme, setSavedDraftTheme] = useState(null);
  const [themeHistory, setThemeHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Undo / Redo history stack
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const activeTenant = tenantsList.find(t => t.id === selectedTenantId) || tenantsList[0] || { name: 'Institution', code: 'COL' };

  // CSS variables scoped directly to the live preview canvas
  const previewCssVariables = useMemo(() => {
    return getThemeCssVariables(themeConfig);
  }, [themeConfig]);

  // 1. Load Tenants List from Firestore & LocalStorage on Mount
  useEffect(() => {
    const fetchTenants = async () => {
      const real = await getColleges();
      if (real.length > 0) {
        const mapped = real.map(t => ({
          id: t.tenantId || t.id,
          name: t.name || t.collegeName || 'Institution',
          domain: t.domain || `${t.code?.toLowerCase() || 'college'}.edu.in`,
          code: t.code || t.collegeCode || 'COL',
          slug: t.slug || t.code?.toLowerCase() || 'college',
          tagline: t.tagline || 'Empowering Next-Gen Leaders',
          logoUrl: t.logoUrl || '',
        }));
        setTenantsList(mapped);
        if (!mapped.some(t => t.id === selectedTenantId)) {
          setSelectedTenantId(mapped[0].id);
        }
      }
    };
    fetchTenants();
  }, []);

  // 2. Load Selected Tenant's Theme whenever selectedTenantId changes (Strict Tenant Resolution)
  useEffect(() => {
    const loadSelectedTenantTheme = async () => {
      if (!selectedTenantId) return;
      setLoadingTenant(true);

      try {
        const data = await getTenantThemeConfig(selectedTenantId);
        const tenantInfo = tenantsList.find(t => t.id === selectedTenantId) || data.tenantMeta || {};
        const authoritativeName = tenantInfo.name || 'Institution';
        const authoritativeCode = tenantInfo.code || 'COL';
        const authoritativeTagline = tenantInfo.tagline || 'Empowering Next-Gen Leaders';

        const baseDefault = createTenantDefaultTheme(tenantInfo);
        const published = data.themeConfig || baseDefault;
        const draft = data.draftTheme || null;

        // Authoritative branding resolution: always prioritize the selected tenant's real identity
        const activeBranding = {
          tagline: draft?.branding?.tagline || published?.branding?.tagline || authoritativeTagline,
          logoUrl: draft?.branding?.logoUrl || published?.branding?.logoUrl || tenantInfo.logoUrl || '',
          faviconUrl: draft?.branding?.faviconUrl || published?.branding?.faviconUrl || tenantInfo.faviconUrl || '',
          welcomeMessage: draft?.branding?.welcomeMessage || published?.branding?.welcomeMessage || `Welcome to ${authoritativeName} Portal`,
          ...published.branding,
          ...(draft ? draft.branding : {}),
          collegeName: draft?.branding?.collegeName || published?.branding?.collegeName || authoritativeName,
          shortName: draft?.branding?.shortName || published?.branding?.shortName || authoritativeCode,
        };

        // If collegeName in stored draft/published is placeholder, override with tenantInfo.name
        if (!activeBranding.collegeName || activeBranding.collegeName === 'EduERP Platform' || activeBranding.collegeName === 'Educational Institution') {
          activeBranding.collegeName = authoritativeName;
          activeBranding.shortName = authoritativeCode;
        }

        const activeTheme = draft
          ? { ...draft, branding: activeBranding }
          : { ...published, branding: activeBranding };

        setSavedPublishedTheme(published);
        setSavedDraftTheme(draft);
        setThemeHistory(data.themeHistory || []);
        setThemeConfig(activeTheme);
        setUndoStack([]);
        setRedoStack([]);

        if (draft) {
          toast(`📝 Loaded active draft for ${authoritativeName}`, { icon: 'ℹ️' });
        }
      } catch (err) {
        console.warn('Failed to load tenant theme:', err);
      } finally {
        setLoadingTenant(false);
      }
    };

    loadSelectedTenantTheme();
  }, [selectedTenantId, tenantsList]);

  // Push to Undo Stack before changing theme
  const updateThemeConfig = (updater) => {
    setThemeConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setUndoStack(old => [...old.slice(-20), prev]);
      setRedoStack([]);
      return next;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack(old => [themeConfig, ...old]);
    setUndoStack(old => old.slice(0, -1));
    setThemeConfig(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack(old => [...old, themeConfig]);
    setRedoStack(old => old.slice(1));
    setThemeConfig(next);
  };

  // Detect Unsaved Changes
  const hasUnsavedChanges = useMemo(() => {
    if (!savedPublishedTheme && !savedDraftTheme) return false;
    const baseToCompare = savedDraftTheme || savedPublishedTheme;
    return JSON.stringify(themeConfig) !== JSON.stringify(baseToCompare);
  }, [themeConfig, savedPublishedTheme, savedDraftTheme]);

  // Apply a Preset
  const handleApplyPreset = (preset) => {
    updateThemeConfig(prev => ({
      ...prev,
      preset: preset.id,
      colors: {
        ...prev.colors,
        primary: preset.primary,
        primaryHover: preset.primaryHover,
        primaryLight: preset.primaryLight,
        primaryBorder: preset.primaryBorder,
        secondary: preset.secondary,
        secondaryLight: preset.secondaryLight,
        accent: preset.accent,
        accentLight: preset.accentLight,
        background: preset.background || prev.colors.background,
        surface: preset.surface || prev.colors.surface,
        sidebar: preset.sidebar || prev.colors.sidebar,
      },
      branding: {
        ...prev.branding,
        collegeName: prev.branding?.collegeName || activeTenant.name,
        shortName: prev.branding?.shortName || activeTenant.code,
      }
    }));
    toast.success(`✨ Applied theme preset: ${preset.name}`);
  };

  // Color change handler
  const handleColorChange = (key, val) => {
    updateThemeConfig(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: val }
    }));
  };

  // Save Draft (Updates draftTheme only)
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const draftPayload = {
        ...themeConfig,
        branding: {
          ...themeConfig.branding,
          collegeName: themeConfig.branding?.collegeName || activeTenant.name,
          shortName: themeConfig.branding?.shortName || activeTenant.code,
        }
      };
      const draft = await saveTenantThemeDraft(selectedTenantId, draftPayload);
      setSavedDraftTheme(draft);
      await logAuditEvent({
        action: 'SAVE_THEME_DRAFT',
        actor: 'Super Admin',
        target: activeTenant.name,
        details: `Saved theme draft for ${activeTenant.name}`,
        tenantId: selectedTenantId,
      });
      toast.success(`💾 Theme draft saved for ${activeTenant.name}!`);
    } catch (err) {
      toast.error(`Draft save failed: ${err.message}`);
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish Theme (Promotes to live themeConfig and increments version)
  const handlePublishTheme = async () => {
    const tenantPayload = {
      ...themeConfig,
      branding: {
        ...themeConfig.branding,
        collegeName: themeConfig.branding?.collegeName || activeTenant.name,
        shortName: themeConfig.branding?.shortName || activeTenant.code,
      }
    };

    const validation = validateThemeConfig(tenantPayload);
    if (!validation.valid) {
      toast.error(`Cannot publish: ${validation.errors.join(', ')}`);
      return;
    }

    setPublishing(true);
    try {
      const published = await publishTenantTheme(selectedTenantId, tenantPayload, 'Super Admin');
      setSavedPublishedTheme(published);
      setSavedDraftTheme(null);
      setThemeConfig(published);
      const data = await getTenantThemeConfig(selectedTenantId);
      setThemeHistory(data.themeHistory || []);
      reloadTenantTheme();
      toast.success(`🎉 Theme v${published.version} published live for ${activeTenant.name}!`);
    } catch (err) {
      toast.error(`Publish failed: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  // Rollback Theme to a Past Version
  const handleRollback = async (version) => {
    try {
      const restored = await rollbackTenantTheme(selectedTenantId, version, 'Super Admin');
      setSavedPublishedTheme(restored);
      setSavedDraftTheme(null);
      setThemeConfig(restored);
      const data = await getTenantThemeConfig(selectedTenantId);
      setThemeHistory(data.themeHistory || []);
      setShowHistoryModal(false);
      reloadTenantTheme();
      toast.success(`⏪ Restored Theme v${version} for ${activeTenant.name}!`);
    } catch (err) {
      toast.error(`Rollback failed: ${err.message}`);
    }
  };

  // Reset Default
  const handleReset = () => {
    const defaultTheme = createTenantDefaultTheme(activeTenant);
    updateThemeConfig({
      ...defaultTheme,
      branding: {
        ...defaultTheme.branding,
        collegeName: activeTenant.name,
        shortName: activeTenant.code,
      }
    });
    toast.success(`Reset draft tokens to ${activeTenant.name} defaults. Click Publish to apply live.`);
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1600, margin: '0 auto' }}>
      
      {/* 1. TOP HEADER & ACTION BAR */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 22px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Title & Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            backgroundColor: 'var(--color-primary-light, #EFF6FF)',
            color: 'var(--color-primary, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: 800
          }}>
            <Palette size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Enterprise Theme Studio
              </h1>
              {savedDraftTheme && (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  Draft Active
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="badge badge-danger" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  Unsaved Changes
                </span>
              )}
              {savedPublishedTheme && (
                <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                  Live v{savedPublishedTheme.version || 1}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
              Selected Campus: <strong style={{ color: '#0F172A' }}>{activeTenant.name} ({activeTenant.code})</strong>
            </p>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          {/* Institution Selector */}
          <div className="flex items-center gap-2" style={{ backgroundColor: '#F8FAFC', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Institution:</span>
            <select
              className="form-select"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.82rem', fontWeight: 600, minWidth: 200, border: 'none', background: 'transparent' }}
            >
              {tenantsList.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo change"
            >
              <Undo size={15} />
            </button>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo change"
            >
              <Redo size={15} />
            </button>
          </div>

          {/* Version History Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowHistoryModal(true)}
            title="Theme Version History"
            style={{ fontWeight: 600 }}
          >
            <History size={14} /> History ({themeHistory.length})
          </button>

          {/* Reset Default */}
          <button className="btn btn-secondary btn-sm" onClick={handleReset} style={{ fontWeight: 600 }}>
            <RotateCcw size={14} /> Reset
          </button>

          {/* Save Draft */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSaveDraft}
            disabled={savingDraft || publishing}
            style={{ fontWeight: 600 }}
          >
            <Save size={14} /> {savingDraft ? 'Saving Draft...' : 'Save Draft'}
          </button>

          {/* Publish Theme */}
          <button
            className="btn btn-primary btn-sm"
            onClick={handlePublishTheme}
            disabled={publishing || savingDraft}
            style={{ fontWeight: 800, padding: '7px 16px' }}
          >
            <Send size={14} /> {publishing ? 'Publishing...' : 'Publish Theme'}
          </button>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT EDITOR PANEL (380px) & RIGHT PREVIEW CANVAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 390px) 1fr', gap: 18, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: TOKEN CONTROLS PANEL */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 18,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          maxHeight: 'calc(100vh - 180px)',
          overflowY: 'auto'
        }}>
          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 18, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
            {[
              { id: 'presets', label: 'Presets' },
              { id: 'colors', label: 'Colors' },
              { id: 'surfaces', label: 'Surfaces' },
              { id: 'typography', label: 'Font' },
              { id: 'shapes', label: 'Shapes' },
              { id: 'branding', label: 'Branding' },
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn btn-xs ${controlTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setControlTab(tab.id)}
                style={{ borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, padding: '5px 9px' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 1. PRESETS TAB */}
          {controlTab === 'presets' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 12, color: '#0F172A' }}>
                Curated Academic Presets
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {THEME_PRESETS.map(p => {
                  const isSelected = themeConfig.preset === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleApplyPreset(p)}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                        backgroundColor: isSelected ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}>{p.name}</span>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: p.primary }} />
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: p.secondary }} />
                          <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: p.accent }} />
                        </div>
                      </div>
                      <p style={{ fontSize: '0.73rem', color: '#64748B', margin: 0 }}>
                        {p.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. BRAND COLORS TAB */}
          {controlTab === 'colors' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 14, color: '#0F172A' }}>
                Brand Design Tokens
              </div>

              {[
                { key: 'primary', label: 'Primary Brand Color', desc: 'Main navigation, CTA buttons, active tabs' },
                { key: 'primaryHover', label: 'Primary Hover State', desc: 'Hover state for primary buttons & links' },
                { key: 'secondary', label: 'Secondary Color', desc: 'Secondary badges, tags, and progress highlights' },
                { key: 'accent', label: 'Accent Highlight', desc: 'Special features, spotlight icons, chart highlights' },
                { key: 'success', label: 'Success Color', desc: 'Present attendance, fee paid, positive status' },
                { key: 'warning', label: 'Warning Color', desc: 'Late marks, pending approvals, notifications' },
                { key: 'danger', label: 'Danger Color', desc: 'Absent marks, fee overdue, deletion alerts' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{item.label}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748B' }}>{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.colors[item.key] || '#2563EB'}
                        onChange={(e) => handleColorChange(item.key, e.target.value)}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #CBD5E1', cursor: 'pointer', padding: 0 }}
                      />
                      <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, color: '#334155', minWidth: 62 }}>
                        {themeConfig.colors[item.key]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. SURFACES TAB */}
          {controlTab === 'surfaces' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 14, color: '#0F172A' }}>
                Surface & Background Tokens
              </div>

              {[
                { key: 'background', label: 'App Background', default: '#F8FAFC' },
                { key: 'surface', label: 'Card Surface', default: '#FFFFFF' },
                { key: 'surfaceSecondary', label: 'Secondary Surface', default: '#F1F5F9' },
                { key: 'sidebar', label: 'Sidebar Background', default: '#FFFFFF' },
                { key: 'header', label: 'Header Background', default: '#FFFFFF' },
                { key: 'textPrimary', label: 'Primary Text', default: '#0F172A' },
                { key: 'textSecondary', label: 'Secondary Text', default: '#475569' },
                { key: 'border', label: 'Default Border', default: '#E2E8F0' },
              ].map(item => (
                <div key={item.key} style={{ marginBottom: 12 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>{item.label}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.colors[item.key] || item.default}
                        onChange={(e) => handleColorChange(item.key, e.target.value)}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid #CBD5E1', cursor: 'pointer', padding: 0 }}
                      />
                      <span style={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700, color: '#334155', minWidth: 62 }}>
                        {themeConfig.colors[item.key] || item.default}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 4. TYPOGRAPHY TAB */}
          {controlTab === 'typography' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 14, color: '#0F172A' }}>
                Typography System
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Font Family</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {FONTS.map(f => (
                    <div
                      key={f}
                      onClick={() => updateThemeConfig({
                        ...themeConfig,
                        typography: { ...themeConfig.typography, fontFamily: `'${f}', system-ui, sans-serif` }
                      })}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: themeConfig.typography?.fontFamily?.includes(f) ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                        backgroundColor: themeConfig.typography?.fontFamily?.includes(f) ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF',
                        fontFamily: f
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>Aa Bb Gg 123</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. SHAPES & DENSITY TAB */}
          {controlTab === 'shapes' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 14, color: '#0F172A' }}>
                Shapes & Layout Geometry
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Border Radius</label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)' }}>{themeConfig.shape?.borderRadius || 10}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={themeConfig.shape?.borderRadius || 10}
                  onChange={(e) => updateThemeConfig({
                    ...themeConfig,
                    shape: { ...themeConfig.shape, borderRadius: Number(e.target.value) }
                  })}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Layout Density</label>
                <div className="grid-3" style={{ gap: 6 }}>
                  {['compact', 'comfortable', 'spacious'].map(d => (
                    <button
                      key={d}
                      className={`btn btn-xs ${themeConfig.density === d ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => updateThemeConfig({ ...themeConfig, density: d })}
                      style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6. BRANDING INFO TAB */}
          {controlTab === 'branding' && (
            <div className="animate-fadeIn">
              <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: 14, color: '#0F172A' }}>
                Institutional Brand Information
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>College Display Name</label>
                <input
                  className="form-input"
                  value={themeConfig.branding?.collegeName || activeTenant.name}
                  onChange={(e) => updateThemeConfig({
                    ...themeConfig,
                    branding: { ...themeConfig.branding, collegeName: e.target.value }
                  })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Short Acronym / Code</label>
                <input
                  className="form-input"
                  value={themeConfig.branding?.shortName || activeTenant.code}
                  onChange={(e) => updateThemeConfig({
                    ...themeConfig,
                    branding: { ...themeConfig.branding, shortName: e.target.value }
                  })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700 }}>Institutional Tagline</label>
                <input
                  className="form-input"
                  value={themeConfig.branding?.tagline || ''}
                  placeholder="e.g. Empowering Next-Gen Leaders"
                  onChange={(e) => updateThemeConfig({
                    ...themeConfig,
                    branding: { ...themeConfig.branding, tagline: e.target.value }
                  })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL-TIME APPLICATION PREVIEW FRAME */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: 18,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          overflow: 'hidden'
        }}>
          {/* Top Preview Controls Bar */}
          <div className="flex justify-between items-center" style={{ marginBottom: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            {/* Preview Surface Tabs */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {[
                { id: 'admin', label: 'Admin Dashboard' },
                { id: 'login', label: 'College Login' },
                { id: 'student', label: 'Student Portal' },
                { id: 'teacher', label: 'Teacher Workspace' },
                { id: 'parent', label: 'Parent Portal' },
                { id: 'website', label: 'College Website' },
              ].map(pt => (
                <button
                  key={pt.id}
                  className={`btn btn-xs ${previewTab === pt.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPreviewTab(pt.id)}
                  style={{ borderRadius: 6, fontWeight: 700, fontSize: '0.78rem' }}
                >
                  {pt.label}
                </button>
              ))}
            </div>

            {/* Device Switcher */}
            <div style={{ display: 'flex', gap: 4, backgroundColor: '#F1F5F9', padding: 3, borderRadius: 8 }}>
              <button
                className={`btn btn-xs ${deviceMode === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('desktop')}
                title="Desktop 100%"
                style={{ padding: '4px 8px' }}
              >
                <Monitor size={14} />
              </button>
              <button
                className={`btn btn-xs ${deviceMode === 'tablet' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('tablet')}
                title="Tablet 768px"
                style={{ padding: '4px 8px' }}
              >
                <Tablet size={14} />
              </button>
              <button
                className={`btn btn-xs ${deviceMode === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('mobile')}
                title="Mobile 375px"
                style={{ padding: '4px 8px' }}
              >
                <Smartphone size={14} />
              </button>
            </div>
          </div>

          {/* Scaled Preview Frame */}
          <div style={{
            display: 'flex', justifyContent: 'center', backgroundColor: '#F8FAFC',
            padding: 16, borderRadius: 12, minHeight: 600, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto',
            border: '1px solid #E2E8F0'
          }}>
            <div
              id="theme-preview-workspace"
              style={{
                width: deviceMode === 'mobile' ? 375 : deviceMode === 'tablet' ? 768 : '100%',
                maxWidth: '100%',
                backgroundColor: themeConfig.colors?.background || '#F8FAFC',
                borderRadius: deviceMode === 'desktop' ? 8 : 16,
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'width 0.25s ease',
                ...previewCssVariables,
                fontFamily: previewCssVariables['--font-family'],
              }}
            >

              {/* 1. ADMIN DASHBOARD PREVIEW */}
              {previewTab === 'admin' && (
                <div style={{ padding: 20, backgroundColor: themeConfig.colors.background || '#F8FAFC' }}>
                  {/* Mock Navbar */}
                  <div style={{
                    padding: '10px 16px', backgroundColor: themeConfig.colors.header || '#FFFFFF',
                    borderRadius: themeConfig.shape?.borderRadius || 10, border: `1px solid ${themeConfig.colors.border || '#E2E8F0'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 6, backgroundColor: themeConfig.colors.primaryLight,
                        color: themeConfig.colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
                      }}>🎓</div>
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: themeConfig.colors.textPrimary }}>
                        {themeConfig.branding?.collegeName || activeTenant.name}
                      </span>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, backgroundColor: themeConfig.colors.primaryLight,
                      color: themeConfig.colors.primary, fontSize: '0.72rem', fontWeight: 800
                    }}>
                      🏫 Branch Admin Dashboard
                    </span>
                  </div>

                  {/* 4 StatCards */}
                  <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.7rem', color: themeConfig.colors.textSecondary, fontWeight: 700 }}>STUDENTS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: themeConfig.colors.primary, marginTop: 4 }}>2,850</div>
                    </div>
                    <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.7rem', color: themeConfig.colors.textSecondary, fontWeight: 700 }}>ATTENDANCE</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: themeConfig.colors.success, marginTop: 4 }}>96.4%</div>
                    </div>
                    <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.7rem', color: themeConfig.colors.textSecondary, fontWeight: 700 }}>FEES COLLECTED</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: themeConfig.colors.secondary, marginTop: 4 }}>₹48.2L</div>
                    </div>
                    <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.7rem', color: themeConfig.colors.textSecondary, fontWeight: 700 }}>FACULTY SCHOLARS</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: themeConfig.colors.accent, marginTop: 4 }}>185</div>
                    </div>
                  </div>

                  {/* Chart and Activity */}
                  <div className="grid-2-1" style={{ gap: 14 }}>
                    <div className="card" style={{ padding: 16, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 12, color: themeConfig.colors.textPrimary }}>
                        📈 Academic Enrollment Growth
                      </div>
                      <div style={{ height: 180 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={STUDENTS_CHART_DATA}>
                            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="students" stroke={themeConfig.colors.primary} fill={themeConfig.colors.primaryLight} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="card" style={{ padding: 16, borderRadius: themeConfig.shape?.borderRadius || 10 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, marginBottom: 12, color: themeConfig.colors.textPrimary }}>
                        📊 Today's Attendance Ratio
                      </div>
                      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={ATTENDANCE_PIE_DATA} innerRadius={35} outerRadius={55} dataKey="value">
                              {ATTENDANCE_PIE_DATA.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? themeConfig.colors.success : index === 1 ? themeConfig.colors.warning : themeConfig.colors.danger} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. LOGIN SCREEN PREVIEW */}
              {previewTab === 'login' && (
                <div style={{ padding: '36px 20px', backgroundColor: themeConfig.colors.background || '#F8FAFC', minHeight: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="card" style={{ maxWidth: 380, width: '100%', padding: 28, borderRadius: themeConfig.shape?.borderRadius || 14, textAlign: 'center' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, backgroundColor: themeConfig.colors.primaryLight,
                      color: themeConfig.colors.primary, margin: '0 auto 12px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900
                    }}>🎓</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: themeConfig.colors.textPrimary, margin: 0 }}>
                      {themeConfig.branding?.collegeName || activeTenant.name}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: themeConfig.colors.textSecondary, margin: '4px 0 20px' }}>
                      Sign in to your institutional cloud portal
                    </p>

                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                      <input className="form-input" placeholder="Official Email (student@college.edu)" disabled value={`admin@${activeTenant.code?.toLowerCase() || 'college'}.edu`} />
                      <input className="form-input" type="password" placeholder="Password" disabled value="••••••••" />
                    </div>

                    <button
                      className="btn w-full"
                      style={{
                        backgroundColor: themeConfig.colors.primary, color: '#FFFFFF',
                        fontWeight: 800, padding: 10, borderRadius: themeConfig.shape?.buttonRadius || 8, justifyContent: 'center'
                      }}
                    >
                      Sign In to Workspace →
                    </button>
                  </div>
                </div>
              )}

              {/* 3. STUDENT PORTAL PREVIEW */}
              {previewTab === 'student' && (
                <div style={{ padding: 20, backgroundColor: themeConfig.colors.background || '#F8FAFC' }}>
                  <div style={{
                    padding: 16, borderRadius: themeConfig.shape?.borderRadius || 12, background: `linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent})`,
                    color: '#FFFFFF', marginBottom: 16
                  }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>Good Morning, Scholar! 🌟</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Class 12-A · Semester GPA: 3.89 · {themeConfig.branding?.collegeName || activeTenant.name}</div>
                  </div>

                  <div className="grid-3" style={{ gap: 10, marginBottom: 16 }}>
                    <div className="card" style={{ padding: 12, borderRadius: themeConfig.shape?.borderRadius || 8 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ATTENDANCE</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: themeConfig.colors.success }}>94.2%</div>
                    </div>
                    <div className="card" style={{ padding: 12, borderRadius: themeConfig.shape?.borderRadius || 8 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PENDING HW</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: themeConfig.colors.warning }}>2 Due</div>
                    </div>
                    <div className="card" style={{ padding: 12, borderRadius: themeConfig.shape?.borderRadius || 8 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>FEE DUES</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: themeConfig.colors.primary }}>₹0 (Clear)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. TEACHER WORKSPACE PREVIEW */}
              {previewTab === 'teacher' && (
                <div style={{ padding: 20, backgroundColor: themeConfig.colors.background || '#F8FAFC' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: themeConfig.colors.textPrimary }}>👩‍🏫 Faculty Workspace</div>
                      <div style={{ fontSize: '0.75rem', color: themeConfig.colors.textSecondary }}>Active Campus: {themeConfig.branding?.collegeName || activeTenant.name}</div>
                    </div>
                    <button className="btn btn-xs" style={{ backgroundColor: themeConfig.colors.primary, color: '#FFFFFF', fontWeight: 700, borderRadius: themeConfig.shape?.buttonRadius || 6 }}>
                      Take Attendance
                    </button>
                  </div>
                  <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 8 }}>Today's Scheduled Lectures</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>09:00 AM — Mathematics (Ex 4.2 Quadratic Equations) · Room 201</div>
                  </div>
                </div>
              )}

              {/* 5. PARENT PORTAL PREVIEW */}
              {previewTab === 'parent' && (
                <div style={{ padding: 20, backgroundColor: themeConfig.colors.background || '#F8FAFC' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 900, color: themeConfig.colors.textPrimary }}>👨‍👩‍👧 Parent Dashboard</div>
                      <div style={{ fontSize: '0.75rem', color: themeConfig.colors.textSecondary }}>Student Portal: {themeConfig.branding?.collegeName || activeTenant.name}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 12, backgroundColor: themeConfig.colors.primaryLight, color: themeConfig.colors.primary, fontSize: '0.72rem', fontWeight: 800 }}>
                      Sibling Switcher Active
                    </span>
                  </div>
                  <div className="card" style={{ padding: 14, borderRadius: themeConfig.shape?.borderRadius || 8 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: 6 }}>Fee Payment Status</div>
                    <div style={{ fontSize: '0.75rem', color: themeConfig.colors.success, fontWeight: 700 }}>🟢 All dues clear for Q3 2026</div>
                  </div>
                </div>
              )}

              {/* 6. COLLEGE WEBSITE EMBEDDED PREVIEW */}
              {previewTab === 'website' && (
                <div style={{ height: 600, overflowY: 'auto' }}>
                  <CollegeLandingPage
                    isEmbedded={true}
                    previewConfig={{
                      ...DEFAULT_WEBSITE_CONFIG,
                      slug: activeTenant.slug || activeTenant.code?.toLowerCase() || 'college',
                      seo: {
                        ...DEFAULT_WEBSITE_CONFIG.seo,
                        title: `${themeConfig.branding?.collegeName || activeTenant.name} — Campus Portal`,
                      },
                      hero: {
                        ...DEFAULT_WEBSITE_CONFIG.hero,
                        headline: `Empowering Next-Gen Leaders at ${themeConfig.branding?.collegeName || activeTenant.name}`,
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. VERSION HISTORY MODAL */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div className="card" style={{ maxWidth: 540, width: '100%', padding: 24, borderRadius: 16, backgroundColor: '#FFFFFF', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 16, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  📜 Theme Version History
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0' }}>
                  {activeTenant.name} ({activeTenant.code})
                </p>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowHistoryModal(false)}>✕</button>
            </div>

            {themeHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: '0.85rem' }}>
                No past theme versions published yet for this institution.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {themeHistory.map((h, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      padding: 14, borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A' }}>Version v{h.version}</span>
                        {savedPublishedTheme?.version === h.version && (
                          <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Current Live</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 2 }}>
                        Published {new Date(h.publishedAt).toLocaleString()} by {h.publishedBy || 'Admin'}
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: h.themeConfig?.colors?.primary || '#2563EB' }} />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: h.themeConfig?.colors?.secondary || '#0F766E' }} />
                        <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: h.themeConfig?.colors?.accent || '#7C3AED' }} />
                      </div>
                    </div>

                    {savedPublishedTheme?.version !== h.version && (
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleRollback(h.version)}
                        style={{ fontWeight: 700 }}
                      >
                        <Undo size={12} /> Rollback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeStudio;
