// src/pages/superadmin/ModuleControl.jsx
import { useState, useEffect } from 'react';
import { ALL_MODULES } from '../../hooks/usePermissions';
import { Building, Check, X, Save, Shield, Layers, Inbox } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { getColleges, updateCollegeTenant } from '../../services/tenantService';
import { logAuditEvent } from '../../services/auditService';
import toast from 'react-hot-toast';

const ModuleControl = () => {
  const [tenantsList, setTenantsList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [modulesState, setModulesState] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchTenants = async () => {
      setLoading(true);
      try {
        const real = await getColleges();
        if (real.length > 0) {
          const mapped = real.map(t => ({ id: t.tenantId || t.id, name: t.name }));
          setTenantsList(mapped);
          setSelectedTenantId(prev => (prev && mapped.some(r => r.id === prev)) ? prev : mapped[0].id);
        } else {
          setTenantsList([]);
          setSelectedTenantId('');
        }
      } catch (err) {
        console.warn('Error loading tenants in ModuleControl:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    const loadModules = async () => {
      setLoading(true);
      try {
        let snap = await getDoc(doc(db, 'tenants', selectedTenantId));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, 'schools', selectedTenantId));
        }
        if (snap.exists() && snap.data().enabledModules) {
          setModulesState(snap.data().enabledModules);
        } else {
          const defaults = {};
          ALL_MODULES.forEach(m => { defaults[m.id] = m.defaultEnabled; });
          setModulesState(defaults);
        }
      } catch (err) {
        const defaults = {};
        ALL_MODULES.forEach(m => { defaults[m.id] = m.defaultEnabled; });
        setModulesState(defaults);
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, [selectedTenantId]);

  const toggleModule = (id) => {
    setModulesState(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSaveModules = async () => {
    if (!selectedTenantId) {
      toast.error('No college tenant selected');
      return;
    }
    setSaving(true);
    try {
      await updateCollegeTenant(selectedTenantId, { enabledModules: modulesState });
      const targetObj = tenantsList.find(t => t.id === selectedTenantId);
      const enabledList = Object.keys(modulesState).filter(k => modulesState[k]).join(', ');
      await logAuditEvent({
        action: 'MODULE_TOGGLE',
        actor: 'Super Admin',
        target: targetObj?.name || selectedTenantId,
        details: `Updated enabled modules matrix: [${enabledList}]`,
        tenantId: selectedTenantId,
      });
      toast.success('✅ College feature modules updated successfully!');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Tenant Module & Feature Control</h1>
          <p className="page-subtitle">Enable or disable specific ERP modules per institution</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveModules} disabled={saving || !selectedTenantId}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Feature Matrix'}
        </button>
      </div>

      {/* College Picker */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center gap-4">
          <Building size={20} color="var(--color-primary)" />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select College:</span>
          {loading && tenantsList.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Loading colleges...</span>
          ) : tenantsList.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No college tenants found in Firestore</span>
          ) : (
            <select
              className="form-select"
              style={{ width: 280, backgroundColor: 'white' }}
              value={selectedTenantId}
              onChange={e => setSelectedTenantId(e.target.value)}
            >
              {tenantsList.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <span className="badge badge-info">Multi-Tenant Scoped</span>
        </div>
      </div>

      {/* Empty State or Module Matrix Grid */}
      {!loading && tenantsList.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 8px' }}>No Institution Tenants Found</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Provision a new institution tenant to configure its feature module entitlement matrix.
          </p>
        </div>
      ) : (
        <div className="grid-3" style={{ gap: 20 }}>
          {ALL_MODULES.map(m => {
            const isEnabled = modulesState[m.id] !== false;
            return (
              <div
                key={m.id}
                className="card"
                style={{
                  padding: '20px',
                  border: `2px solid ${isEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: isEnabled ? 'var(--color-bg-surface)' : 'var(--color-bg-primary)',
                  transition: 'var(--transition-fast)',
                }}
              >
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{m.label}</div>
                  </div>
                  <span className={`badge ${isEnabled ? 'badge-success' : 'badge-neutral'}`}>
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                  {isEnabled ? 'This module is visible in navigation & accessible to role routes.' : 'Module disabled. Disappears from sidebar, dashboard, and permissions.'}
                </p>

                <button
                  className={`btn btn-sm w-full ${isEnabled ? 'btn-danger' : 'btn-primary'}`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => toggleModule(m.id)}
                  disabled={!selectedTenantId}
                >
                  {isEnabled ? <X size={14} /> : <Check size={14} />}
                  {isEnabled ? 'Disable Module' : 'Enable Module'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleControl;

