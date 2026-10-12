// src/pages/admin/HostelManagement.jsx
import { useState } from 'react';
import { Building, Plus, Users, Download, Shield, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../services/exportService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_ROOMS = [
  { id: '1', hostelName: 'Boys Hostel Block A', roomNo: 'A-101', floor: '1st Floor', totalBeds: 3, occupiedBeds: 3, fee: 85000, warden: 'Mr. Rajesh Verma', status: 'Full' },
  { id: '2', hostelName: 'Boys Hostel Block A', roomNo: 'A-102', floor: '1st Floor', totalBeds: 3, occupiedBeds: 2, fee: 85000, warden: 'Mr. Rajesh Verma', status: 'Available' },
  { id: '3', hostelName: 'Girls Hostel Block B', roomNo: 'B-201', floor: '2nd Floor', totalBeds: 2, occupiedBeds: 1, fee: 95000, warden: 'Mrs. Sunita Rao', status: 'Available' },
];

const HostelManagement = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(`hostel_rooms_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return isCustomCollege ? [] : MOCK_ROOMS;
  });

  const [showModal, setShowModal] = useState(false);
  const [hostelBlock, setHostelBlock] = useState('Boys Hostel Block A');
  const [roomNo, setRoomNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [annualFee, setAnnualFee] = useState('85000');

  const updateRoomsState = (newRooms) => {
    setRooms(newRooms);
    try {
      localStorage.setItem(`hostel_rooms_${currentTenant}`, JSON.stringify(newRooms));
    } catch {}
  };

  const handleAllocateBed = (e) => {
    e.preventDefault();
    if (!roomNo.trim()) return;
    const newRoom = {
      id: `rm_${Date.now()}`,
      hostelName: hostelBlock,
      roomNo,
      floor: '1st Floor',
      totalBeds: 3,
      occupiedBeds: 1,
      fee: parseInt(annualFee) || 85000,
      warden: hostelBlock.includes('Boys') ? 'Mr. Rajesh Verma' : 'Mrs. Sunita Rao',
      status: 'Available',
    };
    updateRoomsState([...rooms, newRoom]);
    toast.success(`🏠 Room ${roomNo} registered and allocated to ${studentName || 'Student'}!`);
    setShowModal(false);
    setRoomNo(''); setStudentName('');
  };

  const handleDeleteRoom = (id) => {
    updateRoomsState(rooms.filter(r => r.id !== id));
    toast.success('Room record removed');
  };

  const columns = [
    { key: 'roomNo', label: 'Room & Building', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.hostelName} · {r.floor}</span></div> },
    { key: 'warden', label: 'Hostel Warden' },
    { key: 'occupiedBeds', label: 'Bed Occupancy', render: (v, r) => <span><strong>{v}</strong> / {r.totalBeds} beds</span> },
    { key: 'fee', label: 'Annual Hostel Fee', render: (v) => <strong style={{ color: 'var(--color-primary)' }}>₹{v.toLocaleString('en-IN')}/yr</strong> },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge ${v === 'Available' ? 'badge-success' : 'badge-warning'}`}>{v}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={() => handleDeleteRoom(r.id)} title="Delete room">
          <Trash2 size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Hostel & Dormitory Management</h1>
          <p className="page-subtitle">Manage student residence blocks, bed allocations, warden assignments & hostel fees</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Hostel_Rooms', rooms, columns)}>
            <Download size={16} /> Export Hostel CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Allocate Room / Bed
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rooms}
        searchPlaceholder="Search by room number, hostel block or warden..."
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Allocate Bed & Register Room">
        <form onSubmit={handleAllocateBed}>
          <div className="form-group">
            <label className="form-label">Hostel Building / Block</label>
            <select className="form-select" value={hostelBlock} onChange={e => setHostelBlock(e.target.value)}>
              <option value="Boys Hostel Block A">Boys Hostel Block A (Senior Campus)</option>
              <option value="Girls Hostel Block B">Girls Hostel Block B (West Wing)</option>
              <option value="Junior Hostel Block C">Junior Hostel Block C</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Room Number *</label>
              <input className="form-input" required placeholder="e.g. A-204" value={roomNo} onChange={e => setRoomNo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Annual Hostel Fee (₹)</label>
              <input className="form-input" type="number" value={annualFee} onChange={e => setAnnualFee(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Student Name / Roll Number</label>
            <input className="form-input" placeholder="e.g. Arjun Verma (GV-2026-001)" value={studentName} onChange={e => setStudentName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Allocation</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HostelManagement;
