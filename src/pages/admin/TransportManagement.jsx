// src/pages/admin/TransportManagement.jsx
import { useState } from 'react';
import { Truck, MapPin, Users, Plus, Download, Phone, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../services/exportService';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';

const MOCK_ROUTES = [
  { id: '1', routeName: 'Route 101 — Noida Sector 62 to Main Campus', busNo: 'UP-16-AB-1234', driver: 'Ram Singh', driverPhone: '+91 9988776655', stops: 8, students: 45, fee: 3500, status: 'Active' },
  { id: '2', routeName: 'Route 102 — Indirapuram to Main Campus', busNo: 'UP-14-CD-5678', driver: 'Suresh Kumar', driverPhone: '+91 9988776644', stops: 6, students: 38, fee: 3200, status: 'Active' },
  { id: '3', routeName: 'Route 103 — Greater Noida West Route', busNo: 'UP-16-EF-9012', driver: 'Vikram Pal', driverPhone: '+91 9988776633', stops: 10, students: 52, fee: 4000, status: 'Active' },
];

const TransportManagement = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [routes, setRoutes] = useState(() => {
    const saved = localStorage.getItem(`transport_routes_${currentTenant}`);
    if (saved) return JSON.parse(saved);
    return isCustomCollege ? [] : MOCK_ROUTES;
  });

  const [showModal, setShowModal] = useState(false);

  const [routeName, setRouteName] = useState('');
  const [busNo, setBusNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [routeFee, setRouteFee] = useState('3500');

  const updateRoutesState = (newRoutes) => {
    setRoutes(newRoutes);
    localStorage.setItem(`transport_routes_${currentTenant}`, JSON.stringify(newRoutes));
  };

  const handleAddRoute = (e) => {
    e.preventDefault();
    const newRoute = {
      id: `rt_${Date.now()}`,
      routeName,
      busNo,
      driver: driverName,
      driverPhone,
      stops: 5,
      students: 0,
      fee: parseInt(routeFee) || 3500,
      status: 'Active',
    };
    updateRoutesState([...routes, newRoute]);
    toast.success(`🚌 Route "${routeName}" added successfully!`);
    setShowModal(false);
    setRouteName(''); setBusNo(''); setDriverName(''); setDriverPhone(''); setRouteFee('3500');
  };

  const handleClearRoutes = () => {
    updateRoutesState([]);
    toast.success('Cleared transport routes dataset');
  };

  const columns = [
    { key: 'routeName', label: 'Route Name & Path', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Bus: {r.busNo}</span></div> },
    { key: 'driver', label: 'Driver Details', render: (v, r) => <div><div>{v}</div><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{r.driverPhone}</span></div> },
    { key: 'stops', label: 'Stops', render: (v) => <span>{v} stops</span> },
    { key: 'students', label: 'Assigned Students', render: (v) => <span className="badge badge-primary">{v} Students</span> },
    { key: 'fee', label: 'Monthly Transport Fee', render: (v) => <strong style={{ color: 'var(--color-primary)' }}>₹{v.toLocaleString('en-IN')}/mo</strong> },
    { key: 'status', label: 'Status', render: (v) => <span className="badge badge-success">{v}</span> },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Transport & Fleet Management</h1>
          <p className="page-subtitle">Configure school bus routes, driver assignments, stop points & student transport fees</p>
        </div>
        <div className="flex gap-3">
          {routes.length > 0 && (
            <button className="btn btn-ghost btn-sm" style={{ color: '#DC2626' }} onClick={handleClearRoutes} title="Clear All Routes">
              <Trash2 size={16} /> Clear Routes
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => exportToCSV('Transport_Routes', routes, columns)}>
            <Download size={16} /> Export Routes CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Bus Route / Vehicle
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={routes}
        title="Active School Transport Routes & Fleet"
        searchPlaceholder="Search route, bus number, driver..."
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Bus Route & Vehicle">
        <form onSubmit={handleAddRoute}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Route Name *</label>
              <input className="form-input" placeholder="e.g. Route 104 — Vaishali Campus" value={routeName} onChange={e => setRouteName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Bus Number *</label>
              <input className="form-input" placeholder="UP-16-XX-0000" value={busNo} onChange={e => setBusNo(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Driver Name *</label>
              <input className="form-input" placeholder="Driver Full Name" value={driverName} onChange={e => setDriverName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Driver Contact Phone *</label>
              <input className="form-input" placeholder="+91 99887 76655" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} required />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Monthly Fee (₹) *</label>
              <input className="form-input" type="number" value={routeFee} onChange={e => setRouteFee(e.target.value)} required />
            </div>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Route</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransportManagement;
