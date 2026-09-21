// src/features/superadmin/dashboard/components/BroadcastModal.jsx
import { useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import Modal from '../../../../components/common/Modal';
import toast from 'react-hot-toast';

const BroadcastModal = ({
  isOpen,
  onClose,
  onSendBroadcast,
  tenantsCount = 0,
}) => {
  const [target, setTarget] = useState('All');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgent, setUrgent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter announcement title and message content');
      return;
    }
    onSendBroadcast({ title, message, target, urgent });
    setTitle('');
    setMessage('');
    setUrgent(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📢 Dispatch Global SaaS Announcement"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>
            Target Institution Group
          </label>
          <select
            className="form-select"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            style={{ fontSize: '0.84rem' }}
          >
            <option value="All">All Institutions ({tenantsCount} tenants)</option>
            <option value="Enterprise">Enterprise Tier Only</option>
            <option value="Premium">Premium Tier Only</option>
            <option value="Standard">Standard Tier Only</option>
            <option value="Trial">Trial Institutions Only</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>
            Announcement Title
          </label>
          <input
            className="form-input"
            placeholder="e.g. Scheduled System Upgrade Notice — 20 Aug 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ fontSize: '0.84rem' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A' }}>
            Announcement Content
          </label>
          <textarea
            className="form-input"
            rows={4}
            placeholder="Enter announcement description for school principals, admins, and faculty..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            style={{ fontSize: '0.84rem', resize: 'vertical' }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
          }}
        >
          <input
            type="checkbox"
            id="urgentPriorityCheck"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label
            htmlFor="urgentPriorityCheck"
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#DC2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              margin: 0,
            }}
          >
            <AlertTriangle size={14} />
            Display as High-Priority Urgent Banner on School Login Pages
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary flex items-center gap-2">
            <Send size={15} />
            <span>Send Announcement</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BroadcastModal;
