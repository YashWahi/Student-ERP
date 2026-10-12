// src/pages/admin/AdminSettings.jsx
import { useState } from 'react';
import { Settings, Building, Bell, Shield, Palette, Save, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const { tenantId, userProfile } = useAuthStore();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(`admin_settings_${tenantId || 'default'}`);
    return saved ? JSON.parse(saved) : {
      schoolName: 'Green Valley International School',
      branchName: 'Main Campus Noida',
      affiliationNo: 'CBSE-AFF-2026-8819',
      academicSession: '2026-2027',
      contactPhone: '+91 98765 43210',
      contactEmail: 'admin@greenvalley.edu',
      address: 'Sector 62, Noida, Uttar Pradesh 201309',
      enableSmsAlerts: true,
      enableEmailReceipts: true,
      autoLateFee: true,
      lateFeeAmount: 50,
      curriculumType: 'CBSE',
    };
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem(`admin_settings_${tenantId || 'default'}`, JSON.stringify(settings));
    toast.success('⚙️ Branch settings updated successfully!');
  };

  return (
    <div className="animate-fadeIn space-y-6 max-w-4xl mx-auto">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Branch & School Configuration</h1>
          <p className="page-subtitle">Configure institution profile, academic sessions, fee rules & notification preferences</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveSettings}>
          <Save size={16} /> Save Changes
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <div className="card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Building className="text-blue-600" size={22} />
            <div>
              <h3 className="font-bold text-slate-800">Institution Identity Profile</h3>
              <p className="text-xs text-slate-500">General details printed on student ID cards, fee receipts & report cards</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">School / Institution Name *</label>
              <input
                className="form-input"
                value={settings.schoolName}
                onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Branch / Campus Name *</label>
              <input
                className="form-input"
                value={settings.branchName}
                onChange={e => setSettings({ ...settings, branchName: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Board / Affiliation No.</label>
              <input
                className="form-input"
                value={settings.affiliationNo}
                onChange={e => setSettings({ ...settings, affiliationNo: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Curriculum Framework</label>
              <select
                className="form-select"
                value={settings.curriculumType}
                onChange={e => setSettings({ ...settings, curriculumType: e.target.value })}
              >
                <option>CBSE</option>
                <option>ICSE / CISCE</option>
                <option>IB World School</option>
                <option>State Board</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Official Contact Phone</label>
              <input
                className="form-input"
                value={settings.contactPhone}
                onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Official Contact Email</label>
              <input
                className="form-input"
                value={settings.contactEmail}
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Campus Address</label>
            <input
              className="form-input"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
        </div>

        {/* Academic Session & Rules */}
        <div className="card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Settings className="text-blue-600" size={22} />
            <div>
              <h3 className="font-bold text-slate-800">Academic Session & Fee Policies</h3>
              <p className="text-xs text-slate-500">Active session year and automated financial rules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Active Academic Year</label>
              <select
                className="form-select"
                value={settings.academicSession}
                onChange={e => setSettings({ ...settings, academicSession: e.target.value })}
              >
                <option>2026-2027</option>
                <option>2027-2028</option>
              </select>
            </div>
            <div>
              <label className="form-label">Auto Late Fee Calculation</label>
              <select
                className="form-select"
                value={settings.autoLateFee ? 'enabled' : 'disabled'}
                onChange={e => setSettings({ ...settings, autoLateFee: e.target.value === 'enabled' })}
              >
                <option value="enabled">Enabled (Per Day Fee Penalty)</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div>
              <label className="form-label">Per Day Late Fee Penalty (₹)</label>
              <input
                className="form-input"
                type="number"
                value={settings.lateFeeAmount}
                onChange={e => setSettings({ ...settings, lateFeeAmount: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Notifications & Communications */}
        <div className="card p-6 bg-white rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Bell className="text-blue-600" size={22} />
            <div>
              <h3 className="font-bold text-slate-800">Notification & Messaging Channels</h3>
              <p className="text-xs text-slate-500">Automated SMS, Email & App push channels for parents and staff</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSmsAlerts}
                onChange={e => setSettings({ ...settings, enableSmsAlerts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Send Daily Attendance SMS to Parents</span>
                <p className="text-xs text-slate-500">Triggers an SMS alert whenever a student is marked absent or late.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableEmailReceipts}
                onChange={e => setSettings({ ...settings, enableEmailReceipts: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Instant PDF Fee Receipts via Email</span>
                <p className="text-xs text-slate-500">Automatically emails a payment receipt copy to parents upon payment clearance.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="submit" className="btn btn-primary px-6">
            <Check size={16} /> Save All Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
