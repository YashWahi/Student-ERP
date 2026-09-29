// src/features/superadmin/dashboard/components/TenantDetailDrawer.jsx
import { useNavigate } from 'react-router-dom';
import {
  Building2, Palette, Layers, LogIn, Mail, Phone, MapPin,
  Calendar, Users, ShieldAlert, X, CheckCircle2, AlertTriangle
} from 'lucide-react';
import Modal from '../../../../components/common/Modal';

const TenantDetailDrawer = ({
  tenant,
  isOpen,
  onClose,
  onTenantLogin,
  onRenew,
  onSuspend,
}) => {
  const navigate = useNavigate();
  if (!tenant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🏫 ${tenant.name}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Core Specs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>INSTITUTION CODE</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#2563EB', marginTop: 2, fontFamily: 'monospace' }}>
              {tenant.code}
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>SUBSCRIPTION PLAN</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#7C3AED', marginTop: 2 }}>
              {tenant.plan} Tier
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>STUDENT CAPACITY</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', marginTop: 2 }}>
              {tenant.students?.toLocaleString('en-IN')} Enrolled
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>MONTHLY MRR</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#16A34A', marginTop: 2 }}>
              {tenant.mrr}
            </div>
          </div>
        </div>

        {/* Details List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={15} color="#94A3B8" />
            <span>Campus Address: <strong>{tenant.location}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={15} color="#94A3B8" />
            <span>Admin Contact: <strong>{tenant.email}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={15} color="#94A3B8" />
            <span>License Renewal Date: <strong>{tenant.renewalDate}</strong> ({tenant.daysToExpiry} days remaining)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} color="#16A34A" />
            <span>Status: <strong style={{ color: tenant.status === 'Active' ? '#16A34A' : '#DC2626' }}>{tenant.status}</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            paddingTop: 14,
            borderTop: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1"
              onClick={() => {
                onClose();
                navigate('/superadmin/theme-studio');
              }}
            >
              <Palette size={13} />
              <span>Theme Studio</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm flex items-center gap-1"
              onClick={() => {
                onClose();
                navigate('/superadmin/modules');
              }}
            >
              <Layers size={13} />
              <span>Modules</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onRenew && onRenew(tenant)}
            >
              Renew License
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm flex items-center gap-1"
              onClick={() => {
                onClose();
                onTenantLogin && onTenantLogin(tenant);
              }}
            >
              <LogIn size={13} />
              <span>Open Tenant Login</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TenantDetailDrawer;
