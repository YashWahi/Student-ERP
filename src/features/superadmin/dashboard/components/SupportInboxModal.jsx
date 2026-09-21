// src/features/superadmin/dashboard/components/SupportInboxModal.jsx
import { useState } from 'react';
import { LifeBuoy, Check, Plus, AlertCircle, Clock } from 'lucide-react';
import Modal from '../../../../components/common/Modal';

const SupportInboxModal = ({
  isOpen,
  onClose,
  tickets = [],
  onResolveTicket,
  onCreateTicket,
}) => {
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [school, setSchool] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!school.trim() || !subject.trim()) return;
    onCreateTicket({
      id: `tck_${Date.now()}`,
      school,
      subject,
      priority,
      status: 'Open',
      date: 'Just now',
    });
    setSchool('');
    setSubject('');
    setShowNewTicketForm(false);
  };

  const openCount = tickets.filter((t) => t.status !== 'Resolved').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🛟 Multi-Tenant Institutional Support Desk"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: 10,
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#64748B' }}>
            Open / Pending Tickets: <strong style={{ color: '#0F172A' }}>{openCount}</strong>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm flex items-center gap-1"
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            style={{ fontSize: '0.78rem' }}
          >
            <Plus size={13} />
            <span>{showNewTicketForm ? 'View Tickets' : 'New Ticket'}</span>
          </button>
        </div>

        {showNewTicketForm ? (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                School / College Name
              </label>
              <input
                className="form-input"
                placeholder="e.g. Modern Public School"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                required
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Subject / Issue Description
              </label>
              <input
                className="form-input"
                placeholder="e.g. SMS Gateway Template Approval Request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                style={{ fontSize: '0.82rem' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Priority Level
              </label>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{ fontSize: '0.82rem' }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNewTicketForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Create Support Ticket
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>
                No active support tickets in the queue.
              </div>
            ) : (
              tickets.map((ticket) => {
                const isResolved = ticket.status === 'Resolved';
                return (
                  <div
                    key={ticket.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      backgroundColor: isResolved ? '#F8FAFC' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              ticket.priority === 'Urgent'
                                ? '#FEE2E2'
                                : ticket.priority === 'High'
                                ? '#FEF3C7'
                                : '#EFF6FF',
                            color:
                              ticket.priority === 'Urgent'
                                ? '#DC2626'
                                : ticket.priority === 'High'
                                ? '#D97706'
                                : '#2563EB',
                          }}
                        >
                          {ticket.priority}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#0F172A' }}>
                          {ticket.school}
                        </span>
                      </div>

                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: isResolved ? '#DCFCE7' : '#EFF6FF',
                          color: isResolved ? '#16A34A' : '#2563EB',
                        }}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      {ticket.subject}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{ticket.date}</span>
                      {!isResolved && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm flex items-center gap-1"
                          onClick={() => onResolveTicket(ticket.id)}
                          style={{ padding: '2px 8px', fontSize: '0.72rem', height: 24 }}
                        >
                          <Check size={12} />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SupportInboxModal;
