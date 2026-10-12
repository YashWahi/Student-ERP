// src/pages/auth/Login.jsx

import { useState, useEffect } from 'react';

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import {

  Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, LogIn, Shield, LockKeyhole, Activity

} from 'lucide-react';

import { loginUser, loginWithGoogle, loginWithMicrosoft, resetPassword } from '../../services/authService';

import { getTenant } from '../../services/tenantService';

import { useTheme } from '../../components/theme/ThemeProvider';

import { useAuthStore } from '../../store/authStore';

import toast from 'react-hot-toast';
// Tenant Branding Configurations
//Login Page supports multiple tenant branding based on URL parameters or theme context. Each tenant can have its own logo, colors, and welcome messages.

const TENANT_BRANDING = {

  default: {

    id: 'default',

    name: 'EduERP Pro',

    subTitle: 'Enterprise School & College SaaS Platform',

    logo: '🎓',

    primaryColor: '#2563EB',

    bgGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',

    welcomeMsg: 'Sign in to access your multi-tenant education workspace.',

    trustedTag: 'Trusted by 50+ modern educational institutions across 14 states',

    isPlatform: true,

  },

  gvis: {

    id: 'gvis',

    name: 'Green Valley International School',

    subTitle: 'Main Campus Branch — ERP Portal',

    logo: '🏫',

    primaryColor: '#0F766E',

    bgGradient: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',

    welcomeMsg: 'Welcome back to Green Valley International Portal.',

    trustedTag: 'CBSE Affiliated · Excellence in Education since 1998',

    isPlatform: false,

  },

  oxford: {

    id: 'oxford',

    name: 'Oxford Global College of Engineering',

    subTitle: 'Autonomous Institution Campus ERP',

    logo: '🏛️',

    primaryColor: '#7C3AED',

    bgGradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',

    welcomeMsg: 'Access Oxford Global Academic & Examination Portal.',

    trustedTag: 'NAAC A++ Accredited · AICTE Approved',

    isPlatform: false,

  },

  superadmin: {

    id: 'superadmin',

    name: 'EduERP Platform Administration',

    subTitle: 'Global SaaS Multi-Tenant Infrastructure Control',

    logo: '🛡️',

    primaryColor: '#1E293B',

    bgGradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',

    welcomeMsg: 'Sign in to manage education SaaS infrastructure, billing & tenants.',

    trustedTag: 'High Availability 99.98% SLA · Enterprise Security Standard',

    isPlatform: true,

  }

};



const ROLE_REDIRECT = {

  superadmin: '/superadmin',

  subadmin: '/subadmin',

  admin: '/admin',

  teacher: '/teacher',

  student: '/student',

  parent: '/parent',

  staff: '/staff',

};



const Login = ({ initialView = 'login' }) => {

  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const { setUser, setUserProfile, setLoading } = useAuthStore();

  const { theme } = useTheme();



  // Active Variant / Mode Control

  const [variant, setVariant] = useState(searchParams.get('variant') || searchParams.get('tenant') || searchParams.get('college') || 'default');

  const [dynamicTenant, setDynamicTenant] = useState(null);

  const [viewState, setViewState] = useState(initialView);

  const [statusState, setStatusState] = useState('none');



  // Form States

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(true);

  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submitSuccess, setSubmitSuccess] = useState(false);



  // Password Reset States

  const [resetEmail, setResetEmail] = useState('');

  const [resetSent, setResetSent] = useState(false);



  // Dynamically resolve tenant branding from URL parameter if passed

  useEffect(() => {

    const tenantParam = searchParams.get('tenant') || searchParams.get('college') || searchParams.get('variant');

    if (tenantParam && tenantParam !== 'default') {

      getTenant(tenantParam).then(t => {

        if (t) {

          const pCol = t.themeConfig?.colors?.primary || '#2563EB';

          const pColH = t.themeConfig?.colors?.primaryHover || '#1D4ED8';

          setDynamicTenant({

            id: t.tenantId || t.id,

            name: t.name || t.collegeName,

            subTitle: t.themeConfig?.branding?.tagline || `${t.name} — Campus ERP Portal`,

            logo: t.themeConfig?.branding?.logoUrl ? '🎓' : '🏫',

            primaryColor: pCol,

            bgGradient: `linear-gradient(135deg, ${pCol} 0%, ${pColH} 100%)`,

            welcomeMsg: t.themeConfig?.branding?.welcomeMessage || `Welcome to ${t.name} Portal`,

            trustedTag: `CBSE / State Board Affiliated · ${t.code || 'COL'} Campus`,

            isPlatform: false,

          });

        }

      });

    }

  }, [searchParams]);



  // Check remembered email on mount

  useEffect(() => {

    const savedEmail = localStorage.getItem('remembered_email');

    if (savedEmail) {

      setEmail(savedEmail);

      setRememberMe(true);

    }

  }, []);



  // Resolve Active Tenant Branding (Dynamic tenant > Theme Context > Static preset > Default)

  const tenantTheme = dynamicTenant || (theme?.branding?.collegeName ? {

    id: 'current_tenant',

    name: theme.branding.collegeName,

    subTitle: theme.branding.tagline || 'Institutional Campus Workspace',

    logo: '🎓',

    primaryColor: theme.colors?.primary || 'var(--color-primary, #2563EB)',

    bgGradient: `linear-gradient(135deg, ${theme.colors?.primary || '#2563EB'} 0%, ${theme.colors?.primaryHover || '#1D4ED8'} 100%)`,

    welcomeMsg: theme.branding.welcomeMessage || `Welcome to ${theme.branding.collegeName} Portal`,

    trustedTag: `${theme.branding.shortName || 'COL'} Campus · Smart Education System`,

    isPlatform: false,

  } : (TENANT_BRANDING[variant] || TENANT_BRANDING.default));



  // Primary Login Submit Handler (Real Firebase Auth)

  const handleLoginSubmit = async (e) => {

    if (e) e.preventDefault();



    if (!email || !password) {

      setStatusState('invalid_cred');

      toast.error('Please enter both email and password');

      return;

    }



    setIsSubmitting(true);

    setStatusState('none');



    try {

      if (rememberMe) {

        localStorage.setItem('remembered_email', email);

      } else {

        localStorage.removeItem('remembered_email');

      }



      const res = await loginUser(email, password);

      const { user: loggedUser, profile: userProfile } = res;



      setUser(loggedUser);
      setUserProfile(userProfile);
      setLoading(false);
      setSubmitSuccess(true);

      const fromPath = location.state?.from?.pathname;
      const roleDefaultPath = ROLE_REDIRECT[userProfile.role];
      if (!roleDefaultPath) {
        throw new Error('Your ERP profile has an unsupported role. Contact your administrator.');
      }
      let targetPath = roleDefaultPath;

      if (fromPath && fromPath.startsWith(`/${userProfile.role}`)) {
        targetPath = fromPath;
      }



      toast.success(`🎉 Welcome back, ${userProfile?.name || 'User'}! Navigating to portal...`);



      setTimeout(() => {

        setIsSubmitting(false);

        navigate(targetPath, { replace: true });

      }, 400);

    } catch (err) {

      console.error('Firebase login error:', err);
      setIsSubmitting(false);
      const profileError = err.code === 'auth/profile-not-found';
      const invalidCredentials = [
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-email',
      ].includes(err.code);
      setStatusState(profileError ? 'profile_error' : invalidCredentials ? 'invalid_cred' : 'none');
      const msg = invalidCredentials
        ? 'Invalid email or password. Please check your credentials.'
        : profileError
          ? 'Your Firebase account has no valid ERP profile. Contact your administrator.'
          : err.message || 'Authentication failed. Please check your network and credentials.';
      toast.error(msg);

    }

  };



  // Google SSO Handler

  const handleGoogleAuth = async () => {

    setIsSubmitting(true);

    try {

      const res = await loginWithGoogle();

      setUser(res.user);

      setUserProfile(res.profile);

      setLoading(false);
      toast.success(`Signed in as ${res.profile.name}`);
      const targetPath = ROLE_REDIRECT[res.profile.role] || '/login';
      navigate(targetPath, { replace: true });
    } catch (err) {
      console.error('Google SSO Error:', err);
      toast.error(err.message || 'Google Single Sign-On failed or was cancelled.');

    } finally {

      setIsSubmitting(false);

    }

  };



  // Microsoft SSO Handler

  const handleMicrosoftAuth = async () => {

    setIsSubmitting(true);

    try {

      const res = await loginWithMicrosoft();

      setUser(res.user);

      setUserProfile(res.profile);

      setLoading(false);
      toast.success(`Signed in as ${res.profile.name}`);
      const targetPath = ROLE_REDIRECT[res.profile.role] || '/login';
      navigate(targetPath, { replace: true });
    } catch (err) {
      console.error('Microsoft SSO Error:', err);
      toast.error(err.message || 'Microsoft 365 Sign-On failed or was cancelled.');

    } finally {

      setIsSubmitting(false);

    }

  };



  // Password Reset Handler

  const handleForgotPasswordSubmit = async (e) => {

    e.preventDefault();

    if (!resetEmail) {

      toast.error('Please enter your email address');

      return;

    }

    setIsSubmitting(true);

    try {

      await resetPassword(resetEmail);

      setResetSent(true);

      toast.success(`Password reset email sent to ${resetEmail}!`);

    } catch (err) {

      console.error('Password reset error:', err);

      toast.error(err.message || 'Failed to send password reset email.');

    } finally {

      setIsSubmitting(false);

    }

  };



  return (

    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif" }}>



      {/* MAIN TWO-COLUMN DESKTOP AUTH LAYOUT */}

      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', minHeight: '100vh' }}>



        {/* 2. RIGHT SIDE — AUTHENTICATION CARD & FORMS (55% Width Area) */}

        <div style={{

          flex: '1 1 100%', minWidth: 'min(360px, 100%)', width: '100%', backgroundColor: '#F8FAFC',

          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',

          padding: 'clamp(24px, 4vw, 40px) 16px'

        }}>

          {/* AUTH CARD (460px Width) */}

          <div style={{

            width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF',

            borderRadius: 16, border: '1px solid #E2E8F0',

            boxShadow: '0 20px 40px -15px rgba(15,23,42,0.06)',

            padding: 'clamp(20px, 4vw, 36px)', position: 'relative'

          }}>



            {/* MAINTENANCE MODE OVERLAY */}

            {variant === 'maintenance' && (

              <div style={{ textAlign: 'center', padding: '20px 0' }}>

                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⚙️</div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Scheduled System Maintenance</h3>

                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>

                  EduERP platform is undergoing scheduled database optimization & infrastructure upgrades. Authentication is temporarily paused.

                </p>

                <div style={{ padding: 12, backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>

                  Estimated Completion: 08:30 PM IST

                </div>

                <button className="btn btn-secondary w-full" style={{ marginTop: 20 }} onClick={() => setVariant('default')}>

                  Back to Regular Login

                </button>

              </div>

            )}



            {/* SUSPENDED TENANT OVERLAY */}

            {variant === 'suspended' && (

              <div style={{ textAlign: 'center', padding: '20px 0' }}>

                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🚫</div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#DC2626', marginBottom: 8 }}>Institution Access Restricted</h3>

                <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>

                  This institution tenant account has been restricted due to pending administrative verification or subscription hold.

                </p>

                <button className="btn btn-primary w-full" onClick={() => toast.success('Connecting to Support Desk...')}>

                  Contact Administrator

                </button>

                <button className="btn btn-ghost w-full" style={{ marginTop: 8 }} onClick={() => setVariant('default')}>

                  Sign In with Different Tenant

                </button>

              </div>

            )}



            {/* REGULAR AUTH FORMS */}

            {variant !== 'maintenance' && variant !== 'suspended' && (

              <div>



                {/* BRAND HEADER INSIDE CARD */}

                <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>

                  <div style={{

                    width: 36, height: 36, borderRadius: 8, background: tenantTheme.bgGradient,

                    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',

                    fontSize: '1.1rem', fontWeight: 800

                  }}>

                    {tenantTheme.logo}

                  </div>

                  <div>

                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', lineHeight: 1.2 }}>

                      {tenantTheme.name}

                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>

                      {tenantTheme.isPlatform ? 'Platform Portal' : 'ERP Workspace'}

                    </div>

                  </div>

                </div>



                {/* LOGIN STATUS BANNERS */}

                {statusState !== 'none' && (

                  <div style={{ marginBottom: 20 }}>

                    {statusState === 'invalid_cred' && (
                      <div style={{ padding: 12, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: '0.8rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={16} /> Email or password is incorrect.
                      </div>
                    )}
                    {statusState === 'profile_error' && (
                      <div style={{ padding: 12, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: '0.8rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={16} /> Your account does not have a valid ERP profile. Contact your administrator.
                      </div>
                    )}

                    {statusState === 'suspended' && (

                      <div style={{ padding: 12, backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: '0.8rem', color: '#991B1B' }}>

                        <strong>Your account has been suspended.</strong> Contact your administrator.

                      </div>

                    )}

                  </div>

                )}



                {/* VIEW 1: REGULAR SIGN-IN FORM */}

                {viewState === 'login' && (

                  <div>

                    <div style={{ marginBottom: 24 }}>

                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>Welcome back</h2>

                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>{tenantTheme.welcomeMsg}</p>

                    </div>



                    <form onSubmit={handleLoginSubmit}>

                      {/* Email / Username */}

                      <div className="form-group" style={{ marginBottom: 16 }}>

                        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>Email Address</label>

                        <div className="input-group">

                          <div className="input-prefix"><Mail size={16} color="#64748B" /></div>

                          <input

                            className="form-input"

                            type="email"

                            placeholder="manikkr228@gmail.com"

                            value={email}

                            onChange={e => setEmail(e.target.value)}

                            required

                            autoComplete="username"

                            style={{ height: 44, fontSize: '0.9rem' }}

                          />

                        </div>

                      </div>



                      {/* Password */}

                      <div className="form-group" style={{ marginBottom: 16 }}>

                        <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>

                          <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#334155' }}>Password</label>

                          <span

                            style={{ fontSize: '0.78rem', color: tenantTheme.primaryColor, fontWeight: 600, cursor: 'pointer' }}

                            onClick={() => setViewState('forgot')}

                          >

                            Forgot password?

                          </span>

                        </div>

                        <div className="input-group">

                          <div className="input-prefix"><Lock size={16} color="#64748B" /></div>

                          <input

                            className="form-input"

                            type={showPassword ? 'text' : 'password'}

                            placeholder="123456"

                            value={password}

                            onChange={e => setPassword(e.target.value)}

                            required

                            autoComplete="current-password"

                            style={{ height: 44, fontSize: '0.9rem' }}

                          />

                          <div className="input-suffix" style={{ cursor: 'pointer' }} onClick={() => setShowPassword(!showPassword)}>

                            {showPassword ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}

                          </div>

                        </div>

                      </div>



                      {/* Remember Me */}

                      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>

                        <label className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.825rem', color: '#475569' }}>

                          <input

                            type="checkbox"

                            checked={rememberMe}

                            onChange={e => setRememberMe(e.target.checked)}

                            style={{ borderRadius: 4, width: 16, height: 16, accentColor: tenantTheme.primaryColor }}

                          />

                          Remember me

                        </label>

                      </div>



                      {/* PRIMARY SIGN-IN BUTTON */}

                      <button

                        type="submit"

                        className="btn w-full btn-lg"

                        style={{

                          backgroundColor: tenantTheme.primaryColor, color: '#FFFFFF',

                          fontWeight: 700, height: 46, fontSize: '0.95rem', borderRadius: 8,

                          boxShadow: `0 4px 14px ${tenantTheme.primaryColor}35`, transition: 'all 0.15s ease'

                        }}

                        disabled={isSubmitting}

                      >

                        {isSubmitting ? (

                          <div className="flex items-center justify-center gap-2">

                            <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />

                            Signing in...

                          </div>

                        ) : submitSuccess ? (

                          <div className="flex items-center justify-center gap-2">

                            <CheckCircle2 size={18} /> Signed In! Redirecting...

                          </div>

                        ) : (

                          <div className="flex items-center justify-center gap-2">

                            <LogIn size={18} /> Sign In to Portal

                          </div>

                        )}

                      </button>

                    </form>



                    {/* SOCIAL OAUTH METHODS */}

                    <div style={{ margin: '24px 0 20px 0', textAlign: 'center', position: 'relative' }}>

                      <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: '#E2E8F0' }} />

                      <span style={{ position: 'relative', backgroundColor: '#FFFFFF', padding: '0 12px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>

                        OR CONTINUE WITH

                      </span>

                    </div>



                    <div className="grid-2" style={{ gap: 12 }}>

                      <button

                        type="button"

                        className="btn btn-secondary btn-md flex items-center justify-center gap-2"

                        onClick={handleGoogleAuth}

                        disabled={isSubmitting}

                        style={{ fontSize: '0.8rem', height: 40 }}

                      >

                        <span>🌐</span> Google SSO

                      </button>

                      <button

                        type="button"

                        className="btn btn-secondary btn-md flex items-center justify-center gap-2"

                        onClick={handleMicrosoftAuth}

                        disabled={isSubmitting}

                        style={{ fontSize: '0.8rem', height: 40 }}

                      >

                        <span>🏢</span> Microsoft 365

                      </button>

                    </div>



                  </div>

                )}



                {/* VIEW 2: FORGOT PASSWORD */}

                {viewState === 'forgot' && (

                  <div>

                    <div style={{ marginBottom: 20 }}>

                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px 0' }}>Forgot password?</h2>

                      <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>

                        Enter your registered email address and we will send you a password reset link.

                      </p>

                    </div>



                    {!resetSent ? (

                      <form onSubmit={handleForgotPasswordSubmit}>

                        <div className="form-group" style={{ marginBottom: 20 }}>

                          <label className="form-label">Registered Email</label>

                          <div className="input-group">

                            <div className="input-prefix"><Mail size={16} color="#64748B" /></div>

                            <input

                              className="form-input"

                              type="email"

                              placeholder="name@school.edu"

                              value={resetEmail}

                              onChange={e => setResetEmail(e.target.value)}

                              required

                            />

                          </div>

                        </div>



                        <button

                          type="submit"

                          className="btn btn-primary w-full btn-lg"

                          style={{ height: 46 }}

                          disabled={isSubmitting}

                        >

                          {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}

                        </button>

                      </form>

                    ) : (

                      <div style={{ padding: 16, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, textAlign: 'center' }}>

                        <CheckCircle2 size={28} color="#16A34A" style={{ margin: '0 auto 8px' }} />

                        <h4 style={{ margin: 0, color: '#166534' }}>Check your email</h4>

                        <p style={{ fontSize: '0.8rem', color: '#15803D', marginTop: 4 }}>

                          We sent a password reset link to <strong>{resetEmail || 'your email'}</strong>.

                        </p>

                      </div>

                    )}



                    <button className="btn btn-ghost w-full" style={{ marginTop: 16 }} onClick={() => { setViewState('login'); setResetSent(false); }}>

                      ← Back to Sign In

                    </button>

                  </div>

                )}



              </div>

            )}



          </div>

        </div>



      </div>

    </div>

  );

};



export default Login;
