// src/pages/teacher/Overview.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/common/StatCard';
import { BookOpen, CheckSquare, Clock, Award, CheckCircle, MessageSquare, Plus, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherOverview = () => {
  const navigate = useNavigate();

  const todaySchedule = [
    { time: '09:00 AM - 09:45 AM', class: 'Class 10-A', subject: 'Mathematics', room: 'Room 201', topic: 'Quadratic Equations', status: 'Completed' },
    { time: '10:00 AM - 10:45 AM', class: 'Class 10-B', subject: 'Mathematics', room: 'Room 202', topic: 'Trigonometry Intro', status: 'In Progress' },
    { time: '11:30 AM - 12:15 PM', class: 'Class 9-A', subject: 'Mathematics', room: 'Room 105', topic: 'Polynomials', status: 'Upcoming' },
  ];

  const pendingTasks = [
    { id: 1, type: 'Grading', title: 'Grade Class 10-A Unit Test 1 papers', count: '42 papers', dueDate: 'Today' },
    { id: 2, type: 'Attendance', title: 'Mark attendance for Class 10-B', count: 'Section B', dueDate: 'Immediate' },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Faculty Dashboard</h1>
          <p className="page-subtitle">Welcome back, Mrs. Priya Sharma 👋 | Senior Mathematics Faculty</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => navigate('/teacher/homework')}>
            <BookOpen size={16} /> Assign Homework
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/teacher/attendance')}>
            <CheckSquare size={16} /> Mark Today's Attendance
          </button>
        </div>
      </div>

      {/* TOP ROW: 6 TEACHER KPIS */}
      <div className="grid-3" style={{ gap: 20, marginBottom: 24 }}>
        <StatCard icon={<Clock size={22} />} label="Classes Scheduled Today" value="3 Classes" color="var(--color-primary, #2563EB)" />
        <StatCard icon={<CheckSquare size={22} />} label="Today's Attendance Status" value="1/3 Marked" color="#16A34A" />
        <StatCard icon={<Award size={22} />} label="Pending Submissions to Grade" value="42 papers" color="#D97706" />
        <StatCard icon={<BookOpen size={22} />} label="Active Assignments" value="4 active" color="#0F766E" />
        <StatCard icon={<MessageSquare size={22} />} label="Unread Parent Messages" value="3 messages" color="#7C3AED" />
        <StatCard icon={<AlertTriangle size={22} />} label="Low Attendance Alerts" value="2 students" color="#DC2626" />
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <h4 style={{ margin: 0 }}>⚡ Teacher Quick Actions</h4>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ gap: 16 }}>
            {[
              { label: 'Mark Class Attendance', icon: '✅', path: '/teacher/attendance' },
              { label: 'Assign Homework & Tasks', icon: '📚', path: '/teacher/homework' },
              { label: 'Enter Exam Marks', icon: '📝', path: '/teacher/results' },
              { label: 'Message Class Parents', icon: '💬', path: '/teacher/messages' },
            ].map(qa => (
              <div
                key={qa.label}
                className="card flex items-center justify-between"
                style={{ padding: '14px 18px', cursor: 'pointer' }}
                onClick={() => navigate(qa.path)}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.3rem' }}>{qa.icon}</span>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{qa.label}</div>
                </div>
                <ArrowRight size={14} color="var(--color-text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN ROW: TODAY'S TIMETABLE & PENDING WORK QUEUE */}
      <div className="grid-12" style={{ gap: 24 }}>
        {/* Today's Timetable */}
        <div style={{ gridColumn: 'span 7' }}>
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}>📅 Today's Teaching Schedule</h4>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {todaySchedule.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderBottom: i < todaySchedule.length - 1 ? '1px solid var(--color-border)' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>{s.subject} ({s.class})</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Topic: {s.topic} · {s.room}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge ${s.status === 'Completed' ? 'badge-success' : s.status === 'In Progress' ? 'badge-primary' : 'badge-neutral'}`}>
                      {s.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Grading Queue */}
        <div style={{ gridColumn: 'span 5' }}>
          <div className="card">
            <div className="card-header">
              <h4 style={{ margin: 0 }}>📝 Action Item Queue</h4>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {pendingTasks.map((t, i) => (
                <div key={t.id} style={{
                  padding: '14px 20px', borderBottom: i < pendingTasks.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <span className="badge badge-warning">{t.type}</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)', marginTop: 4 }}>{t.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Due: {t.dueDate}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate('/teacher/results')}>Start</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;
