import { useState, useEffect } from 'react';
import { Check, X, Clock, Save, UserCheck } from 'lucide-react';
import { markClassAttendance } from '../../services/teacherService';
import { useAuthStore } from '../../store/authStore';
import { useStudentStore } from '../../store/studentStore';
import toast from 'react-hot-toast';

const MOCK_CLASS_STUDENTS = [
  { id: '1', rollNo: 'GV-2026-001', name: 'Arjun Verma', status: 'Present' },
  { id: '2', rollNo: 'GV-2026-002', name: 'Rohan Sharma', status: 'Present' },
  { id: '3', rollNo: 'GV-2026-003', name: 'Ananya Gupta', status: 'Absent' },
  { id: '4', rollNo: 'GV-2026-004', name: 'Kabir Verma', status: 'Late' },
  { id: '5', rollNo: 'GV-2026-005', name: 'Siddharth Roy', status: 'Present' },
];

const MarkAttendance = () => {
  const { user, userProfile, tenantId: activeTenantId, branchId: activeBranchId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const currentBranch = userProfile?.branchId || activeBranchId || 'branch_main';
  const currentTeacherId = userProfile?.id || user?.uid || 'teacher_active';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const { students: storeStudents } = useStudentStore();
  const [selectedClass, setSelectedClass] = useState('Class 10-A');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const collegeStudents = isCustomCollege
      ? storeStudents.filter(s => s.tenantId === currentTenant)
      : storeStudents;

    const classNum = selectedClass.replace('Class ', '').trim();
    const matched = collegeStudents.filter(s => {
      const sClass = (s.class || '').replace('Class ', '').trim();
      return sClass === classNum || s.class === selectedClass;
    });

    if (matched.length > 0) {
      setStudents(matched.map(s => ({
        id: s.id,
        rollNo: s.rollNo,
        name: s.name,
        status: s.status === 'Absent' ? 'Absent' : s.status === 'Late' ? 'Late' : 'Present'
      })));
    } else {
      setStudents(isCustomCollege ? [] : MOCK_CLASS_STUDENTS);
    }
  }, [selectedClass, storeStudents, currentTenant, isCustomCollege]);

  const toggleStatus = (id, newStatus) => {
    setStudents(students.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleSaveAttendance = async () => {
    await markClassAttendance({
      tenantId: currentTenant,
      branchId: currentBranch,
      classId: selectedClass,
      date: new Date().toISOString().split('T')[0],
      teacherId: currentTeacherId,
      records: students,
    });
    toast.success(`✅ Attendance for ${selectedClass} saved & synced to Firebase!`);
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mark Daily Attendance</h1>
          <p className="page-subtitle">Select class and toggle attendance for today ({new Date().toLocaleDateString('en-IN')})</p>
        </div>
        <button className="btn btn-primary" onClick={handleSaveAttendance}>
          <Save size={16} /> Submit Attendance
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div className="flex items-center gap-4">
          <label className="form-label" style={{ margin: 0 }}>Select Class:</label>
          <select className="form-select" style={{ width: 180 }} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option>Class 10-A</option>
            <option>Class 10-B</option>
            <option>Class 9-A</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h4 style={{ margin: 0 }}>Student Roster — {selectedClass}</h4>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setStudents(students.map(s => ({ ...s, status: 'Present' })))}>
              Mark All Present
            </button>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Roll No</th>
                <th>Student Name</th>
                <th style={{ textAlign: 'center' }}>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.rollNo}</strong></td>
                  <td>{s.name}</td>
                  <td>
                    <div className="flex justify-center gap-2">
                      {['Present', 'Absent', 'Late'].map(st => (
                        <button
                          key={st}
                          className={`btn btn-sm ${s.status === st ? (st === 'Present' ? 'btn-primary' : st === 'Absent' ? 'btn-danger' : 'btn-secondary') : 'btn-ghost'}`}
                          onClick={() => toggleStatus(s.id, st)}
                        >
                          {st === 'Present' && <Check size={12} />}
                          {st === 'Absent' && <X size={12} />}
                          {st === 'Late' && <Clock size={12} />}
                          {st}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
