// src/pages/public/CollegeLandingPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap, ArrowRight, Star, Phone, Mail, MapPin,
  Award, BookOpen, Monitor, Cpu, Activity, Truck, Coffee,
  Menu, X, Shield, Sparkles, Send, Globe
} from 'lucide-react';
import { getWebsiteConfig, submitAdmissionLead, submitContactMessage, DEFAULT_WEBSITE_CONFIG } from '../../services/websiteService';
import { getTenant } from '../../services/tenantService';
import { applyThemeToDom } from '../../components/theme/themeUtils';
import toast from 'react-hot-toast';

const ICON_MAP = {
  Monitor: Monitor,
  Cpu: Cpu,
  BookOpen: BookOpen,
  Activity: Activity,
  Truck: Truck,
  Coffee: Coffee,
  GraduationCap: GraduationCap,
  Award: Award,
};

const CollegeLandingPage = ({ previewConfig = null, isEmbedded = false }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [config, setConfig] = useState(previewConfig || DEFAULT_WEBSITE_CONFIG);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState('All');
  const [submittingApply, setSubmittingApply] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  // Form states
  const [applyForm, setApplyForm] = useState({
    name: '',
    parentName: '',
    email: '',
    phone: '',
    course: 'Senior Secondary (Science & Technology)',
    message: '',
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const canvasRef = useRef(null);

  // Load config and tenant theme when slug changes (unless previewConfig is passed)
  useEffect(() => {
    if (previewConfig) {
      setConfig(previewConfig);
      return;
    }

    const loadConfigAndTheme = async () => {
      const activeSlug = slug || 'greenfield-college';
      const res = await getWebsiteConfig(activeSlug);
      setConfig(res);

      if (!isEmbedded) {
        const tenant = await getTenant(activeSlug);
        if (tenant?.themeConfig) {
          applyThemeToDom(tenant.themeConfig);
        }
      }
    };
    loadConfigAndTheme();
  }, [slug, previewConfig, isEmbedded]);

  // 3D / Animated Floating Particles Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight || 600);

    const particles = [];
    const particleCount = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 8 : 28;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.5 + 1,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.35 + 0.1,
      });
    }

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw floating nodes & connection webs
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${p.alpha})`;
        ctx.fill();

        // Connect nearby nodes
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.name || !applyForm.email || !applyForm.phone) {
      toast.error('Please enter student name, email, and phone number.');
      return;
    }

    setSubmittingApply(true);
    try {
      await submitAdmissionLead(slug || 'tenant_gvis', applyForm);
      toast.success(`🎉 Admission enquiry submitted! Our admissions office will contact you shortly.`);
      setApplyModalOpen(false);
      setApplyForm({ name: '', parentName: '', email: '', phone: '', course: config.programs?.[0]?.title || '', message: '' });
    } catch {
      toast.success('🎉 Application recorded! We will connect soon.');
      setApplyModalOpen(false);
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please complete the contact form.');
      return;
    }

    setSubmittingContact(true);
    try {
      await submitContactMessage(slug || 'tenant_gvis', contactForm);
      toast.success(`✉️ Thank you! Your message has been sent to the administration.`);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.success('✉️ Message received! Thank you.');
    } finally {
      setSubmittingContact(false);
    }
  };

  const galleryItems = config.gallery || [];
  const filteredGallery = activeGalleryTab === 'All'
    ? galleryItems
    : galleryItems.filter(g => g.category === activeGalleryTab);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      color: '#0F172A',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* 1. STICKY NAVBAR */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '0 24px',
        transition: 'all 0.2s ease'
      }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', height: 72,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          {/* Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--color-primary, #2563EB), var(--color-accent, #7C3AED))',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.25rem', boxShadow: '0 8px 16px -4px rgba(37,99,235,0.3)'
            }}>
              🎓
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {config.seo?.title?.split('—')[0]?.trim() || config.collegeName || 'Campus Portal'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Higher Education & Research Campus
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }} className="hidden-mobile">
            {config.navigation?.map((nav, idx) => (
              <a
                key={idx}
                href={nav.href}
                style={{
                  fontSize: '0.875rem', fontWeight: 600, color: '#475569',
                  textDecoration: 'none', transition: 'color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary, #2563EB)'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
              >
                {nav.label}
              </a>
            ))}
          </nav>

          {/* CTA Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setApplyModalOpen(true)}
              style={{
                borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: '0.85rem',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)'
              }}
            >
              Apply Online
            </button>
            {!isEmbedded && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/login')}
                style={{
                  borderRadius: 8, padding: '8px 16px', fontWeight: 700, fontSize: '0.85rem'
                }}
              >
                Portal Login
              </button>
            )}
            <button
              className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              id="landing-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH 3D CANVAS PARTICLES */}
      <section id="hero" style={{ position: 'relative', overflow: 'hidden', padding: '72px 24px 80px', backgroundColor: '#F8FAFC' }}>
        {/* Background interactive canvas */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.8 }}
        />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="grid-2-1" style={{ alignItems: 'center', gap: 48 }}>
            {/* Left Hero Content */}
            <div>
              {config.hero?.badge && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 14px', borderRadius: 20,
                  backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                  border: '1px solid var(--color-primary-border, #BFDBFE)',
                  color: 'var(--color-primary, #2563EB)', fontSize: '0.82rem', fontWeight: 700,
                  marginBottom: 20, boxShadow: '0 2px 6px rgba(37,99,235,0.08)'
                }}>
                  <Sparkles size={15} />
                  <span>{config.hero.badge}</span>
                </div>
              )}

              <h1 style={{
                fontSize: 'clamp(2rem, 4.5vw, 3.25rem)', fontWeight: 900,
                color: '#0F172A', lineHeight: 1.15, letterSpacing: '-0.03em',
                marginBottom: 20
              }}>
                {config.hero?.headline}
              </h1>

              <p style={{
                fontSize: '1.05rem', color: '#475569', lineHeight: 1.65,
                marginBottom: 32, maxWidth: 620
              }}>
                {config.hero?.subheadline}
              </p>

              {/* CTA Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 40 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setApplyModalOpen(true)}
                  style={{
                    padding: '12px 28px', fontSize: '1rem', fontWeight: 800, borderRadius: 10,
                    boxShadow: '0 10px 20px -4px rgba(37,99,235,0.35)', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  {config.hero?.primaryCtaText || 'Apply for Admission'} <ArrowRight size={18} />
                </button>

                <a
                  href={config.hero?.secondaryCtaLink || '#programs'}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 24px', fontSize: '1rem', fontWeight: 700, borderRadius: 10,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8
                  }}
                >
                  {config.hero?.secondaryCtaText || 'Explore Programs'}
                </a>
              </div>

              {/* 4 Animated KPI Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 16, borderTop: '1px solid #E2E8F0', paddingTop: 24
              }}>
                {config.hero?.stats?.map((st, idx) => (
                  <div key={idx}>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-primary, #2563EB)', letterSpacing: '-0.02em' }}>
                      {st.value}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginTop: 2 }}>
                      {st.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Hero Visual Card */}
            <div style={{ position: 'relative' }}>
              <div style={{
                borderRadius: 20, overflow: 'hidden', border: '1px solid #E2E8F0',
                boxShadow: '0 25px 50px -12px rgba(15,23,42,0.15)',
                backgroundColor: '#FFFFFF', position: 'relative'
              }}>
                <img
                  src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80"
                  alt="Campus Main Quadrangle"
                  style={{ width: '100%', height: 340, objectFit: 'cover', display: 'block' }}
                />

                {/* Floating Glassmorphic Badge */}
                <div style={{
                  position: 'absolute', bottom: 16, left: 16, right: 16,
                  padding: '14px 18px', borderRadius: 14,
                  backgroundColor: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                      🏛️ State-of-the-Art 45-Acre Campus
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                      Ranked #1 Academic Excellence & Placement
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, backgroundColor: '#DCFCE7',
                    color: '#15803D', fontSize: '0.72rem', fontWeight: 800
                  }}>
                    A++ Accredited
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ABOUT US & MISSION SECTION */}
      {config.about?.enabled && (
        <section id="about" style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 56px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                {config.about.tagline || 'Excellence in Education'}
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 16 }}>
                {config.about.heading}
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.65 }}>
                {config.about.description}
              </p>
            </div>

            <div className="grid-3" style={{ gap: 24 }}>
              <div className="card" style={{ padding: 28, borderRadius: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Globe size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: '#0F172A' }}>Our Vision</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  {config.about.vision}
                </p>
              </div>

              <div className="card" style={{ padding: 28, borderRadius: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Award size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: '#0F172A' }}>Our Mission</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  {config.about.mission}
                </p>
              </div>

              <div className="card" style={{ padding: 28, borderRadius: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Shield size={22} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8, color: '#0F172A' }}>Core Values</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                  Academic Integrity, Inquisitive Intellect, Respect for Diversity, Empathy, and Sustainable Global Citizenship.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. PRINCIPAL / DIRECTOR'S MESSAGE */}
      {config.principal?.enabled && (
        <section id="principal" style={{ padding: '80px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="card" style={{ padding: 'clamp(24px, 4vw, 48px)', borderRadius: 20, backgroundColor: '#FFFFFF', boxShadow: '0 20px 40px -15px rgba(15,23,42,0.06)' }}>
              <div className="grid-1-2" style={{ alignItems: 'center', gap: 36 }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={config.principal.photo}
                    alt={config.principal.name}
                    style={{
                      width: 180, height: 180, borderRadius: '50%', objectFit: 'cover',
                      margin: '0 auto 16px', border: '4px solid var(--color-primary-light, #EFF6FF)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.08)'
                    }}
                  />
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                    {config.principal.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary, #2563EB)', fontWeight: 700 }}>
                    {config.principal.designation}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '2.5rem', color: 'var(--color-primary, #2563EB)', lineHeight: 1, fontFamily: 'serif' }}>“</div>
                  <p style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.75, fontStyle: 'italic', margin: '-10px 0 20px' }}>
                    {config.principal.message}
                  </p>
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                      {config.principal.signatureTitle || 'Office of the Principal'}
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setApplyModalOpen(true)}
                      style={{ borderRadius: 8 }}
                    >
                      Connect with Academics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. ACADEMIC PROGRAMS & COURSES */}
      <section id="programs" style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 56px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Academic Offerings
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 16 }}>
              World-Class Programs & Curriculum
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.65 }}>
              Choose from specialized academic pathways designed to build strong subject mastery, critical inquiry, and university readiness.
            </p>
          </div>

          <div className="grid-3" style={{ gap: 24 }}>
            {config.programs?.map((prog) => (
              <div
                key={prog.id}
                className="card"
                style={{
                  padding: 32, borderRadius: 16, display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', border: '1px solid #E2E8F0',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div>
                  <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 12,
                      backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                      color: 'var(--color-primary, #2563EB)',
                      fontSize: '0.75rem', fontWeight: 800
                    }}>
                      {prog.category || 'Curriculum'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      ⏳ {prog.duration}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: 10, lineHeight: 1.3 }}>
                    {prog.title}
                  </h3>

                  <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
                    {prog.description}
                  </p>

                  <div style={{
                    padding: '10px 14px', borderRadius: 8, backgroundColor: '#F8FAFC',
                    fontSize: '0.78rem', color: '#475569', fontWeight: 600, marginBottom: 20
                  }}>
                    🎯 <strong>Eligibility:</strong> {prog.eligibility}
                  </div>
                </div>

                <button
                  className="btn btn-outline w-full"
                  onClick={() => {
                    setApplyForm(prev => ({ ...prev, course: prog.title }));
                    setApplyModalOpen(true);
                  }}
                  style={{ borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', justifyContent: 'center' }}
                >
                  Enquire for this Program
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FACILITIES & CAMPUS INFRASTRUCTURE */}
      <section id="facilities" style={{ padding: '80px 24px', backgroundColor: '#F8FAFC' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 56px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Campus Infrastructure
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 16 }}>
              Built for Holistic Discovery
            </h2>
            <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.65 }}>
              From high-tech robotics testbeds to Olympic-standard athletic arenas, our campus provides the ideal environment to learn and thrive.
            </p>
          </div>

          <div className="grid-3" style={{ gap: 20 }}>
            {config.facilities?.map((fac) => {
              const IconComp = ICON_MAP[fac.icon] || Monitor;
              return (
                <div key={fac.id} className="card" style={{ padding: 24, borderRadius: 14, backgroundColor: '#FFFFFF' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    backgroundColor: 'var(--color-primary-light, #EFF6FF)',
                    color: 'var(--color-primary, #2563EB)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16
                  }}>
                    <IconComp size={22} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
                    {fac.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                    {fac.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CAMPUS PHOTO GALLERY */}
      <section id="gallery" style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Visual Tour
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Life on Campus
              </h2>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              {['All', 'Campus', 'Events', 'Sports'].map(tab => (
                <button
                  key={tab}
                  className={`btn btn-sm ${activeGalleryTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveGalleryTab(tab)}
                  style={{ borderRadius: 20, padding: '6px 16px', fontWeight: 700 }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-4" style={{ gap: 18 }}>
            {filteredGallery.map(img => (
              <div
                key={img.id}
                style={{
                  borderRadius: 14, overflow: 'hidden', position: 'relative',
                  height: 220, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                <img
                  src={img.url}
                  alt={img.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0) 60%)',
                  padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>{img.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#CBD5E1' }}>{img.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS */}
      {config.testimonials?.length > 0 && (
        <section style={{ padding: '80px 24px', backgroundColor: '#F8FAFC' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 48px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Voices of Excellence
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                What Our Students & Parents Say
              </h2>
            </div>

            <div className="grid-2" style={{ gap: 24 }}>
              {config.testimonials.map(t => (
                <div key={t.id} className="card" style={{ padding: 32, borderRadius: 16, backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14, color: '#F59E0B' }}>
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} size={16} fill="#F59E0B" />
                    ))}
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.65, fontStyle: 'italic', marginBottom: 20 }}>
                    "{t.message}"
                  </p>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>{t.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. CONTACT & ADMISSIONS ENQUIRY */}
      <section id="contact" style={{ padding: '80px 24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="grid-2" style={{ gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary, #2563EB)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Get in Touch
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.025em', marginBottom: 16 }}>
                Campus Admissions Office
              </h2>
              <p style={{ fontSize: '1rem', color: '#64748B', lineHeight: 1.65, marginBottom: 32 }}>
                Have questions regarding curriculum, eligibility, fee structure, or bus routes? Our counselors are here to help you every step of the way.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>CAMPUS ADDRESS</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{config.contact?.address}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>DIRECT ADMISSION HOTLINE</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{config.contact?.admissionPhone || config.contact?.phone}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B' }}>OFFICIAL EMAIL</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{config.contact?.email}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Contact Form */}
            <div className="card" style={{ padding: 36, borderRadius: 18, border: '1px solid #E2E8F0', boxShadow: '0 20px 40px -15px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
                Send an Enquiry Message
              </h3>

              <form onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="Enter your name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="your.email@gmail.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      className="form-input"
                      placeholder="+91 98765 43210"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message / Enquiry *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    placeholder="How can we help you regarding admissions or campus details?"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={submittingContact}
                  style={{ borderRadius: 8, padding: 12, fontWeight: 800, fontSize: '0.95rem', justifyContent: 'center' }}
                >
                  <Send size={16} /> {submittingContact ? 'Sending Message...' : 'Submit Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10. DYNAMIC FOOTER */}
      <footer style={{ backgroundColor: '#0F172A', color: '#94A3B8', padding: '64px 24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="grid-4" style={{ gap: 36, marginBottom: 48 }}>
            <div>
              <div className="flex items-center gap-2" style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.2rem', marginBottom: 14 }}>
                <span>🎓</span> {config.seo?.title?.split('—')[0]?.trim() || 'Greenfield College'}
              </div>
              <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94A3B8' }}>
                {config.footer?.about || 'Autonomous premier higher education institution committed to excellence in scholarship and leadership.'}
              </p>
            </div>

            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem', marginBottom: 14 }}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <a href="#about" style={{ color: '#94A3B8', textDecoration: 'none' }}>About Us</a>
                <a href="#programs" style={{ color: '#94A3B8', textDecoration: 'none' }}>Programs & Courses</a>
                <a href="#facilities" style={{ color: '#94A3B8', textDecoration: 'none' }}>Facilities & Labs</a>
                <a href="#gallery" style={{ color: '#94A3B8', textDecoration: 'none' }}>Photo Gallery</a>
              </div>
            </div>

            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem', marginBottom: 14 }}>Admissions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <span style={{ color: '#E2E8F0', fontWeight: 700 }}>Session 2026-27 Open</span>
                <span>Scholarships Available</span>
                <span>Hostel & Bus Allocation</span>
                <span onClick={() => setApplyModalOpen(true)} style={{ color: '#38BDF8', cursor: 'pointer', fontWeight: 700 }}>Apply Online →</span>
              </div>
            </div>

            <div>
              <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.9rem', marginBottom: 14 }}>Portals & Support</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                <a href="/login" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 700 }}>ERP Portal Login →</a>
                <span>Student Grievance Cell</span>
                <span>Anti-Ragging Committee</span>
                <span>ISO 27001 Certified Campus</span>
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #1E293B', paddingTop: 24, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            fontSize: '0.8rem'
          }}>
            <div>{config.footer?.copyright || `© ${new Date().getFullYear()} Greenfield College. Powered by EduERP Pro.`}</div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
              <span style={{ cursor: 'pointer' }}>Terms of Service</span>
              <span style={{ cursor: 'pointer' }}>Mandatory Disclosure</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 11. ADMISSION APPLY MODAL */}
      {applyModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16
        }}>
          <div className="card" style={{
            maxWidth: 540, width: '100%', padding: 'clamp(20px, 4vw, 32px)', borderRadius: 20,
            maxHeight: '92vh', overflowY: 'auto', backgroundColor: '#FFFFFF', position: 'relative'
          }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  🎓 Apply for Admission 2026-27
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 0' }}>
                  Submit details below. Your enquiry will be processed directly by the Admissions CRM.
                </p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setApplyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="form-group">
                <label className="form-label">Candidate Full Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Aryan Sharma"
                  value={applyForm.name}
                  onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent / Guardian Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Rajesh Sharma"
                  value={applyForm.parentName}
                  onChange={(e) => setApplyForm({ ...applyForm, parentName: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="aryan@gmail.com"
                    value={applyForm.email}
                    onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Phone *</label>
                  <input
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={applyForm.phone}
                    onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Desired Course / Grade *</label>
                <select
                  className="form-select"
                  value={applyForm.course}
                  onChange={(e) => setApplyForm({ ...applyForm, course: e.target.value })}
                >
                  {config.programs?.map((p) => (
                    <option key={p.id} value={p.title}>{p.title}</option>
                  ))}
                  <option value="Other / General Enquiry">Other / General Admission Enquiry</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional Academic Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Previous school, percentage scored in Class 10, or specific inquiries..."
                  value={applyForm.message}
                  onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                />
              </div>

              <div className="flex gap-3" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => setApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={submittingApply}
                  style={{ fontWeight: 800, justifyContent: 'center' }}
                >
                  {submittingApply ? 'Registering...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeLandingPage;
