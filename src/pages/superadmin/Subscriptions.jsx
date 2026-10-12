// src/pages/superadmin/Subscriptions.jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CreditCard, Download, Plus, CheckCircle, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { initiatePlatformSubscriptionCheckout } from '../../services/razorpayService';
import { exportToCSV } from '../../services/exportService';
import { logAuditEvent } from '../../services/auditService';
import { getSubscriptions, createSubscriptionRecord } from '../../services/tenantService';
import toast from 'react-hot-toast';

const Subscriptions = () => {
  const location = useLocation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(location.pathname.includes('/expiring') ? 'expiring' : 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSub, setNewSub] = useState({
    college: '',
    plan: 'Standard',
    amount: 24000,
    expiryDate: '2027-08-31',
  });

  const loadSubscriptionsData = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.warn('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.pathname.includes('/expiring')) {
      setActiveTab('expiring');
    }
    loadSubscriptionsData();
  }, [location.pathname]);

  const handleRenewSubscription = async (sub) => {
    await initiatePlatformSubscriptionCheckout({
      // Stable authoritative identifier: the backend loads subscriptions/{subId},
      // derives the plan amount server-side, verifies, and renews server-side.
      // Display args below are UI text only — never trusted for amounts/identity.
      subId: sub.id || sub.subId,
      tenantId: sub.college.toLowerCase().replace(/\s+/g, '_'),
      collegeName: sub.college,
      planTier: sub.plan,
      amount: sub.amount,
      adminEmail: 'admin@college.edu',
      onSuccess: async (res) => {
        // Renewal was already performed + verified server-side. The client only
        // refreshes its view — it never writes the renewal itself.
        toast.success(`🎉 Subscription Renewed for ${sub.college}! Txn: ${res.paymentId}`);
        loadSubscriptionsData();
      },
      onFailure: () => {
        toast.error('Renewal checkout cancelled');
      }
    });
  };

  const handleCreateManualSubscription = async (e) => {
    e.preventDefault();
    if (!newSub.college.trim()) {
      toast.error('Please provide institution name');
      return;
    }
    const created = await createSubscriptionRecord({
      college: newSub.college,
      plan: newSub.plan,
      amount: Number(newSub.amount),
      expiryDate: newSub.expiryDate,
    });
    toast.success(`💳 Subscription Record Issued for ${newSub.college}!`);
    setIsAddModalOpen(false);
    setNewSub({ college: '', plan: 'Standard', amount: 24000, expiryDate: '2027-08-31' });
    loadSubscriptionsData();
  };

  const filteredData = subscriptions.filter(s => {
    if (activeTab === 'expiring' && s.status !== 'Expiring Soon' && s.status !== 'Expiring') return false;
    return true;
  });

  const expiringCount = subscriptions.filter(s => s.status === 'Expiring Soon' || s.status === 'Expiring').length;

  const columns = [
    { key: 'college', label: 'Institution Name', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>ID: {r.id || r.subId}</span></div> },
    { key: 'plan', label: 'Plan Tier', render: (v) => <span className="badge badge-primary">{v}</span> },
    { key: 'amount', label: 'Annual Billing', render: (v) => <strong style={{ color: 'var(--color-success)' }}>₹{typeof v === 'number' ? v.toLocaleString('en-IN') : v}/yr</strong> },
    { key: 'expiryDate', label: 'Renewal Expiry Date' },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span className={`badge ${v === 'Active' ? 'badge-success' : 'badge-warning'}`}>
          {v}
        </span>
      )
    },
    {
      key: 'id', label: 'Action', sortable: false,
      render: (_, row) => (
        <button className="btn btn-primary btn-sm" onClick={() => handleRenewSubscription(row)}>
          <RefreshCw size={14} /> Renew via Razorpay
        </button>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">SaaS Platform Subscription Ledger</h1>
          <p className="page-subtitle">Track active college subscriptions, billing cycles, renewals & Razorpay test billing</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Subscriptions_Ledger', filteredData, columns)}>
            <Download size={16} /> Export Ledger CSV
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add Subscription Record
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: 24, padding: '10px 16px', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex gap-3">
          <button className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('all')}>
            All Subscriptions ({subscriptions.length})
          </button>
          <button className={`btn ${activeTab === 'expiring' ? 'btn-warning' : 'btn-ghost'}`} onClick={() => setActiveTab('expiring')}>
            ⚠️ Expiring Soon ({expiringCount})
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        title="Institution Subscriptions & Billing Status"
        searchPlaceholder="Search by college name, plan tier..."
        loading={loading}
        emptyText="No subscription records found in Firestore ('subscriptions')"
      />

      {/* Manual Subscription Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Issue / Manual Subscription Record"
      >
        <form onSubmit={handleCreateManualSubscription}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Institution / College Name *</label>
            <input
              className="form-input"
              placeholder="e.g. St. Xavier High School"
              value={newSub.college}
              onChange={e => setNewSub({ ...newSub, college: e.target.value })}
              required
            />
          </div>

          <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Subscription Plan Tier</label>
              <select
                className="form-select"
                value={newSub.plan}
                onChange={e => {
                  const plan = e.target.value;
                  const amount = plan === 'Enterprise' ? 120000 : plan === 'Premium' ? 48000 : plan === 'Standard' ? 24000 : 12000;
                  setNewSub({ ...newSub, plan, amount });
                }}
              >
                <option value="Basic">Basic (₹12,000)</option>
                <option value="Standard">Standard (₹24,000)</option>
                <option value="Premium">Premium (₹48,000)</option>
                <option value="Enterprise">Enterprise (₹1,20,000)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Annual Billing Amount (₹)</label>
              <input
                className="form-input"
                type="number"
                value={newSub.amount}
                onChange={e => setNewSub({ ...newSub, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Expiry / Renewal Date</label>
            <input
              className="form-input"
              type="date"
              value={newSub.expiryDate}
              onChange={e => setNewSub({ ...newSub, expiryDate: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Subscription Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subscriptions;

