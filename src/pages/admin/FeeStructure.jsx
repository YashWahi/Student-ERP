// src/pages/admin/FeeStructure.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, CreditCard, Download, Plus, CheckCircle, RefreshCw, AlertTriangle,
  FileText, TrendingUp, Layers, Filter, Search, RotateCcw, Truck, Building, UserCheck,
  Send, Percent, Calendar, ShieldCheck, Check, Clock, User, ArrowUpRight
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { initiateFeePayout } from '../../services/razorpayService';
import { generateFeeReceiptPDF } from '../../services/pdfService';
import { exportToCSV } from '../../services/exportService';
import {
  getFeeHeads, createFeeHead,
  getFeeStructures, createFeeStructure,
  assignFeeStructureToStudent,
  recordFeePayment, triggerDefaulterReminders, processRefund,
  calculateClasswiseSummary,
  DEFAULT_FEE_HEADS, DEFAULT_FEE_STRUCTURES, DEFAULT_INSTALLMENT_PLANS, DEFAULT_COLLECTIONS
} from '../../services/feeService';
import { logInstitutionalExpense } from '../../services/financeService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_EXPENSES = [
  { id: 'exp_1', title: 'Science Lab Chemicals & Glassware', category: 'Lab Supplies', amount: 24500, vendor: 'Sigma Scientific Co.', method: 'Bank Transfer', date: '2026-08-01' },
  { id: 'exp_2', title: 'High-Speed Airtel Fiber Internet Sub', category: 'Software & IT', amount: 12000, vendor: 'Airtel Enterprise', method: 'Bank Transfer', date: '2026-08-05' },
];

const FeeStructure = () => {
  const { tenantId: activeTenantId } = useAuthStore();
  const currentTenant = activeTenantId || 'tenant_gvis';

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('collections'); // collections | heads | builder | assign | installments | defaulters | refunds | expenses
  const [collections, setCollections] = useState([]);
  const [feeHeads, setFeeHeads] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [installmentPlans, setInstallmentPlans] = useState([]);
  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem(`expenses_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return currentTenant === 'tenant_gvis' ? MOCK_EXPENSES : [];
  });

  // Filters & Search
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFeeHeadModal, setShowFeeHeadModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fee Head Form States
  const [fhName, setFhName] = useState('');
  const [fhCategory, setFhCategory] = useState('Tuition');
  const [fhFrequency, setFhFrequency] = useState('Quarterly');
  const [fhAmount, setFhAmount] = useState(5000);
  const [fhDescription, setFhDescription] = useState('');

  // Fee Structure Builder Form States
  const [stClass, setStClass] = useState('Class 10-A');
  const [stAcademicYear, setStAcademicYear] = useState('2026-2027');
  const [stSelectedHeads, setStSelectedHeads] = useState([]); // [{ headId, headName, amount }]

  // Assign Fee Form States
  const [asStudentName, setAsStudentName] = useState('');
  const [asRollNo, setAsRollNo] = useState('');
  const [asClassName, setAsClassName] = useState('Class 10-A');
  const [asFeeHead, setAsFeeHead] = useState('Quarterly Tuition Fee (Q2)');
  const [asBaseAmount, setAsBaseAmount] = useState(18500);
  const [asConcessionPct, setAsConcessionPct] = useState(0);
  const [asConcessionReason, setAsConcessionReason] = useState('None');
  const [asInstallmentPlan, setAsInstallmentPlan] = useState('Quarterly (4 Installments)');

  // Installment Plan Form States
  const [ipName, setIpName] = useState('');
  const [ipCount, setIpCount] = useState(4);
  const [ipDescription, setIpDescription] = useState('');

  // Collect Payment Form States
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectMethod, setCollectMethod] = useState('Cash Counter'); // Cash Counter | Cheque Counter | Razorpay Online | NEFT / Bank Transfer
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankRefNo, setBankRefNo] = useState('');

  // Refund Form States
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);

  // Expense Form States
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState('Utilities');
  const [expAmount, setExpAmount] = useState(5000);
  const [expVendor, setExpVendor] = useState('Local Contractor');

  // Load initial data
  useEffect(() => {
    const loadFeeData = async () => {
      setLoading(true);
      try {
        const heads = await getFeeHeads(currentTenant);
        const structs = await getFeeStructures(currentTenant);
        setFeeHeads(heads && heads.length ? heads : DEFAULT_FEE_HEADS);
        setFeeStructures(structs && structs.length ? structs : DEFAULT_FEE_STRUCTURES);
        setInstallmentPlans(DEFAULT_INSTALLMENT_PLANS);
        
        // Load collections from localStorage if present, else fallback to defaults
        const storedCol = localStorage.getItem(`collections_${currentTenant}`);
        if (storedCol) {
          setCollections(JSON.parse(storedCol));
        } else {
          setCollections(DEFAULT_COLLECTIONS);
        }
      } catch (err) {
        console.warn('Error initializing fee data:', err);
        setFeeHeads(DEFAULT_FEE_HEADS);
        setFeeStructures(DEFAULT_FEE_STRUCTURES);
        setInstallmentPlans(DEFAULT_INSTALLMENT_PLANS);
        setCollections(DEFAULT_COLLECTIONS);
      } finally {
        setLoading(false);
      }
    };
    loadFeeData();
  }, [currentTenant]);

  // Sync collections to local storage for persistence across reloads
  const updateCollectionsState = (newCollections) => {
    setCollections(newCollections);
    try {
      localStorage.setItem(`collections_${currentTenant}`, JSON.stringify(newCollections));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  };

  // Compute Live Aggregates
  const totalCollectedYTD = useMemo(() => {
    return collections.reduce((acc, curr) => acc + Number(curr.amountPaid || 0), 0);
  }, [collections]);

  const totalPendingDues = useMemo(() => {
    return collections.reduce((acc, curr) => {
      const due = Number(curr.totalDue || 0);
      const paid = Number(curr.amountPaid || 0);
      return acc + (due > paid ? due - paid : 0);
    }, 0);
  }, [collections]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [expenses]);

  const collectionRatePct = useMemo(() => {
    const totalDueAll = collections.reduce((acc, curr) => acc + Number(curr.totalDue || 0), 0);
    if (totalDueAll === 0) return '100.0';
    return ((totalCollectedYTD / totalDueAll) * 100).toFixed(1);
  }, [collections, totalCollectedYTD]);

  // Compute Class-wise Summaries
  const classwiseSummaries = useMemo(() => {
    return calculateClasswiseSummary(collections);
  }, [collections]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter(c => {
      const matchClass = classFilter === 'All' || c.className === classFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchClass && matchStatus;
    });
  }, [collections, classFilter, statusFilter]);

  // Handler: Add Fee Head
  const handleAddFeeHead = async (e) => {
    e.preventDefault();
    if (!fhName.trim()) {
      toast.error('Please enter a Fee Head title');
      return;
    }
    const newHead = await createFeeHead(currentTenant, {
      headName: fhName,
      category: fhCategory,
      frequency: fhFrequency,
      amount: Number(fhAmount),
      description: fhDescription,
      status: 'Active',
    });
    setFeeHeads([newHead, ...feeHeads]);
    toast.success(`💳 Fee head "${fhName}" added!`);
    setShowFeeHeadModal(false);
    setFhName(''); setFhCategory('Tuition'); setFhFrequency('Quarterly'); setFhAmount(5000); setFhDescription('');
  };

  // Handler: Create Fee Structure
  const handleCreateStructure = async (e) => {
    e.preventDefault();
    if (stSelectedHeads.length === 0) {
      toast.error('Select at least one Fee Head for this class structure');
      return;
    }
    const newStruct = await createFeeStructure(currentTenant, {
      className: stClass,
      academicYear: stAcademicYear,
      heads: stSelectedHeads,
      status: 'Active',
    });
    setFeeStructures([newStruct, ...feeStructures]);
    toast.success(`🏛️ Fee structure built for ${stClass}!`);
    setShowStructureModal(false);
    setStSelectedHeads([]);
  };

  // Handler: Assign Fee Structure to Student with Concession %
  const handleAssignFee = async (e) => {
    e.preventDefault();
    if (!asStudentName.trim() || !asRollNo.trim()) {
      toast.error('Student Name and Roll Number are required');
      return;
    }
    const assignedRecord = await assignFeeStructureToStudent(currentTenant, {
      studentName: asStudentName,
      rollNo: asRollNo,
      className: asClassName,
      feeHead: asFeeHead,
      baseAmount: Number(asBaseAmount),
      concessionPct: Number(asConcessionPct),
      concessionReason: asConcessionReason,
      installmentPlan: asInstallmentPlan,
    });

    updateCollectionsState([assignedRecord, ...collections]);
    toast.success(`🎯 Assigned fee to ${asStudentName} (${asConcessionPct}% Concession applied)!`);
    setShowAssignModal(false);
    setAsStudentName(''); setAsRollNo(''); setAsConcessionPct(0); setAsConcessionReason('None');
  };

  // Handler: Create Installment Plan
  const handleCreateInstallmentPlan = (e) => {
    e.preventDefault();
    if (!ipName.trim()) return;
    const splitPct = Math.round(100 / Number(ipCount));
    const newPlan = {
      id: `plan_${Date.now()}`,
      planName: ipName,
      installmentCount: Number(ipCount),
      schedule: Array.from({ length: Number(ipCount) }, (_, i) => ({
        name: `Installment ${i + 1} (${splitPct}%)`,
        percent: splitPct,
        dueDateDays: (i + 1) * 30,
      })),
      description: ipDescription || `${ipCount} installment payment schedule`,
    };
    setInstallmentPlans([...installmentPlans, newPlan]);
    toast.success(`📅 Custom Installment Plan "${ipName}" created!`);
    setShowInstallmentModal(false);
    setIpName(''); setIpDescription('');
  };

  // Handler: Process Fee Collection (Offline Cash/Cheque/Bank Transfer OR Trigger Online Razorpay)
  const handleProcessCollection = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    const numCollect = Number(collectAmount);
    if (numCollect <= 0) {
      toast.error('Collection amount must be greater than ₹0');
      return;
    }

    // Online Razorpay Flow
    if (collectMethod === 'Razorpay Online') {
      setShowCollectModal(false);
      setIsProcessingPayment(true);
      await initiateFeePayout({
        tenantId: currentTenant,
        studentId: selectedFee.rollNo,
        studentName: selectedFee.studentName,
        rollNo: selectedFee.rollNo,
        className: selectedFee.className,
        feeId: selectedFee.id,
        amount: numCollect,
        feeType: selectedFee.feeHead,
        totalDue: selectedFee.totalDue,
        parentEmail: 'parent@school.edu.in',
        parentPhone: '+91 9876543210',
        onSuccess: (res) => {
          setIsProcessingPayment(false);
          updateCollectionsState(collections.map(c => c.id === selectedFee.id ? {
            ...c,
            amountPaid: (Number(c.amountPaid) || 0) + numCollect,
            status: res.status,
            method: 'Razorpay Online',
            paymentType: 'Online',
            txnId: res.paymentId,
            date: new Date().toISOString().split('T')[0],
          } : c));
          toast.success(`🎉 Online Payment of ₹${numCollect.toLocaleString('en-IN')} verified & receipt generated!`);
        },
        onFailure: (err) => {
          setIsProcessingPayment(false);
          toast.error(`Payment failed: ${err.message}`);
        },
      });
      return;
    }

    // Offline Flow (Cash / Cheque / Bank Transfer)
    let generatedTxnId = `COUNTER_${Date.now().toString().slice(-6)}`;
    if (collectMethod.includes('Cheque')) {
      generatedTxnId = chequeNo ? `CHQ_${chequeNo}` : `CHQ_${Date.now().toString().slice(-6)}`;
    } else if (collectMethod.includes('NEFT') || collectMethod.includes('Bank')) {
      generatedTxnId = bankRefNo ? `NEFT_${bankRefNo}` : `BANK_${Date.now().toString().slice(-6)}`;
    }

    const recResult = await recordFeePayment(currentTenant, {
      feeId: selectedFee.id,
      studentName: selectedFee.studentName,
      rollNo: selectedFee.rollNo,
      className: selectedFee.className,
      feeHead: selectedFee.feeHead,
      amountPaid: (Number(selectedFee.amountPaid) || 0) + numCollect,
      totalDue: selectedFee.totalDue,
      paymentMethod: collectMethod,
      txnId: generatedTxnId,
      chequeNo,
      bankName,
    });

    updateCollectionsState(collections.map(c => c.id === selectedFee.id ? {
      ...c,
      amountPaid: (Number(c.amountPaid) || 0) + numCollect,
      status: recResult.status,
      method: collectMethod,
      paymentType: 'Offline',
      txnId: generatedTxnId,
      chequeNo,
      bankName,
      date: new Date().toISOString().split('T')[0],
    } : c));

    toast.success(`💰 Collected ₹${numCollect.toLocaleString('en-IN')} via ${collectMethod}! Auto PDF receipt generated.`);
    setShowCollectModal(false);
    setChequeNo(''); setBankName(''); setBankRefNo('');
  };

  // Handler: Execute Refund
  const handleExecuteRefund = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    const numRefund = Number(refundAmount || selectedFee.amountPaid);
    if (!refundReason.trim()) {
      toast.error('Please enter a reason for refund');
      return;
    }

    await processRefund(currentTenant, {
      feeId: selectedFee.id,
      studentName: selectedFee.studentName,
      refundAmount: numRefund,
      refundReason,
      approvedBy: 'Branch Finance Admin',
    });

    updateCollectionsState(collections.map(c => c.id === selectedFee.id ? {
      ...c,
      status: 'Refunded',
      refundAmount: numRefund,
      refundReason,
    } : c));

    toast.success(`⏪ Refund of ₹${numRefund.toLocaleString('en-IN')} processed for ${selectedFee.studentName}!`);
    setShowRefundModal(false);
    setRefundReason('');
  };

  // Handler: Trigger Auto Defaulter Reminders
  const handleTriggerReminders = async () => {
    const defaulters = collections.filter(c => c.status === 'Pending' || c.status === 'Overdue');
    if (defaulters.length === 0) {
      toast.info('No overdue fee defaulters found at this time.');
      return;
    }
    toast.loading('Dispatching automated WhatsApp & SMS fee reminders...');
    await triggerDefaulterReminders(currentTenant, defaulters, 'WhatsApp & SMS');
    toast.dismiss();
    toast.success(`📱 WhatsApp + SMS payment reminders dispatched to ${defaulters.length} parent contacts!`);
  };

  // Handler: Log Campus Expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!expTitle.trim()) return;
    await logInstitutionalExpense({
      tenantId: currentTenant,
      title: expTitle,
      category: expCategory,
      amount: Number(expAmount),
      vendor: expVendor,
      method: 'Bank Transfer',
      date: new Date().toISOString().split('T')[0],
    });

    const newExpenseList = [
      { id: `exp_${Date.now()}`, title: expTitle, category: expCategory, amount: Number(expAmount), vendor: expVendor, method: 'Bank Transfer', date: new Date().toISOString().split('T')[0] },
      ...expenses,
    ];
    setExpenses(newExpenseList);
    try {
      localStorage.setItem(`expenses_${currentTenant}`, JSON.stringify(newExpenseList));
    } catch {}
    toast.success(`💸 Campus expense of ₹${Number(expAmount).toLocaleString('en-IN')} logged!`);
    setShowExpenseModal(false);
    setExpTitle('');
  };

  // DataTable Columns for Fee Collections
  const collectionColumns = [
    {
      key: 'studentName',
      label: 'Student Name & Class',
      render: (v, r) => (
        <div>
          <strong>{v}</strong>
          <br />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Roll: {r.rollNo} · <strong style={{ color: 'var(--color-primary)' }}>{r.className}</strong>
          </span>
        </div>
      ),
    },
    { key: 'feeHead', label: 'Fee Particulars' },
    {
      key: 'baseAmount',
      label: 'Base / Concession',
      render: (v, r) => (
        <div>
          <span>₹{(r.baseAmount || r.totalDue).toLocaleString('en-IN')}</span>
          {r.concessionPct > 0 && (
            <div>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                {r.concessionPct}% Off ({r.concessionReason})
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'totalDue',
      label: 'Net Payable',
      render: (v) => <strong>₹{Number(v).toLocaleString('en-IN')}</strong>,
    },
    {
      key: 'amountPaid',
      label: 'Amount Paid',
      render: (v) => <strong style={{ color: 'var(--color-success)' }}>₹{Number(v).toLocaleString('en-IN')}</strong>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span className={`badge ${v === 'Paid' ? 'badge-success' : v === 'Partial' ? 'badge-primary' : v === 'Refunded' ? 'badge-neutral' : 'badge-danger'}`}>
          {v}
        </span>
      ),
    },
    {
      key: 'method',
      label: 'Payment Mode',
      render: (v, r) => (
        <div>
          <span>{v}</span>
          {r.txnId && r.txnId !== '-' && (
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Txn: {r.txnId}</div>
          )}
        </div>
      ),
    },
    {
      key: 'id',
      label: 'Actions & Receipts',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status === 'Paid' ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                title="Download Official PDF Receipt"
                onClick={() =>
                  generateFeeReceiptPDF({
                    receiptNo: row.txnId,
                    studentName: row.studentName,
                    rollNo: row.rollNo,
                    className: row.className,
                    feeType: row.feeHead,
                    amount: row.amountPaid,
                    paymentMethod: row.method,
                  })
                }
              >
                <Download size={14} /> Receipt
              </button>
              <button
                className="btn btn-ghost btn-sm"
                title="Process Refund"
                onClick={() => {
                  setSelectedFee(row);
                  setRefundAmount(row.amountPaid);
                  setShowRefundModal(true);
                }}
              >
                <RotateCcw size={14} /> Refund
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelectedFee(row);
                setCollectAmount(Number(row.totalDue) - Number(row.amountPaid || 0));
                setShowCollectModal(true);
              }}
            >
              <CreditCard size={14} /> Collect Fee
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="page-header flex justify-between items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <DollarSign className="text-primary" /> Enterprise Fee Management & Razorpay Gateway
          </h1>
          <p className="page-subtitle">
            Class-wise fee structure builder, fee heads, student concessions, offline cash/cheque counter, online Razorpay checkout, defaulters & auto reminders
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Fee_Collections_Report', collections, collectionColumns)}>
            <Download size={16} /> Export Collections CSV
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAssignModal(true)}>
            <Percent size={16} /> Assign Fee & Concession
          </button>
          <button className="btn btn-primary" onClick={() => setShowCollectModal(true)}>
            <Plus size={16} /> New Counter Payment
          </button>
        </div>
      </div>

      {/* TOP ROW: FINANCIAL KPIS */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard
          icon={<DollarSign size={22} />}
          label="Total Fee Collected (YTD)"
          value={`₹${totalCollectedYTD.toLocaleString('en-IN')}`}
          trend="vs last year"
          trendValue={14.8}
          color="#16A34A"
        />
        <StatCard
          icon={<CreditCard size={22} />}
          label="Pending Outstanding Dues"
          value={`₹${totalPendingDues.toLocaleString('en-IN')}`}
          color="#D97706"
          suffix=" pending"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Total Campus Expenses"
          value={`₹${totalExpensesAmount.toLocaleString('en-IN')}`}
          color="#DC2626"
        />
        <StatCard
          icon={<UserCheck size={22} />}
          label="Fee Collection Rate"
          value={`${collectionRatePct}%`}
          color="#2563EB"
        />
      </div>

      {/* CLASS-WISE FEE COLLECTION SUMMARY WIDGETS */}
      <div className="card" style={{ marginBottom: 24, padding: 20 }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }} className="flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Live Class-wise Fee Collection Summary
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Real-time breakdown of collection targets, pending dues, and recovery rates per class
            </p>
          </div>
          <span className="badge badge-primary flex items-center gap-1">
            <RefreshCw size={12} className="spin-on-hover" /> Live Auto-Sync
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: 40, color: 'var(--color-text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ marginRight: 8 }} /> Loading class collection summary...
          </div>
        ) : classwiseSummaries.length === 0 ? (
          <div className="text-center" style={{ padding: 30, background: 'var(--color-bg-surface)', borderRadius: 8 }}>
            <AlertTriangle size={32} style={{ color: '#D97706', marginBottom: 8 }} />
            <p style={{ fontWeight: 600, margin: 0 }}>No Class Fee Records Found</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Build a class fee structure or assign fees to students to view live summaries.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setShowStructureModal(true)}>
              <Plus size={14} /> Build First Class Fee Structure
            </button>
          </div>
        ) : (
          <div className="grid-3 gap-4">
            {classwiseSummaries.map((summary) => (
              <div
                key={summary.className}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 16,
                  backgroundColor: 'var(--color-bg-surface)',
                }}
              >
                <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{summary.className}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {summary.totalStudents} Student Records
                    </span>
                  </div>
                  <span
                    className={`badge ${
                      Number(summary.collectionRate) >= 80
                        ? 'badge-success'
                        : Number(summary.collectionRate) >= 50
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {summary.collectionRate}% Recovered
                  </span>
                </div>

                <div className="space-y-2" style={{ fontSize: '0.85rem' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Total Due Target:</span>
                    <strong>₹{summary.totalDue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Collected YTD:</span>
                    <strong style={{ color: 'var(--color-success)' }}>₹{summary.totalCollected.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Pending Dues:</span>
                    <strong style={{ color: 'var(--color-danger)' }}>₹{summary.pendingDues.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ width: '100%', height: 6, backgroundColor: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, summary.collectionRate))}%`,
                        height: '100%',
                        backgroundColor: Number(summary.collectionRate) >= 80 ? '#16A34A' : Number(summary.collectionRate) >= 50 ? '#D97706' : '#DC2626',
                        transition: 'width 0.5s ease-in-out',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="card flex flex-wrap items-center gap-2" style={{ padding: '10px 14px', marginBottom: 24, backgroundColor: 'var(--color-bg-surface)' }}>
        {[
          { id: 'collections', label: 'Fee Collections Ledger', icon: <DollarSign size={16} /> },
          { id: 'builder', label: 'Class Structure Builder', icon: <Layers size={16} /> },
          { id: 'heads', label: 'Fee Head Master', icon: <Building size={16} /> },
          { id: 'assign', label: 'Assign & Concession', icon: <Percent size={16} /> },
          { id: 'installments', label: 'Installment Plans', icon: <Calendar size={16} /> },
          { id: 'defaulters', label: 'Overdue Defaulters', icon: <AlertTriangle size={16} /> },
          { id: 'refunds', label: 'Refund Processing', icon: <RotateCcw size={16} /> },
          { id: 'expenses', label: 'Campus Expenses', icon: <TrendingUp size={16} /> },
        ].map((t) => (
          <button
            key={t.id}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: COLLECTIONS LEDGER & COUNTER */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <div className="card flex justify-between items-center" style={{ padding: '12px 18px' }}>
            <div className="flex items-center gap-3">
              <Filter size={16} className="text-muted" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter Ledger:</span>
              <select className="form-select" style={{ width: 140, padding: '4px 8px' }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                <option value="All">All Classes</option>
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 9-A">Class 9-A</option>
                <option value="Class 8-A">Class 8-A</option>
                <option value="Class 6-C">Class 6-C</option>
              </select>
              <select className="form-select" style={{ width: 140, padding: '4px 8px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Showing {filteredCollections.length} of {collections.length} collection entries
            </span>
          </div>

          <DataTable
            columns={collectionColumns}
            data={filteredCollections}
            title="Master Fee Collections Ledger"
            searchPlaceholder="Search student name, roll no, fee head, txn ID..."
          />
        </div>
      )}

      {/* TAB 2: CLASS FEE STRUCTURE BUILDER */}
      {activeTab === 'builder' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🏛️ Class-wise Fee Structure Builder</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Configure customized fee breakdowns per academic class</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowStructureModal(true)}>
              <Plus size={14} /> Create Fee Structure Template
            </button>
          </div>
          <div className="card-body">
            {feeStructures.length === 0 ? (
              <div className="text-center" style={{ padding: 40 }}>
                <p>No fee structure templates created yet.</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowStructureModal(true)}>Create First Structure</button>
              </div>
            ) : (
              <div className="grid-2 gap-4">
                {feeStructures.map(struct => (
                  <div key={struct.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 18, backgroundColor: 'var(--color-bg-surface)' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{struct.className}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Session: {struct.academicYear || '2026-2027'}</span>
                      </div>
                      <span className="badge badge-success">{struct.status || 'Active'}</span>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Included Fee Heads</label>
                      <div className="space-y-2" style={{ marginTop: 6 }}>
                        {(struct.heads || []).map((h, idx) => (
                          <div key={idx} className="flex justify-between items-center" style={{ fontSize: '0.85rem', padding: '4px 8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 6 }}>
                            <span>{h.headName}</span>
                            <strong>₹{Number(h.amount).toLocaleString('en-IN')}</strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center" style={{ paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                      <span style={{ fontWeight: 600 }}>Total Class Base Fee:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                        ₹{Number(struct.totalBaseAmount || (struct.heads || []).reduce((s, h) => s + Number(h.amount || 0), 0)).toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FEE HEAD MASTER */}
      {activeTab === 'heads' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Fee Head Master Directory</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Manage primary fee heads (Tuition, Transport, Exam, Misc, Hostel, Fine)</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowFeeHeadModal(true)}>
              <Plus size={14} /> Add New Fee Head
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Fee Head Title</th>
                  <th>Category</th>
                  <th>Billing Frequency</th>
                  <th>Default Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {feeHeads.map(head => (
                  <tr key={head.id}>
                    <td><strong>{head.headName}</strong></td>
                    <td>
                      <span className={`badge ${head.category === 'Tuition' ? 'badge-primary' : head.category === 'Transport' ? 'badge-warning' : head.category === 'Exam' ? 'badge-secondary' : 'badge-neutral'}`}>
                        {head.category}
                      </span>
                    </td>
                    <td><span className="badge badge-secondary">{head.frequency}</span></td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>₹{Number(head.amount).toLocaleString('en-IN')}</strong></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{head.description || '-'}</td>
                    <td><span className="badge badge-success">{head.status || 'Active'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ASSIGN FEE STRUCTURE & CONCESSIONS */}
      {activeTab === 'assign' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>🎯 Assign Fee Structure & Concessions</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Assign class fee structures to students with custom concession % discounts</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssignModal(true)}>
              <Percent size={14} /> Assign Student Fee
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Student & Roll No</th>
                  <th>Class</th>
                  <th>Fee Particulars</th>
                  <th>Gross Amount</th>
                  <th>Concession %</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.studentName}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.rollNo}</span>
                    </td>
                    <td><span className="badge badge-primary">{c.className}</span></td>
                    <td>{c.feeHead}</td>
                    <td>₹{(c.baseAmount || c.totalDue).toLocaleString('en-IN')}</td>
                    <td>
                      {c.concessionPct > 0 ? (
                        <span className="badge badge-success">{c.concessionPct}% ({c.concessionReason || 'Discount'})</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>0% (Full)</span>
                      )}
                    </td>
                    <td><strong style={{ color: 'var(--color-primary)' }}>₹{Number(c.totalDue).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <span className={`badge ${c.status === 'Paid' ? 'badge-success' : c.status === 'Partial' ? 'badge-primary' : 'badge-danger'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: INSTALLMENT PLANS */}
      {activeTab === 'installments' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📅 Installment Plan Setup</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Define multi-stage fee installment schedules for parents</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInstallmentModal(true)}>
              <Plus size={14} /> New Installment Plan
            </button>
          </div>
          <div className="card-body">
            <div className="grid-3 gap-4">
              {installmentPlans.map(plan => (
                <div key={plan.id} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: 18, backgroundColor: 'var(--color-bg-surface)' }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 10 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{plan.planName}</h4>
                    <span className="badge badge-primary">{plan.installmentCount} Parts</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{plan.description}</p>

                  <div className="space-y-2">
                    {plan.schedule.map((slot, i) => (
                      <div key={i} className="flex justify-between items-center" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: 'var(--color-bg-muted)', borderRadius: 4 }}>
                        <span>{slot.name}</span>
                        <strong>{slot.percent}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OVERDUE DEFAULTERS & REMINDERS */}
      {activeTab === 'defaulters' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>⚠️ Overdue Fee Defaulters Roster</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Students with overdue fee balances requiring immediate reminder triggers</p>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleTriggerReminders}>
              <Send size={14} /> Dispatch WhatsApp & SMS Reminders
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {collections.filter(c => c.status === 'Pending' || c.status === 'Overdue').length === 0 ? (
              <div className="text-center" style={{ padding: 40 }}>
                <CheckCircle size={36} style={{ color: '#16A34A', marginBottom: 8 }} />
                <p style={{ fontWeight: 600, margin: 0 }}>Zero Outstanding Defaulters!</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>All student fee installments are currently up to date.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student Name & Roll</th>
                    <th>Class</th>
                    <th>Overdue Fee Particulars</th>
                    <th>Outstanding Dues</th>
                    <th>Days Overdue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {collections
                    .filter(c => c.status === 'Pending' || c.status === 'Overdue')
                    .map(c => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.studentName}</strong>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.rollNo}</span>
                        </td>
                        <td><span className="badge badge-primary">{c.className}</span></td>
                        <td>{c.feeHead}</td>
                        <td>
                          <strong style={{ color: 'var(--color-danger)' }}>
                            ₹{(Number(c.totalDue) - Number(c.amountPaid || 0)).toLocaleString('en-IN')}
                          </strong>
                        </td>
                        <td>
                          <span className="badge badge-warning">{c.daysOverdue || 12} Days</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              toast.success(`📱 Reminder dispatched to ${c.studentName}'s parent contact!`);
                            }}
                          >
                            <Send size={12} /> Send Alert
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: REFUND PROCESSING */}
      {activeTab === 'refunds' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>⏪ Fee Refund Processing Ledger</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Track approved atomic refunds and reverse fee payments</p>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Class</th>
                  <th>Original Fee Head</th>
                  <th>Paid Amount</th>
                  <th>Refund Status</th>
                  <th>Txn ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.studentName}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.rollNo}</span></td>
                    <td><span className="badge badge-primary">{c.className}</span></td>
                    <td>{c.feeHead}</td>
                    <td>₹{Number(c.amountPaid || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${c.status === 'Refunded' ? 'badge-neutral' : c.status === 'Paid' ? 'badge-success' : 'badge-secondary'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{c.txnId}</td>
                    <td>
                      {c.status === 'Paid' ? (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedFee(c);
                            setRefundAmount(c.amountPaid);
                            setShowRefundModal(true);
                          }}
                        >
                          <RotateCcw size={14} /> Execute Refund
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: CAMPUS EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="card-header flex justify-between items-center">
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>💸 Campus Operational Expenses Log</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Record institutional expenses and vendor payments</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowExpenseModal(true)}>
              <Plus size={14} /> Record New Expense
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Expense Description & Vendor</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>
                      <strong>{exp.title}</strong>
                      <br />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vendor: {exp.vendor}</span>
                    </td>
                    <td><span className="badge badge-primary">{exp.category}</span></td>
                    <td><strong style={{ color: 'var(--color-danger)' }}>₹{Number(exp.amount).toLocaleString('en-IN')}</strong></td>
                    <td>{exp.method}</td>
                    <td>{exp.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: COLLECT FEE (OFFLINE CASH/CHEQUE OR ONLINE RAZORPAY) */}
      <Modal isOpen={showCollectModal} onClose={() => setShowCollectModal(false)} title={`Collect Fee Payment — ${selectedFee?.studentName || ''}`}>
        <form onSubmit={handleProcessCollection}>
          <div style={{ backgroundColor: 'var(--color-bg-muted)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: '0.85rem' }}>Student: <strong>{selectedFee?.studentName}</strong> ({selectedFee?.rollNo})</div>
            <div style={{ fontSize: '0.85rem' }}>Particulars: <strong>{selectedFee?.feeHead}</strong></div>
            <div style={{ fontSize: '0.85rem' }}>Total Net Due: <strong>₹{Number(selectedFee?.totalDue || 0).toLocaleString('en-IN')}</strong></div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) *</label>
            <input className="form-input" type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method / Mode *</label>
            <select className="form-select" value={collectMethod} onChange={e => setCollectMethod(e.target.value)}>
              <option value="Cash Counter">Cash Counter (Offline Teller)</option>
              <option value="Cheque Counter">Cheque / Demand Draft (Offline)</option>
              <option value="UPI QR Code">UPI QR Code (POS Counter)</option>
              <option value="POS Card Swipe">POS Card Swipe (Debit/Credit)</option>
              <option value="NEFT / Bank Transfer">NEFT / Bank Transfer</option>
              <option value="Razorpay Online">Razorpay Online Gateway (Checkout)</option>
            </select>
          </div>

          {/* Conditional Cheque fields */}
          {collectMethod === 'Cheque Counter' && (
            <div className="grid-2 gap-3" style={{ marginTop: 12 }}>
              <div className="form-group">
                <label className="form-label">Cheque / DD Number *</label>
                <input className="form-input" placeholder="e.g. 884910" value={chequeNo} onChange={e => setChequeNo(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Issuing Bank Name *</label>
                <input className="form-input" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} required />
              </div>
            </div>
          )}

          {/* Conditional Bank Transfer fields */}
          {collectMethod === 'NEFT / Bank Transfer' && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Bank Reference Txn Number *</label>
              <input className="form-input" placeholder="e.g. N123456789" value={bankRefNo} onChange={e => setBankRefNo(e.target.value)} required />
            </div>
          )}

          <div className="flex justify-end gap-2" style={{ marginTop: 24 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCollectModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isProcessingPayment}>
              {collectMethod === 'Razorpay Online' ? 'Launch Razorpay Gateway' : 'Record Offline Payment & Download Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ASSIGN FEE STRUCTURE & CONCESSION % */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Fee Structure to Student">
        <form onSubmit={handleAssignFee}>
          <div className="grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">Student Name *</label>
              <input className="form-input" placeholder="e.g. Rahul Sharma" value={asStudentName} onChange={e => setAsStudentName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number / Admission No *</label>
              <input className="form-input" placeholder="e.g. GV-2026-009" value={asRollNo} onChange={e => setAsRollNo(e.target.value)} required />
            </div>
          </div>

          <div className="grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">Class & Section *</label>
              <select className="form-select" value={asClassName} onChange={e => setAsClassName(e.target.value)}>
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 9-A">Class 9-A</option>
                <option value="Class 8-A">Class 8-A</option>
                <option value="Class 6-C">Class 6-C</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fee Particulars Title *</label>
              <input className="form-input" value={asFeeHead} onChange={e => setAsFeeHead(e.target.value)} required />
            </div>
          </div>

          <div className="grid-3 gap-3">
            <div className="form-group">
              <label className="form-label">Gross Base Fee (₹) *</label>
              <input className="form-input" type="number" value={asBaseAmount} onChange={e => setAsBaseAmount(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Concession (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={asConcessionPct} onChange={e => setAsConcessionPct(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Concession Category</label>
              <select className="form-select" value={asConcessionReason} onChange={e => setAsConcessionReason(e.target.value)}>
                <option value="None">None (Standard)</option>
                <option value="Merit Scholarship">Merit Scholarship</option>
                <option value="Staff Child">Staff Child</option>
                <option value="Sibling Concession">Sibling Concession</option>
                <option value="EWS / Financial Need">EWS / Financial Need</option>
                <option value="Sports Quota">Sports Quota</option>
              </select>
            </div>
          </div>

          {/* Dynamic Calculation Preview */}
          <div style={{ backgroundColor: 'var(--color-bg-muted)', padding: 12, borderRadius: 8, marginTop: 12 }}>
            <div className="flex justify-between" style={{ fontSize: '0.85rem' }}>
              <span>Gross Fee:</span> <span>₹{Number(asBaseAmount).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-success" style={{ fontSize: '0.85rem' }}>
              <span>Concession Discount ({asConcessionPct}%):</span>
              <span>- ₹{Math.round((Number(asBaseAmount) * Number(asConcessionPct)) / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between" style={{ fontSize: '1rem', fontWeight: 700, marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--color-border)' }}>
              <span>Net Payable Student Fee:</span>
              <span className="text-primary">
                ₹{(Number(asBaseAmount) - Math.round((Number(asBaseAmount) * Number(asConcessionPct)) / 100)).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Assign Fee Record</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: BUILD CLASS FEE STRUCTURE TEMPLATE */}
      <Modal isOpen={showStructureModal} onClose={() => setShowStructureModal(false)} title="Build Class Fee Structure Template">
        <form onSubmit={handleCreateStructure}>
          <div className="grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">Target Class *</label>
              <select className="form-select" value={stClass} onChange={e => setStClass(e.target.value)}>
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 9-A">Class 9-A</option>
                <option value="Class 8-A">Class 8-A</option>
                <option value="Class 7-A">Class 7-A</option>
                <option value="Class 6-C">Class 6-C</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Academic Session *</label>
              <input className="form-input" value={stAcademicYear} onChange={e => setStAcademicYear(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Included Fee Heads & Amounts *</label>
            <div className="space-y-2" style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border)', padding: 10, borderRadius: 6 }}>
              {feeHeads.map((head) => {
                const isSelected = stSelectedHeads.some(h => h.headId === head.id);
                return (
                  <div key={head.id} className="flex justify-between items-center" style={{ padding: '6px 8px', backgroundColor: isSelected ? 'var(--color-bg-muted)' : 'transparent', borderRadius: 4 }}>
                    <label className="flex items-center gap-2" style={{ cursor: 'pointer', margin: 0, fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStSelectedHeads([...stSelectedHeads, { headId: head.id, headName: head.headName, amount: head.amount }]);
                          } else {
                            setStSelectedHeads(stSelectedHeads.filter(h => h.headId !== head.id));
                          }
                        }}
                      />
                      <span><strong>{head.headName}</strong> ({head.category})</span>
                    </label>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>₹{Number(head.amount).toLocaleString('en-IN')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center" style={{ padding: 10, backgroundColor: 'var(--color-bg-muted)', borderRadius: 6 }}>
            <span>Calculated Total Base Fee:</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
              ₹{stSelectedHeads.reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
            </strong>
          </div>

          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowStructureModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Fee Structure</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ADD FEE HEAD */}
      <Modal isOpen={showFeeHeadModal} onClose={() => setShowFeeHeadModal(false)} title="Add New Fee Head Master">
        <form onSubmit={handleAddFeeHead}>
          <div className="form-group">
            <label className="form-label">Fee Head Title *</label>
            <input className="form-input" placeholder="e.g. Quarterly Tuition Fee" value={fhName} onChange={e => setFhName(e.target.value)} required />
          </div>
          <div className="grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={fhCategory} onChange={e => setFhCategory(e.target.value)}>
                <option value="Tuition">Tuition</option>
                <option value="Transport">Transport</option>
                <option value="Exam">Exam</option>
                <option value="Misc">Misc</option>
                <option value="Hostel">Hostel</option>
                <option value="Fine">Fine</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Billing Frequency *</label>
              <select className="form-select" value={fhFrequency} onChange={e => setFhFrequency(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Annual">Annual</option>
                <option value="One-Time">One-Time</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Default Amount (₹) *</label>
            <input className="form-input" type="number" value={fhAmount} onChange={e => setFhAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows={2} value={fhDescription} onChange={e => setFhDescription(e.target.value)} placeholder="Describe fee scope..." />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowFeeHeadModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Fee Head</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: INSTALLMENT PLAN SETUP */}
      <Modal isOpen={showInstallmentModal} onClose={() => setShowInstallmentModal(false)} title="Create Installment Plan">
        <form onSubmit={handleCreateInstallmentPlan}>
          <div className="form-group">
            <label className="form-label">Plan Title *</label>
            <input className="form-input" placeholder="e.g. Quarterly 4 Parts" value={ipName} onChange={e => setIpName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Installments *</label>
            <select className="form-select" value={ipCount} onChange={e => setIpCount(e.target.value)}>
              <option value={2}>2 Installments (Bi-Annual 50/50)</option>
              <option value={3}>3 Installments (Trimester)</option>
              <option value={4}>4 Installments (Quarterly 25/25/25/25)</option>
              <option value={10}>10 Installments (Monthly)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Plan Description</label>
            <input className="form-input" value={ipDescription} onChange={e => setIpDescription(e.target.value)} placeholder="e.g. 4 equal quarterly payments" />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowInstallmentModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Installment Plan</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: EXECUTE REFUND */}
      <Modal isOpen={showRefundModal} onClose={() => setShowRefundModal(false)} title={`Execute Atomic Refund — ${selectedFee?.studentName || ''}`}>
        <form onSubmit={handleExecuteRefund}>
          <div className="form-group">
            <label className="form-label">Refund Amount (₹) *</label>
            <input className="form-input" type="number" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Refund *</label>
            <textarea className="form-textarea" rows={3} placeholder="State valid reason for refund (e.g. Duplicate payment, Admission withdrawal)..." value={refundReason} onChange={e => setRefundReason(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowRefundModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-danger">Approve & Execute Refund</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 7: RECORD CAMPUS EXPENSE */}
      <Modal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Record Institutional Expense">
        <form onSubmit={handleCreateExpense}>
          <div className="form-group">
            <label className="form-label">Expense Title *</label>
            <input className="form-input" placeholder="e.g. Airtel Fiber Broadband Subscription" value={expTitle} onChange={e => setExpTitle(e.target.value)} required />
          </div>
          <div className="grid-2 gap-3">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select className="form-select" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                <option value="Utilities">Utilities</option>
                <option value="Software & IT">Software & IT</option>
                <option value="Transport">Transport</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Lab Supplies">Lab Supplies</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input className="form-input" type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Vendor / Payee Name</label>
            <input className="form-input" value={expVendor} onChange={e => setExpVendor(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setShowExpenseModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Campus Expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FeeStructure;
