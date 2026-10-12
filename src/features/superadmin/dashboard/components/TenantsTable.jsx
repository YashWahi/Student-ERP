// src/features/superadmin/dashboard/components/TenantsTable.jsx
import { useNavigate } from 'react-router-dom';
import {
  Search, Download, Plus, Eye, Palette, Layers,
  LogIn, UserCheck, Inbox, Building2, MoreHorizontal
} from 'lucide-react';

const TenantsTable = ({
  tenants = [],
  loading = false,
  searchTerm = '',
  setSearchTerm,
  selectedPlanFilter = 'All',
  setSelectedPlanFilter,
  selectedStatusFilter = 'All',
  setSelectedStatusFilter,
  currentPage = 1,
  setCurrentPage,
  totalPages = 1,
  totalCount = 0,
  pageSize = 5,
  onExportCSV,
  onViewTenant,
  onTenantLogin,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        marginBottom: 28,
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Header with Search & Filter Bar */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.98rem',
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Building2 size={18} color="#2563EB" />
            Institutional Tenants Roster
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Multi-tenant directory of provisioned schools, active capacity, subscriptions and governance controls
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: 210 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Search college, code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                height: 34,
                paddingLeft: 32,
                paddingRight: 10,
                fontSize: '0.8rem',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>

          {/* Plan Filter */}
          <select
            value={selectedPlanFilter}
            onChange={(e) => {
              setSelectedPlanFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: 34,
              fontSize: '0.8rem',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              color: '#334155',
              padding: '0 8px',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Plans</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => {
              setSelectedStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: 34,
              fontSize: '0.8rem',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              backgroundColor: '#F8FAFC',
              color: '#334155',
              padding: '0 8px',
              cursor: 'pointer',
            }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Trial">Trial</option>
            <option value="Suspended">Suspended</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1"
            onClick={onExportCSV}
            style={{ height: 34, fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => navigate('/superadmin/colleges/create')}
            style={{ height: 34, fontSize: '0.8rem', fontWeight: 700 }}
          >
            <Plus size={15} />
            <span>Add College</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
              <th style={{ padding: '12px 18px', fontWeight: 600 }}>Institution Name & Code</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Location</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Plan Tier</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Students</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Staff</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>MRR</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '12px 14px', fontWeight: 600 }}>Renewal</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td colSpan={9} style={{ padding: '14px 18px' }}>
                      <div className="skeleton" style={{ height: 18, width: '85%' }} />
                    </td>
                  </tr>
                ))
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '40px 18px', color: '#64748B' }}>
                  <Inbox size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, color: '#0F172A' }}>No institutional tenants found</div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 2 }}>
                    Try clearing your search query or status filter.
                  </div>
                </td>
              </tr>
            ) : (
              tenants.map((c) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{c.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 1 }}>
                      Code: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 14px', color: '#475569' }}>{c.location}</td>
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          c.plan === 'Enterprise'
                            ? '#F0FDF4'
                            : c.plan === 'Premium'
                            ? '#FAF5FF'
                            : '#EFF6FF',
                        color:
                          c.plan === 'Enterprise'
                            ? '#16A34A'
                            : c.plan === 'Premium'
                            ? '#7C3AED'
                            : '#2563EB',
                        border: `1px solid ${
                          c.plan === 'Enterprise'
                            ? '#BBF7D0'
                            : c.plan === 'Premium'
                            ? '#E9D5FF'
                            : '#BFDBFE'
                        }`,
                      }}
                    >
                      {c.plan}
                    </span>
                  </td>
                  <td style={{ padding: '14px 14px', fontWeight: 600, color: '#0F172A' }}>
                    {c.students.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 14px', color: '#64748B' }}>{c.teachers}</td>
                  <td style={{ padding: '14px 14px' }}>
                    <strong style={{ color: '#16A34A' }}>{c.mrr}</strong>
                  </td>
                  <td style={{ padding: '14px 14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          c.status === 'Active'
                            ? '#DCFCE7'
                            : c.status === 'Trial'
                            ? '#E0F2FE'
                            : '#FEE2E2',
                        color:
                          c.status === 'Active'
                            ? '#16A34A'
                            : c.status === 'Trial'
                            ? '#0284C7'
                            : '#DC2626',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 14px', fontSize: '0.76rem', color: '#64748B' }}>
                    {c.renewalDate}
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => onViewTenant && onViewTenant(c)}
                        title="View Full Profile Drawer"
                        style={{ height: 28, width: 28 }}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => navigate('/superadmin/theme-studio')}
                        title="Customize Theme & Branding"
                        style={{ height: 28, width: 28 }}
                      >
                        <Palette size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => navigate('/superadmin/modules')}
                        title="Configure Enabled Feature Modules"
                        style={{ height: 28, width: 28 }}
                      >
                        <Layers size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => onTenantLogin && onTenantLogin(c)}
                        title="Open tenant login"
                        style={{ height: 28, width: 28, color: '#2563EB' }}
                      >
                        <LogIn size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#FAFAFA',
          }}
        >
          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} institutional tenants
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              style={{ fontSize: '0.78rem', height: 28 }}
            >
              Previous
            </button>
            <span style={{ padding: '2px 8px', fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{ fontSize: '0.78rem', height: 28 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsTable;
