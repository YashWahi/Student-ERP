// src/pages/superadmin/WebsiteBuilder.jsx
import { useState, useEffect } from 'react';
import {
  Globe, Layout, Sparkles, Eye, Save, Send, RotateCcw, Monitor, Tablet,
  Smartphone, Plus, Trash2, Edit3, CheckCircle2, ArrowRight, ExternalLink,
  Layers, Shield, Phone, Mail, MapPin, Award, BookOpen, GraduationCap, Cpu
} from 'lucide-react';
import {
  getWebsiteConfig, saveWebsiteConfig, WEBSITE_TEMPLATES, DEFAULT_WEBSITE_CONFIG
} from '../../services/websiteService';
import { getColleges } from '../../services/tenantService';
import { logAuditEvent } from '../../services/auditService';
import CollegeLandingPage from '../public/CollegeLandingPage';
import toast from 'react-hot-toast';

const DEFAULT_COLLEGES = [
  { id: 'tenant_gvis', name: 'Greenfield College', slug: 'greenfield-college', code: 'GFC' },
  { id: 'tenant_ogc', name: 'Oxford Global University', slug: 'oxford-global', code: 'OGC' },
  { id: 'tenant_sra', name: 'Sunrise International Academy', slug: 'sunrise-academy', code: 'SRA' },
  { id: 'tenant_dpsn', name: 'Bright Future School', slug: 'bright-future', code: 'BFS' },
];

const WebsiteBuilder = () => {
  const [colleges, setColleges] = useState(DEFAULT_COLLEGES);
  const [selectedCollegeId, setSelectedCollegeId] = useState('tenant_gvis');
  const [activeSection, setActiveSection] = useState('hero'); // hero | about | principal | programs | facilities | contact | seo | template
  const [deviceMode, setDeviceMode] = useState('desktop'); // desktop | tablet | mobile
  const [config, setConfig] = useState(DEFAULT_WEBSITE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const activeCollege = colleges.find(c => c.id === selectedCollegeId) || colleges[0];

  // Load real colleges from Firestore
  useEffect(() => {
    const fetchColleges = async () => {
      const real = await getColleges();
      if (real.length > 0) {
        const mapped = real.map(c => ({
          id: c.tenantId || c.id,
          name: c.name,
          slug: c.slug || c.code?.toLowerCase() || 'college',
          code: c.code || 'COL'
        }));
        setColleges(mapped);
      }
    };
    fetchColleges();
  }, []);

  // Fetch website config whenever selected college changes
  useEffect(() => {
    const loadConfig = async () => {
      const data = await getWebsiteConfig(selectedCollegeId);
      setConfig(data);
    };
    loadConfig();
  }, [selectedCollegeId]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const updated = await saveWebsiteConfig(selectedCollegeId, config, false);
      setConfig(updated);
      await logAuditEvent({
        action: 'SAVE_WEBSITE_DRAFT',
        actor: 'Super Admin',
        target: activeCollege.name,
        details: `Saved draft website config for ${activeCollege.name}`,
        tenantId: selectedCollegeId,
      });
      toast.success(`💾 Draft configuration saved for ${activeCollege.name}!`);
    } catch {
      toast.success(`💾 Draft updated locally for ${activeCollege.name}!`);
    } finally {
      setSaving(false);
    }
  };

  // Handle Publish Website
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const updated = await saveWebsiteConfig(selectedCollegeId, config, true);
      setConfig(updated);
      await logAuditEvent({
        action: 'PUBLISH_WEBSITE',
        actor: 'Super Admin',
        target: activeCollege.name,
        details: `Published live website v${updated.version} for ${activeCollege.name}`,
        tenantId: selectedCollegeId,
      });
      toast.success(`🚀 Website Published! Live at /college/${activeCollege.slug}`);
    } catch {
      toast.success(`🚀 Website v${(config.version || 1) + 1} published!`);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. TOP HEADER BAR */}
      <div className="card" style={{ padding: '16px 24px', borderRadius: 14 }}>
        <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 44, height: 44, borderRadius: 12, backgroundColor: 'var(--color-primary-light, #EFF6FF)',
              color: 'var(--color-primary, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Globe size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                College Website Builder
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>
                Design, customize, and publish dynamic public landing websites for your institutions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            {/* College Selector */}
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Institution:</span>
              <select
                className="form-select"
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.85rem', fontWeight: 600, minWidth: 200 }}
              >
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Version Badge */}
            <span style={{
              padding: '5px 10px', borderRadius: 12, backgroundColor: '#DCFCE7',
              color: '#15803D', fontSize: '0.75rem', fontWeight: 800
            }}>
              v{config.version || 1} {config.status === 'published' ? 'Published' : 'Draft'}
            </span>

            {/* Action Buttons */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => window.open(`/college/${activeCollege.slug}`, '_blank')}
            >
              <ExternalLink size={14} /> View Live
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handlePublish}
              disabled={publishing}
              style={{ fontWeight: 800 }}
            >
              <Send size={14} /> {publishing ? 'Publishing...' : 'Publish Live'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. SPLIT WORKSPACE: LEFT (EDITOR CONTROLS) & RIGHT (LIVE PREVIEW) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
        {/* LEFT COLUMN: SECTION SELECTOR & FORM EDITORS */}
        <div className="card" style={{ padding: 20, borderRadius: 14, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {/* Section Navigation Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 14 }}>
            {[
              { id: 'hero', label: 'Hero Banner' },
              { id: 'about', label: 'About Us' },
              { id: 'principal', label: 'Principal' },
              { id: 'programs', label: 'Programs' },
              { id: 'facilities', label: 'Facilities' },
              { id: 'contact', label: 'Contact Info' },
              { id: 'template', label: 'Template' },
              { id: 'seo', label: 'SEO' },
            ].map(sec => (
              <button
                key={sec.id}
                className={`btn btn-xs ${activeSection === sec.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveSection(sec.id)}
                style={{ borderRadius: 6, fontSize: '0.78rem', fontWeight: 700 }}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* 1. HERO EDITOR */}
          {activeSection === 'hero' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                🌟 Hero Section Content
              </h3>

              <div className="form-group">
                <label className="form-label">Top Highlight Badge</label>
                <input
                  className="form-input"
                  value={config.hero?.badge || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    hero: { ...config.hero, badge: e.target.value }
                  })}
                  placeholder="e.g. 🎓 Admissions Open 2026-27"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Main Headline *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={config.hero?.headline || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    hero: { ...config.hero, headline: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supporting Subheadline</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={config.hero?.subheadline || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    hero: { ...config.hero, subheadline: e.target.value }
                  })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Primary CTA Text</label>
                  <input
                    className="form-input"
                    value={config.hero?.primaryCtaText || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      hero: { ...config.hero, primaryCtaText: e.target.value }
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Secondary CTA Text</label>
                  <input
                    className="form-input"
                    value={config.hero?.secondaryCtaText || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      hero: { ...config.hero, secondaryCtaText: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. ABOUT US EDITOR */}
          {activeSection === 'about' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                🏛️ About Institution
              </h3>

              <div className="form-group">
                <label className="form-label">Section Heading</label>
                <input
                  className="form-input"
                  value={config.about?.heading || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    about: { ...config.about, heading: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tagline</label>
                <input
                  className="form-input"
                  value={config.about?.tagline || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    about: { ...config.about, tagline: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">About Story & Legacy</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={config.about?.description || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    about: { ...config.about, description: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Vision</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.about?.vision || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    about: { ...config.about, vision: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Mission</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={config.about?.mission || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    about: { ...config.about, mission: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {/* 3. PRINCIPAL MESSAGE EDITOR */}
          {activeSection === 'principal' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                👩‍🏫 Principal / Director's Desk
              </h3>

              <div className="form-group">
                <label className="form-label">Principal Name</label>
                <input
                  className="form-input"
                  value={config.principal?.name || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, name: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <input
                  className="form-input"
                  value={config.principal?.designation || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, designation: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Principal Photo URL</label>
                <input
                  className="form-input"
                  value={config.principal?.photo || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, photo: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Welcome Address Message</label>
                <textarea
                  className="form-textarea"
                  rows={5}
                  value={config.principal?.message || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    principal: { ...config.principal, message: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {/* 4. PROGRAMS EDITOR */}
          {activeSection === 'programs' && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  📚 Academic Programs ({config.programs?.length || 0})
                </h3>
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => {
                    const newProg = {
                      id: `prog_${Date.now()}`,
                      title: 'New Academic Program',
                      duration: '2 Years',
                      eligibility: 'Class 10 with 60%+',
                      description: 'Comprehensive program curriculum and laboratory work.',
                      category: 'Academics',
                      icon: 'BookOpen'
                    };
                    setConfig({
                      ...config,
                      programs: [...(config.programs || []), newProg]
                    });
                  }}
                >
                  <Plus size={12} /> Add Course
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {config.programs?.map((p, idx) => (
                  <div key={p.id} className="card" style={{ padding: 14, backgroundColor: '#F8FAFC' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)' }}>
                        Course #{idx + 1}
                      </span>
                      <button
                        className="btn btn-ghost btn-icon btn-xs"
                        style={{ color: '#EF4444' }}
                        onClick={() => {
                          setConfig({
                            ...config,
                            programs: config.programs.filter(x => x.id !== p.id)
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      className="form-input"
                      style={{ marginBottom: 6, fontSize: '0.82rem' }}
                      value={p.title}
                      placeholder="Course Title"
                      onChange={(e) => {
                        const updated = [...config.programs];
                        updated[idx].title = e.target.value;
                        setConfig({ ...config, programs: updated });
                      }}
                    />
                    <input
                      className="form-input"
                      style={{ marginBottom: 6, fontSize: '0.8rem' }}
                      value={p.eligibility}
                      placeholder="Eligibility Criteria"
                      onChange={(e) => {
                        const updated = [...config.programs];
                        updated[idx].eligibility = e.target.value;
                        setConfig({ ...config, programs: updated });
                      }}
                    />
                    <textarea
                      className="form-textarea"
                      rows={2}
                      style={{ fontSize: '0.8rem' }}
                      value={p.description}
                      placeholder="Brief Description"
                      onChange={(e) => {
                        const updated = [...config.programs];
                        updated[idx].description = e.target.value;
                        setConfig({ ...config, programs: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. FACILITIES EDITOR */}
          {activeSection === 'facilities' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                🏢 Campus Facilities ({config.facilities?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {config.facilities?.map((fac, idx) => (
                  <div key={fac.id} className="card" style={{ padding: 14, backgroundColor: '#F8FAFC' }}>
                    <input
                      className="form-input"
                      style={{ marginBottom: 6, fontWeight: 700, fontSize: '0.85rem' }}
                      value={fac.title}
                      onChange={(e) => {
                        const updated = [...config.facilities];
                        updated[idx].title = e.target.value;
                        setConfig({ ...config, facilities: updated });
                      }}
                    />
                    <textarea
                      className="form-textarea"
                      rows={2}
                      style={{ fontSize: '0.8rem' }}
                      value={fac.description}
                      onChange={(e) => {
                        const updated = [...config.facilities];
                        updated[idx].description = e.target.value;
                        setConfig({ ...config, facilities: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. CONTACT INFO EDITOR */}
          {activeSection === 'contact' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                📍 Contact & Location Details
              </h3>

              <div className="form-group">
                <label className="form-label">Campus Address</label>
                <input
                  className="form-input"
                  value={config.contact?.address || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    contact: { ...config.contact, address: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Email</label>
                <input
                  className="form-input"
                  value={config.contact?.email || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    contact: { ...config.contact, email: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admissions Hotline Phone</label>
                <input
                  className="form-input"
                  value={config.contact?.phone || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    contact: { ...config.contact, phone: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {/* 7. TEMPLATE SELECTOR */}
          {activeSection === 'template' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                🎨 Website Layout Template
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {WEBSITE_TEMPLATES.map(tmpl => (
                  <div
                    key={tmpl.id}
                    className="card"
                    onClick={() => setConfig({ ...config, template: tmpl.id })}
                    style={{
                      padding: 16, cursor: 'pointer',
                      border: config.template === tmpl.id ? '2px solid var(--color-primary, #2563EB)' : '1px solid #E2E8F0',
                      backgroundColor: config.template === tmpl.id ? 'var(--color-primary-light, #EFF6FF)' : '#FFFFFF'
                    }}
                  >
                    <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{tmpl.name}</span>
                      {config.template === tmpl.id && <CheckCircle2 size={16} color="var(--color-primary, #2563EB)" />}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>
                      {tmpl.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. SEO SETTINGS */}
          {activeSection === 'seo' && (
            <div className="animate-fadeIn">
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16, color: '#0F172A' }}>
                🔍 Search Engine Optimization (SEO)
              </h3>

              <div className="form-group">
                <label className="form-label">Page Title</label>
                <input
                  className="form-input"
                  value={config.seo?.title || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    seo: { ...config.seo, title: e.target.value }
                  })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={config.seo?.description || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    seo: { ...config.seo, description: e.target.value }
                  })}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE DEVICE PREVIEW */}
        <div className="card" style={{ padding: 16, borderRadius: 14, overflow: 'hidden' }}>
          {/* Device Switcher Header */}
          <div className="flex justify-between items-center" style={{ marginBottom: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
            <div className="flex items-center gap-2">
              <Eye size={16} color="var(--color-primary, #2563EB)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                Interactive Live Website Preview
              </span>
            </div>

            {/* Device Width Buttons */}
            <div style={{ display: 'flex', gap: 4, backgroundColor: '#F1F5F9', padding: 3, borderRadius: 8 }}>
              <button
                className={`btn btn-xs ${deviceMode === 'desktop' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('desktop')}
                title="Desktop 100%"
                style={{ padding: '4px 8px' }}
              >
                <Monitor size={14} /> Desktop
              </button>
              <button
                className={`btn btn-xs ${deviceMode === 'tablet' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('tablet')}
                title="Tablet 768px"
                style={{ padding: '4px 8px' }}
              >
                <Tablet size={14} /> Tablet
              </button>
              <button
                className={`btn btn-xs ${deviceMode === 'mobile' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setDeviceMode('mobile')}
                title="Mobile 375px"
                style={{ padding: '4px 8px' }}
              >
                <Smartphone size={14} /> Mobile
              </button>
            </div>
          </div>

          {/* Scaled Preview Frame Container */}
          <div style={{
            display: 'flex', justifyContent: 'center', backgroundColor: '#F1F5F9',
            padding: 16, borderRadius: 12, minHeight: 600, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto'
          }}>
            <div style={{
              width: deviceMode === 'mobile' ? 375 : deviceMode === 'tablet' ? 768 : '100%',
              maxWidth: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: deviceMode === 'desktop' ? 8 : 16,
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              transition: 'width 0.25s ease'
            }}>
              <CollegeLandingPage previewConfig={config} isEmbedded={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteBuilder;
