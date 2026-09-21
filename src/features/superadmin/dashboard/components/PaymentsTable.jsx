// src/features/superadmin/dashboard/components/PaymentsTable.jsx
import { useNavigate } from 'react-router-dom';
import { CreditCard, FileText, ExternalLink, Inbox } from 'lucide-react';

const PaymentsTable = ({
  payments = [],
  loading = false,
  onViewInvoice,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
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
            <CreditCard size={18} color="#2563EB" />
            Recent Billing Transactions
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
            Processed SaaS subscriptions, renewals and automated invoice receipts
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm flex items-center gap-1"
          onClick={() => navigate('/superadmin/subscriptions')}
          style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}
        >
          <span>All Invoices</span>
          <ExternalLink size={12} />
        </button>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textAlign: 'left' }}>
              <th style={{ padding: '10px 16px', fontWeight: 600 }}>Institution & Invoice</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Plan Tier</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Method</th>
              <th style={{ padding: '10px 14px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td colSpan={6} style={{ padding: '12px 16px' }}>
                      <div className="skeleton" style={{ height: 16, width: '80%' }} />
                    </td>
                  </tr>
                ))
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                  <Inbox size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                  No payment transaction records found in Firestore.
                </td>
              </tr>
            ) : (
              payments.slice(0, 5).map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid #F1F5F9',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <strong style={{ color: '#0F172A' }}>{p.college}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {p.invoiceId} • {p.date}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#475569' }}>{p.plan}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <strong style={{ color: '#0F172A' }}>{p.amount}</strong>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: '#64748B' }}>
                    {p.paymentMethod}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          p.status === 'Success'
                            ? '#DCFCE7'
                            : p.status === 'Failed'
                            ? '#FEE2E2'
                            : '#FEF3C7',
                        color:
                          p.status === 'Success'
                            ? '#16A34A'
                            : p.status === 'Failed'
                            ? '#DC2626'
                            : '#D97706',
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => onViewInvoice && onViewInvoice(p)}
                      style={{ padding: '3px 8px', fontSize: '0.72rem', height: 26 }}
                      title="View printable invoice receipt"
                    >
                      <FileText size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTable;
