// src/pages/superadmin/CreateCollege.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building, ShieldCheck, CreditCard, ArrowRight, ArrowLeft, Check, Sparkles,
  Eye, EyeOff, Palette, Globe, Layers, UserCheck, Shield, CheckCircle2,
  Monitor, Tablet, Smartphone, Star, Send
} from 'lucide-react';
import { provisionNewCollegeTenant, provisionNewBranch } from '../../services/tenantService';
import { THEME_PRESETS, DEFAULT_THEME } from '../../components/theme/themeUtils';
import { WEBSITE_TEMPLATES, DEFAULT_WEBSITE_CONFIG } from '../../services/websiteService';
import CollegeLandingPage from '../public/CollegeLandingPage';
import toast from 'react-hot-toast';

const WIZARD_STEPS = [
  { id: 1, title: 'Basic Info', desc: 'Campus identity & address' },
  { id: 2, title: 'Branding', desc: 'Theme, colors & fonts' },
  { id: 3, title: 'Website', desc: 'Landing page & template' },
  { id: 4, title: 'Modules', desc: 'Enabled ERP features' },
  { id: 5, title: 'Admin Account', desc: 'Branch admin login' },
  { id: 6, title: 'Subscription', desc: 'Plan tier & quotas' },
  { id: 7, title: 'Live Preview', desc: 'Pre-flight experience test' },
  { id: 8, title: 'Confirm', desc: 'Atomic deployment' },
];

const AVAILABLE_MODULES = [
  { id: 'students', label: 'Student Information System (SIS)', desc: 'Admissions, profiles, documents, ID cards', default: true },
  { id: 'attendance', label: 'Smart Attendance', desc: 'Daily attendance, biometric, RFID integration', default: true },
  { id: 'fees', label: 'Fees & Finance Ledger', desc: 'Fee structures, Razorpay checkout, receipts', default: true },
  { id: 'exams', label: 'Exams & Report Cards', desc: 'Gradebooks, lock results, CBSE templates', default: true },
  { id: 'homework', label: 'Digital Homework & LMS', desc: 'Assignments, submissions, lesson diary', default: true },
  { id: 'transport', label: 'Transport & GPS Fleet', desc: 'Bus routes, vehicle tracking, driver allocation', default: true },
  { id: 'library', label: 'Central Library Management', desc: 'Book catalog, barcodes, issue/returns', default: true },
  { id: 'hostel', label: 'Hostel & Mess Allocation', desc: 'Rooms, beds, warden duty, meal plans', default: false },
  { id: 'hr_payroll', label: 'HR & Faculty Payroll', desc: 'Staff directory, salary slips, biometric sync', default: true },
  { id: 'communication', label: 'SMS & Notice Broadcaster', desc: 'WhatsApp, SMS gateways, circulars', default: true },
  { id: 'admissions_crm', label: 'Admissions CRM Pipeline', desc: 'Lead tracking, enquiry follow-ups', default: true },
];

const CreateCollege = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSubAdmin = location.pathname.startsWith('/subadmin');

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState('website'); // website | login | admin | student

  // Comprehensive Form State across all wizard steps
  const [formData, setFormData] = useState({
    // Step 1: Basic
    collegeName: '',
    collegeCode: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    city: 'Noida',
    state: 'Uttar Pradesh',
    institutionType: 'K-12 School & Senior Secondary',

    // Step 2: Branding & Theme
    themePreset: 'royal-blue',
    primaryColor: '#2563EB',
    secondaryColor: '#0F766E',
    fontFamily: 'Inter',
    tagline: 'Empowering Next-Gen Leaders',

    // Step 3: Website Content
    websiteTemplate: 'modern-campus',
    heroHeadline: 'Empowering Next-Gen Leaders Through Academic Excellence',
    heroSubheadline: 'World-class education, advanced STEM laboratories, distinguished faculty, and holistic leadership.',
    primaryCtaText: 'Apply for Admission',
    principalName: 'Dr. Anandita Sen',
    principalDesignation: 'Principal & Director',

    // Step 4: Modules
    enabledModules: AVAILABLE_MODULES.filter(m => m.default).map(m => m.id),

    // Step 5: Admin Account
    adminName: '',
    adminEmail: '',
    adminPassword: '',

    // Step 6: Subscription
    planTier: 'Standard',
    maxStudents: 2000,
    maxStorageGb: 50,
  });

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      themePreset: preset.id,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  const toggleModule = (modId) => {
    setFormData(prev => {
      const exists = prev.enabledModules.includes(modId);
      return {
        ...prev,
        enabledModules: exists
          ? prev.enabledModules.filter(m => m !== modId)
          : [...prev.enabledModules, modId]
      };
    });
  };

  // Construct dynamic website preview config
  const dynamicWebsiteConfig = {
    ...DEFAULT_WEBSITE_CONFIG,
    template: formData.websiteTemplate,
    slug: formData.slug || formData.collegeCode?.toLowerCase() || 'college',
    seo: {
      title: `${formData.collegeName || 'Institution'} — Admissions Open 2026-27`,
      description: formData.heroSubheadline,
      keywords: 'school, college, admissions, education',
    },
    hero: {
      ...DEFAULT_WEBSITE_CONFIG.hero,
      headline: formData.heroHeadline,
      subheadline: formData.heroSubheadline,
      primaryCtaText: formData.primaryCtaText,
    },
    principal: {
      ...DEFAULT_WEBSITE_CONFIG.principal,
      name: formData.principalName,
      designation: formData.principalDesignation,
    },
    contact: {
      ...DEFAULT_WEBSITE_CONFIG.contact,
      email: formData.email,
      phone: formData.phone,
      address: `${formData.address}, ${formData.city}, ${formData.state}`,
    },
  };

  const handleFinalSubmit = async () => {
    if (!formData.collegeName || !formData.collegeCode || !formData.adminEmail) {
      toast.error('Please complete required fields (College Name, Code, Admin Email).');
      return;
    }

    setSubmitting(true);
    try {
      if (isSubAdmin) {
        const branch = await provisionNewBranch({
          collegeName: formData.collegeName,
          collegeCode: formData.collegeCode,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        });
        toast.success(`🎉 New Branch Provisioned: ${branch.name}!`);
        navigate('/subadmin/branches');
      } else {
        const payload = {
          ...formData,
          themeConfig: {
            preset: formData.themePreset,
            colors: {
              ...DEFAULT_THEME.colors,
              primary: formData.primaryColor,
              secondary: formData.secondaryColor,
            },
            typography: { fontFamily: formData.fontFamily },
            branding: {
              collegeName: formData.collegeName,
              shortName: formData.collegeCode,
              tagline: formData.tagline,
            }
          },
          websiteConfig: dynamicWebsiteConfig,
        };

        const result = await provisionNewCollegeTenant(payload);
        toast.success(`🎉 Institution Provisioned! Tenant ID: ${result.tenantId}`);
        navigate('/superadmin/colleges');
      }
    } catch (err) {
      toast.error(`Provisioning failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate(isSubAdmin ? '/subadmin/branches' : '/superadmin/colleges')}>
            <ArrowLeft size={16} /> {isSubAdmin ? 'Back to SubAdmin Branches' : 'Back to Institutions'}
          </button>
          <h1 className="page-title">{isSubAdmin ? 'Provision New Campus Branch' : 'Onboard New Educational Institution'}</h1>
          <p className="page-subtitle">Production-grade multi-step onboarding with custom branding, website, and live pre-flight preview</p>
        </div>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="card" style={{ padding: '14px 20px', borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflowX: 'auto', gap: 12 }}>
          {WIZARD_STEPS.map(st => {
            const isActive = currentStep === st.id;
            const isCompleted = currentStep > st.id;
            return (
              <div
                key={st.id}
                onClick={() => setCurrentStep(st.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  opacity: isActive ? 1 : isCompleted ? 0.85 : 0.5,
                  minWidth: 105
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  backgroundColor: isActive ? 'var(--color-primary, #2563EB)' : isCompleted ? '#16A34A' : '#E2E8F0',
                  color: isActive || isCompleted ? '#FFFFFF' : '#64748B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 800
                }}>
                  {isCompleted ? <Check size={14} /> : st.id}
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isActive ? 'var(--color-primary, #2563EB)' : '#0F172A', whiteSpace: 'nowrap' }}>
                    {st.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP CONTAINER CARD */}
      <div className="card" style={{ padding: 'clamp(20px, 4vw, 36px)', borderRadius: 16 }}>
        {/* STEP 1: BASIC INFORMATION */}
        {currentStep === 1 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <Building size={22} /> Step 1: Institution Metadata & Campus Details
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Institution Full Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Oxford Global University / Sunrise Academy"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({
                    ...formData,
                    collegeName: e.target.value,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institution Acronym / Code (2-6 letters) *</label>
                <input
                  className="form-input"
                  style={{ textTransform: 'uppercase' }}
                  placeholder="e.g. OGC"
                  maxLength={6}
                  value={formData.collegeCode}
                  onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Public Website Slug URL</label>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '0.8rem', color: '#64748B' }}>/college/</span>
                  <input
                    className="form-input flex-1"
                    placeholder="oxford-global"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Institution Type</label>
                <select
                  className="form-select"
                  value={formData.institutionType}
                  onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                >
                  <option value="K-12 School & Senior Secondary">K-12 School & Senior Secondary</option>
                  <option value="Degree College & Higher Education">Degree College & Higher Education</option>
                  <option value="University Campus Branch">University Campus Branch</option>
                  <option value="Polytechnic & STEM Institute">Polytechnic & STEM Institute</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Official Admissions Email *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="contact@oxfordglobal.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Phone Number *</label>
                <input
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Campus Physical Address *</label>
                <input
                  className="form-input"
                  placeholder="Plot 20, Institutional Area, Sector 62"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">City *</label>
                <input
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">State *</label>
                <input
                  className="form-input"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BRANDING & THEME */}
        {currentStep === 2 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <Palette size={22} /> Step 2: Visual Identity & Design Tokens
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Select Theme Preset</label>
              <div className="grid-4" style={{ gap: 12 }}>
                {THEME_PRESETS.map(p => (
                  <div
                    key={p.id}
                    className="card"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      padding: 12, cursor: 'pointer',
                      border: formData.themePreset === p.id ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                      backgroundColor: formData.themePreset === p.id ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF'
                    }}
                  >
                    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{p.name.split('(')[0]}</span>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.primary }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    style={{ width: 44, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    className="form-input flex-1"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    style={{ width: 44, height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    className="form-input flex-1"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Font Family</label>
                <select
                  className="form-select"
                  value={formData.fontFamily}
                  onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                >
                  <option value="Inter">Inter (Clean Modern Sans)</option>
                  <option value="Poppins">Poppins (Friendly Rounded)</option>
                  <option value="Outfit">Outfit (Tech & Bold)</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans (Corporate)</option>
                  <option value="Roboto">Roboto (Google Classic)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Tagline</label>
                <input
                  className="form-input"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WEBSITE CONTENT */}
        {currentStep === 3 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <Globe size={22} /> Step 3: Public Website Template & Copy
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Select Public Website Template</label>
              <div className="grid-3" style={{ gap: 12 }}>
                {WEBSITE_TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="card"
                    onClick={() => setFormData({ ...formData, websiteTemplate: tmpl.id })}
                    style={{
                      padding: 14, cursor: 'pointer',
                      border: formData.websiteTemplate === tmpl.id ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                      backgroundColor: formData.websiteTemplate === tmpl.id ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>{tmpl.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{tmpl.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Hero Headline</label>
                <input
                  className="form-input"
                  value={formData.heroHeadline}
                  onChange={(e) => setFormData({ ...formData, heroHeadline: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Hero Subheadline</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.heroSubheadline}
                  onChange={(e) => setFormData({ ...formData, heroSubheadline: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Principal / Academic Director Name</label>
                <input
                  className="form-input"
                  value={formData.principalName}
                  onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Principal Designation</label>
                <input
                  className="form-input"
                  value={formData.principalDesignation}
                  onChange={(e) => setFormData({ ...formData, principalDesignation: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MODULES SELECTION */}
        {currentStep === 4 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <Layers size={22} /> Step 4: Active ERP Operational Modules
            </div>

            <div className="grid-2" style={{ gap: 14 }}>
              {AVAILABLE_MODULES.map(mod => {
                const isEnabled = formData.enabledModules.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    className="card"
                    onClick={() => toggleModule(mod.id)}
                    style={{
                      padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                      border: isEnabled ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                      backgroundColor: isEnabled ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF'
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      backgroundColor: isEnabled ? 'var(--color-primary, #2563EB)' : '#E2E8F0',
                      color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isEnabled && <Check size={14} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{mod.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{mod.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: ADMIN ACCOUNT */}
        {currentStep === 5 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <UserCheck size={22} /> Step 5: Campus Branch Administrator Credentials
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Administrator Full Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Admin Email Address *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="admin@oxfordglobal.edu"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Temporary Initial Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Leave empty for auto-generated temporary password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>
                  Default if empty: <code>EduERP@2026</code> (Admin will be prompted to reset upon first login)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SUBSCRIPTION PLAN */}
        {currentStep === 6 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)', marginBottom: 20 }}>
              <CreditCard size={22} /> Step 6: Select SaaS Subscription Tier
            </div>

            <div className="grid-4" style={{ gap: 14 }}>
              {[
                { tier: 'Basic', price: '₹12,000/yr', limit: 500, desc: 'Up to 500 students, Core Modules' },
                { tier: 'Standard', price: '₹24,000/yr', limit: 2000, desc: 'Up to 2,000 students, Full Suite' },
                { tier: 'Premium', price: '₹48,000/yr', limit: 5000, desc: 'Up to 5,000 students, Theme Studio' },
                { tier: 'Enterprise', price: '₹1,20,000/yr', limit: 15000, desc: 'Unlimited, Multi-Branch' },
              ].map(p => (
                <div
                  key={p.tier}
                  className="card"
                  onClick={() => setFormData({ ...formData, planTier: p.tier, maxStudents: p.limit })}
                  style={{
                    padding: 16, cursor: 'pointer',
                    border: formData.planTier === p.tier ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                    backgroundColor: formData.planTier === p.tier ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF'
                  }}
                >
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A', marginBottom: 2 }}>{p.tier}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', marginBottom: 6 }}>{p.price}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 7: LIVE INTERACTIVE PREVIEW */}
        {currentStep === 7 && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
              <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary, #2563EB)' }}>
                <Eye size={22} /> Step 7: Live Experience Pre-Flight Preview
              </div>

              {/* Sub tabs */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'website', label: '🌐 Public Website' },
                  { id: 'login', label: '🔐 Login' },
                  { id: 'admin', label: '🏫 Admin Dashboard' },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn btn-xs ${previewSubTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setPreviewSubTab(t.id)}
                    style={{ borderRadius: 6, fontWeight: 700 }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden',
              backgroundColor: '#FFFFFF', maxHeight: 550, overflowY: 'auto'
            }}>
              {previewSubTab === 'website' && (
                <CollegeLandingPage previewConfig={dynamicWebsiteConfig} isEmbedded={true} />
              )}

              {previewSubTab === 'login' && (
                <div style={{ padding: 48, backgroundColor: '#F8FAFC', textAlign: 'center', minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="card" style={{ maxWidth: 360, width: '100%', padding: 28, borderRadius: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, backgroundColor: formData.primaryColor,
                      color: '#FFFFFF', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900
                    }}>🎓</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>{formData.collegeName || 'New Institution'}</h3>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 16px' }}>{formData.tagline}</p>
                    <button className="btn w-full" style={{ backgroundColor: formData.primaryColor, color: '#FFFFFF', fontWeight: 800, borderRadius: 8, justifyContent: 'center' }}>
                      Sign In to Portal →
                    </button>
                  </div>
                </div>
              )}

              {previewSubTab === 'admin' && (
                <div style={{ padding: 24, backgroundColor: '#F8FAFC' }}>
                  <div className="grid-4" style={{ gap: 12, marginBottom: 16 }}>
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>STUDENT QUOTA</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: formData.primaryColor, marginTop: 4 }}>0 / {formData.maxStudents}</div>
                    </div>
                    <div className="card" style={{ padding: 14 }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>SUBSCRIPTION</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16A34A', marginTop: 4 }}>{formData.planTier} Active</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: CONFIRMATION & DEPLOYMENT */}
        {currentStep === 8 && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#16A34A', marginBottom: 20 }}>
              <CheckCircle2 size={22} /> Step 8: Review & Deploy Institution
            </div>

            <div className="card" style={{ padding: 24, backgroundColor: '#F8FAFC', borderRadius: 14, marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: 14, color: '#0F172A' }}>
                Onboarding Summary
              </h3>
              <div className="grid-2" style={{ gap: 12, fontSize: '0.85rem' }}>
                <div><strong>Institution Name:</strong> {formData.collegeName} ({formData.collegeCode})</div>
                <div><strong>Type:</strong> {formData.institutionType}</div>
                <div><strong>Website URL:</strong> <code>/college/{formData.slug || 'slug'}</code></div>
                <div><strong>Theme Preset:</strong> {formData.themePreset} ({formData.primaryColor})</div>
                <div><strong>Active Modules:</strong> {formData.enabledModules.length} Modules Enabled</div>
                <div><strong>Plan Tier:</strong> {formData.planTier} (Limit {formData.maxStudents} students)</div>
                <div><strong>Campus Admin:</strong> {formData.adminName} ({formData.adminEmail})</div>
                <div><strong>Location:</strong> {formData.city}, {formData.state}</div>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleFinalSubmit}
              disabled={submitting}
              style={{ padding: 16, fontSize: '1rem', fontWeight: 900, borderRadius: 12, justifyContent: 'center' }}
            >
              {submitting ? 'Provisioning Infrastructure & Deploying Website...' : '🚀 Finalize & Launch Institution'}
            </button>
          </div>
        )}

        {/* BOTTOM NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center" style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginTop: 24 }}>
          {currentStep > 1 ? (
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft size={16} /> Previous Step
            </button>
          ) : <div />}

          {currentStep < 8 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentStep(currentStep + 1)}
              style={{ fontWeight: 800 }}
            >
              Continue to {WIZARD_STEPS[currentStep].title} <ArrowRight size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CreateCollege;
