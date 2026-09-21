// src/components/common/ConfirmDialog.jsx
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Destructive Action',
  message = 'Are you sure you want to perform this action? This operation cannot be reversed.',
  affectedRecords = null,
  confirmLabel = 'Confirm Delete',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          backgroundColor: variant === 'danger' ? '#FEF2F2' : '#EFF6FF',
          color: variant === 'danger' ? '#DC2626' : '#2563EB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {message}
          </p>
          {affectedRecords && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)', fontSize: '0.8rem', color: 'var(--color-text-primary)',
              fontWeight: 600
            }}>
              ⚠️ Affected Records: {affectedRecords}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
