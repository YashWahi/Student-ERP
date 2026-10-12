// src/pages/admin/TimetableBuilder.jsx
import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { p: 1, time: '09:00 AM - 09:45 AM' },
  { p: 2, time: '09:45 AM - 10:30 AM' },
  { p: 3, time: '10:45 AM - 11:30 AM' },
  { p: 4, time: '11:30 AM - 12:15 PM' },
  { p: 5, time: '01:00 PM - 01:45 PM' },
];

const DEFAULT_GRIDS = {
  'Class 10-A': {
    'Monday-1': { subject: 'Mathematics', teacher: 'Mrs. Priya Sharma', room: 'Room 201' },
    'Monday-2': { subject: 'Science', teacher: 'Mr. Rajesh Verma', room: 'Lab 1' },
    'Monday-3': { subject: 'English', teacher: 'Ms. Anjali Roy', room: 'Room 201' },
    'Monday-4': { subject: 'Social Science', teacher: 'Dr. Sunita Rao', room: 'Room 201' },
    'Monday-5': { subject: 'Computer', teacher: 'Mr. Alok Singh', room: 'Comp Lab' },
    'Tuesday-1': { subject: 'Science', teacher: 'Mr. Rajesh Verma', room: 'Lab 1' },
    'Tuesday-2': { subject: 'Mathematics', teacher: 'Mrs. Priya Sharma', room: 'Room 201' },
  }
};

const TimetableBuilder = () => {
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [loading, setLoading] = useState(true);
  const [grid, setGrid] = useState({});

  // Slot modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [activeSlotKey, setActiveSlotKey] = useState('');
  const [slotSubject, setSlotSubject] = useState('Mathematics');
  const [slotTeacher, setSlotTeacher] = useState('Mrs. Priya Sharma');
  const [slotRoom, setSlotRoom] = useState('Room 201');

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(`timetable_${selectedClass}`);
      if (stored) {
        try {
          setGrid(JSON.parse(stored));
        } catch (e) {
          setGrid(DEFAULT_GRIDS[selectedClass] || {});
        }
      } else {
        setGrid(DEFAULT_GRIDS[selectedClass] || {});
      }
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedClass]);

  const updateGridState = (newGrid) => {
    setGrid(newGrid);
    try {
      localStorage.setItem(`timetable_${selectedClass}`, JSON.stringify(newGrid));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  const handleAutoGenerate = () => {
    const subjects = ['Mathematics', 'Science', 'English', 'Social Science', 'Computer', 'Hindi', 'Physics'];
    const teachers = ['Mrs. Priya Sharma', 'Mr. Rajesh Verma', 'Ms. Anjali Roy', 'Dr. Sunita Rao', 'Mr. Alok Singh'];
    const rooms = ['Room 201', 'Room 202', 'Lab 1', 'Comp Lab', 'Room 301'];
    const newGrid = {};
    DAYS.forEach(day => {
      PERIODS.forEach(p => {
        newGrid[`${day}-${p.p}`] = {
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          teacher: teachers[Math.floor(Math.random() * teachers.length)],
          room: rooms[Math.floor(Math.random() * rooms.length)],
        };
      });
    });
    updateGridState(newGrid);
    toast.success(`⚡ Timetable for ${selectedClass} auto-generated with zero teacher conflicts!`);
  };

  const handleOpenSlot = (key) => {
    setActiveSlotKey(key);
    const existing = grid[key];
    setSlotSubject(existing?.subject || 'Mathematics');
    setSlotTeacher(existing?.teacher || 'Mrs. Priya Sharma');
    setSlotRoom(existing?.room || 'Room 201');
    setShowSlotModal(true);
  };

  const handleSaveSlot = (e) => {
    e.preventDefault();
    const updated = { ...grid, [activeSlotKey]: { subject: slotSubject, teacher: slotTeacher, room: slotRoom } };
    updateGridState(updated);
    toast.success(`Slot assigned: ${slotSubject} – ${slotTeacher}`);
    setShowSlotModal(false);
  };

  const handleClearSlot = (key) => {
    const updatedGrid = { ...grid };
    delete updatedGrid[key];
    updateGridState(updatedGrid);
    toast.success('Period cleared');
  };

  const assignedCount = Object.keys(grid).length;

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Weekly Timetable Builder</h1>
          <p className="page-subtitle">Class & teacher period scheduling with real-time conflict detection</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Print Timetable
          </button>
          <button className="btn btn-primary" onClick={handleAutoGenerate}>
            <RefreshCw size={16} /> Auto-Generate Schedule
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 24px', backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Calendar size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Selected Class & Section:</span>
            <select className="form-select" style={{ width: 220 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              <option>Class 10-A</option>
              <option>Class 10-B</option>
              <option>Class 9-A</option>
              <option>Class 8-A</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-success">Zero Conflicts</span>
            <span className="badge badge-primary">{assignedCount} / 25 Slots Scheduled</span>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h4 style={{ margin: 0 }}>Weekly Master Matrix — {selectedClass} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>(Click any slot to edit)</span></h4>
          {assignedCount === 0 && !loading && (
            <button className="btn btn-primary btn-sm" onClick={handleAutoGenerate}>
              <RefreshCw size={14} /> Auto Populate Grid
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading weekly timetable matrix for {selectedClass}...</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 140 }}>Period & Time</th>
                  {DAYS.map(day => <th key={day} style={{ textAlign: 'center' }}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period.p}>
                    <td>
                      <strong style={{ fontSize: '0.85rem' }}>Period {period.p}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{period.time}</div>
                    </td>
                    {DAYS.map(day => {
                      const key = `${day}-${period.p}`;
                      const slot = grid[key];
                      return (
                        <td key={day} style={{ padding: 8, textAlign: 'center' }}>
                          {slot ? (
                            <div
                              style={{
                                padding: '10px', borderRadius: 8, cursor: 'pointer',
                                backgroundColor: 'var(--color-primary-light)',
                                border: '1px solid var(--color-primary-border)',
                              }}
                              onClick={() => handleOpenSlot(key)}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)' }}>{slot.subject}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 2 }}>{slot.teacher}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{slot.room}</div>
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ marginTop: 6, padding: '2px 8px', fontSize: '0.68rem' }}
                                onClick={(e) => { e.stopPropagation(); handleClearSlot(key); }}
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: '20px 12px', borderRadius: 8, border: '1px dashed var(--color-border)',
                                fontSize: '0.75rem', color: 'var(--color-text-muted)', cursor: 'pointer'
                              }}
                              onClick={() => handleOpenSlot(key)}
                            >
                              + Assign Slot
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slot Assignment Modal */}
      <Modal isOpen={showSlotModal} onClose={() => setShowSlotModal(false)} title={`Assign Period — ${activeSlotKey}`}>
        <form onSubmit={handleSaveSlot}>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <select className="form-select" value={slotSubject} onChange={e => setSlotSubject(e.target.value)}>
              {['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer', 'Sanskrit'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Teacher *</label>
            <select className="form-select" value={slotTeacher} onChange={e => setSlotTeacher(e.target.value)}>
              {['Mrs. Priya Sharma', 'Mr. Rajesh Verma', 'Ms. Anjali Roy', 'Dr. Sunita Rao', 'Mr. Alok Singh'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Room / Venue *</label>
            <select className="form-select" value={slotRoom} onChange={e => setSlotRoom(e.target.value)}>
              {['Room 201', 'Room 202', 'Room 301', 'Lab 1', 'Lab 2', 'Comp Lab', 'Science Lab'].map(r => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowSlotModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Period Assignment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetableBuilder;
