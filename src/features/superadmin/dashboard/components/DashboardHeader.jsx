// src/features/superadmin/dashboard/components/DashboardHeader.jsx
import { useNavigate } from 'react-router-dom';
import {
  Plus, Megaphone, LifeBuoy, Palette, Sliders, RefreshCcw, ShieldCheck
} from 'lucide-react';

const DashboardHeader = ({
  onOpenBroadcast,
  onOpenSupport,
  onOpenCustomize,
  onRefresh,
  loading = false,
  openTicketCount = 0,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: '1px solid #E2E8F0',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            SuperAdmin Multi-Tenant Control Center
          </h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                display: 'inline-block',
              }}
            />
            Enterprise SaaS Engine
          </span>
        </div>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: '0.86rem',
            color: '#64748B',
            lineHeight: 1.5,
          }}
        >
          Monitor institutions, subscriptions, users, revenue, platform health and support operations.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onRefresh}
          className="btn btn-ghost btn-sm"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}
          title="Refresh live data"
          disabled={loading}
        >
          <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
        </button>

        <button
          type="button"
          onClick={onOpenCustomize}
          className="btn btn-ghost btn-sm flex items-center gap-2"
          style={{ height: 38, padding: '0 12px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}
          title="Configure visible widgets"
        >
          <Sliders size={15} />
          <span>Customize</span>
        </button>

        <button
          type="button"
          onClick={onOpenSupport}
          className="btn btn-secondary btn-sm flex items-center gap-2"
          style={{ height: 38, padding: '0 14px', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <LifeBuoy size={15} />
          <span>Support Inbox</span>
          {openTicketCount > 0 && (
            <span
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: 10,
                padding: '1px 6px',
                fontSize: '0.7rem',
                fontWeight: 700,
              }}
            >
              {openTicketCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenBroadcast}
          className="btn btn-secondary btn-sm flex items-center gap-2"
          style={{ height: 38, padding: '0 14px', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <Megaphone size={15} />
          <span>Global Announcement</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/superadmin/theme-studio')}
          className="btn btn-secondary btn-sm flex items-center gap-2"
          style={{ height: 38, padding: '0 14px', fontSize: '0.82rem', fontWeight: 600 }}
        >
          <Palette size={15} />
          <span>Theme Studio</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/superadmin/colleges/create')}
          className="btn btn-primary btn-sm flex items-center gap-2"
          style={{ height: 38, padding: '0 16px', fontSize: '0.84rem', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Create Institution</span>
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
