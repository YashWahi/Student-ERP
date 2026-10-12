// src/features/superadmin/dashboard/components/InvoiceDetailModal.jsx
import Modal from '../../../../components/common/Modal';
import { FileText, Printer, CheckCircle2, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceDetailModal = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
    toast.success('Dispatched to printer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`🧾 Invoice Receipt: ${invoice.invoiceId}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: '0.84rem' }}>
        <div
          style={{
            padding: 16,
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>BILLED TO</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginTop: 2 }}>
              {invoice.college}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 1 }}>
              Plan Tier: <strong>{invoice.plan}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>TOTAL AMOUNT</div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#16A34A', marginTop: 2 }}>
              {invoice.amount}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>
              Status: {invoice.status}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: '#475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Transaction Hash / Ref:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{invoice.txHash}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Payment Method:</span>
            <strong>{invoice.paymentMethod}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Transaction Date:</span>
            <span>{invoice.date}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={handlePrint}
          >
            <Printer size={14} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailModal;
