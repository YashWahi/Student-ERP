// src/pages/superadmin/Overview.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Key, Shield, Smartphone, HardDrive, CreditCard, Sliders, CheckCircle2, Save } from 'lucide-react';
import SuperAdminDashboard from '../../features/superadmin/dashboard/SuperAdminDashboard';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const SuperAdminOverview = () => {
  const location = useLocation();
  const isSettings = location.pathname === '/superadmin/settings';
  const [activeTab, setActiveTab] = useState('general');

  const [platformSettings, setPlatformSettings] = useState(() => {
    const saved = localStorage.getItem('platform_global_settings');
    return saved
      ? JSON.parse(saved)
      : {
          platformName: 'EduERP Pro Enterprise SaaS Control Center',
          ownerEmail: 'superadmin@eduerppro.com',
          supportPhone: '+91 98765 43210',
          timezone: 'Asia/Kolkata (IST)',
          licenseKey: 'EDUERP-ENT-2026-9901-PRO',
          maxStorageLimit: 500,
          smsGatewayEnabled: true,
          smsProvider: 'Twilio / Fast2SMS Gateway',
          autoBackupFrequency: 'Daily 02:00 AM UTC',
          backupStorageTarget: 'Google Cloud Storage Bucket',
          sessionTimeoutMins: 60,
          enforceMfaForAdmins: true,
          passwordMinLength: 8,
          paymentGatewayMode: 'Test Mode (Razorpay)',
          webhookSecret: 'whsec_rzp_live_secret_key_8892',
          currency: 'INR (₹)',
        };
  });

  const handleSaveSettings = async () => {
    localStorage.setItem('platform_global_settings', JSON.stringify(platformSettings));
    await logAuditEvent({
      action: 'UPDATE_PLATFORM_SETTINGS',
      actor: 'Super Admin',
      target: 'Platform Settings',
      details: `Updated platform global settings under tab [${activeTab.toUpperCase()}]`,
    });
    toast.success('⚙️ Platform Global Settings updated & saved!');
  };

  if (isSettings) {
    return (
      <div className="animate-fadeIn" style={{ paddingBottom: 40 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Platform Global Settings & Governance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#64748B' }}>
            Configure root platform security, tenant defaults, backup frequencies, and enterprise integrations
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="card" style={{ marginBottom: 24, padding: '10px 16px', backgroundColor: '#F8FAFC' }}>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'general', label: 'General & Identity', icon: <Sliders size={15} /> },
              { id: 'security', label: 'Security & Auth', icon: <Shield size={15} /> },
              { id: 'sms', label: 'SMS & Email Gateway', icon: <Smartphone size={15} /> },
              { id: 'storage', label: 'Storage & Backup', icon: <HardDrive size={15} /> },
              { id: 'payments', label: 'Payment Gateway', icon: <CreditCard size={15} /> },
            ].map(tab => (
              <button
                key={tab.id}
                className={`btn btn-sm flex items-center gap-2 ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: 28,
            boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
                <Key size={18} color="#2563EB" /> Platform General Identity
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Platform SaaS Name</label>
                  <input
                    className="form-input"
                    value={platformSettings.platformName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SuperAdmin Owner Email</label>
                  <input
                    className="form-input"
                    value={platformSettings.ownerEmail}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, ownerEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Central Support Hotline</label>
                  <input
                    className="form-input"
                    value={platformSettings.supportPhone}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Default Timezone</label>
                  <input
                    className="form-input"
                    value={platformSettings.timezone}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, timezone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. SECURITY & AUTH TAB */}
          {activeTab === 'security' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
                <Shield size={18} color="#2563EB" /> Security & Session Policies
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Idle Session Timeout (Minutes)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={platformSettings.sessionTimeoutMins}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, sessionTimeoutMins: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Password Length</label>
                  <input
                    className="form-input"
                    type="number"
                    value={platformSettings.passwordMinLength}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, passwordMinLength: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Enterprise License Key</label>
                  <input
                    className="form-input"
                    value={platformSettings.licenseKey}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. SMS & EMAIL TAB */}
          {activeTab === 'sms' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
                <Smartphone size={18} color="#2563EB" /> Gateway Integrations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">SMS Gateway Provider</label>
                  <input
                    className="form-input"
                    value={platformSettings.smsProvider}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, smsProvider: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SMS Broadcast Status</label>
                  <select
                    className="form-select"
                    value={platformSettings.smsGatewayEnabled ? 'Enabled' : 'Disabled'}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, smsGatewayEnabled: e.target.value === 'Enabled' })}
                  >
                    <option value="Enabled">Enabled (Active Dispatch)</option>
                    <option value="Disabled">Disabled (Test Only)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 4. STORAGE & BACKUP TAB */}
          {activeTab === 'storage' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
                <HardDrive size={18} color="#2563EB" /> Cloud Storage & Backup Schedule
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Default Tenant Max Storage Limit (GB)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={platformSettings.maxStorageLimit}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, maxStorageLimit: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Automated Cloud Backup Frequency</label>
                  <input
                    className="form-input"
                    value={platformSettings.autoBackupFrequency}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, autoBackupFrequency: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Backup Target Cloud Provider</label>
                  <input
                    className="form-input"
                    value={platformSettings.backupStorageTarget}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div>
              <h3 style={{ margin: '0 0 18px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: '#0F172A' }}>
                <CreditCard size={18} color="#2563EB" /> SaaS Payment Gateway & Currency
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 20 }}>
                <div className="form-group">
                  <label className="form-label">Payment Gateway Mode</label>
                  <select
                    className="form-select"
                    value={platformSettings.paymentGatewayMode}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, paymentGatewayMode: e.target.value })}
                  >
                    <option value="Test Mode (Razorpay)">Test Mode (Razorpay)</option>
                    <option value="Live Production Mode (Razorpay)">Live Production Mode (Razorpay)</option>
                    <option value="Stripe Connect">Stripe Connect</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Currency</label>
                  <input
                    className="form-input"
                    value={platformSettings.currency}
                    disabled
                    style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Razorpay Webhook Secret Key</label>
                  <input
                    className="form-input"
                    value={platformSettings.webhookSecret}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, webhookSecret: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '10px 24px', fontWeight: 700 }}
              onClick={handleSaveSettings}
            >
              <Save size={16} /> Save Platform Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <SuperAdminDashboard />;
};

export default SuperAdminOverview;

