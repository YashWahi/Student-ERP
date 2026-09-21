// src/pages/admin/StudentAdmission.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User, Users, BookOpen, CheckCircle, ArrowRight, ArrowLeft,
  CreditCard, ShieldCheck, AlertCircle, FileText, Printer, Check
} from 'lucide-react';
import { useStudentStore } from '../../store/studentStore';
import { useCrmStore } from '../../store/crmStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const admissionSchema = z.object({
  // Step 1: Personal
  studentName: z.string().min(2, 'Student full name is required (min 2 characters)'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  category: z.enum(['GEN', 'OBC', 'SC', 'ST']),
  bloodGroup: z.string().optional(),
  studentEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  studentPhone: z.string().optional(),

  // Step 2: Parent Info
  parentName: z.string().min(2, 'Parent full name is required'),
  parentPhone: z.string().min(10, 'Valid contact phone number required (min 10 digits)'),
  parentEmail: z.string().email('Valid parent email address is required'),
  address: z.string().min(5, 'Residential address is required'),
  occupation: z.string().optional(),

  // Step 3: Academic
  className: z.string().min(1, 'Please select class & section'),
  admissionNo: z.string().min(3, 'Admission number is required'),
  rollNo: z.string().optional(),
  prevSchool: z.string().optional(),

  // Step 4: Fee Collection
  admissionFee: z.coerce.number().min(0),
  tuitionFee: z.coerce.number().min(0),
  securityDeposit: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  paymentMode: z.enum(['UPI', 'Cash', 'Card', 'NetBanking', 'Cheque']),
  paymentRef: z.string().min(2, 'Payment reference / receipt number is required'),
});

const steps = [
  { id: 1, label: 'Student Info', icon: <User size={16} /> },
  { id: 2, label: 'Parent Details', icon: <Users size={16} /> },
  { id: 3, label: 'Academic & Class', icon: <BookOpen size={16} /> },
  { id: 4, label: 'Fee Collection', icon: <CreditCard size={16} /> },
  { id: 5, label: 'Confirm & Admit', icon: <CheckCircle size={16} /> },
];

const StudentAdmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');

  const { addStudent, isAdmissionNoUnique, findParentByPhone } = useStudentStore();
  const { updateLeadStage } = useCrmStore();
  const { userProfile, tenantId: storeTenantId } = useAuthStore();
  const activeTenantId = userProfile?.tenantId || storeTenantId || 'tenant_gvis';

  const [step, setStep] = useState(1);
  const [parentMatch, setParentMatch] = useState(null);
  const [isUniqueAdmNo, setIsUniqueAdmNo] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdReceipt, setCreatedReceipt] = useState(null);

  // Initialize auto admission number
  const defaultAdmNo = `ADM-2026-${Math.floor(100 + Math.random() * 900)}`;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      studentName: searchParams.get('name') || '',
      dob: '2012-06-15',
      gender: 'Male',
      category: 'GEN',
      bloodGroup: 'O+',
      studentEmail: '',
      studentPhone: '',
      parentName: searchParams.get('parentName') || '',
      parentPhone: searchParams.get('phone') || '',
      parentEmail: '',
      address: 'House No 12, Main Street, Ward 4',
      occupation: 'Business / Service',
      className: searchParams.get('class') || '10-A',
      admissionNo: defaultAdmNo,
      rollNo: `GV-2026-${Math.floor(10 + Math.random() * 90)}`,
      prevSchool: 'St. Mary School',
      admissionFee: 5000,
      tuitionFee: 12000,
      securityDeposit: 2000,
      discount: 0,
      paymentMode: 'UPI',
      paymentRef: `TXN-${Date.now().toString().slice(-6)}`,
    }
  });

  const watchedPhone = watch('parentPhone');
  const watchedAdmNo = watch('admissionNo');
  const watchedAdmissionFee = parseInt(watch('admissionFee')) || 0;
  const watchedTuitionFee = parseInt(watch('tuitionFee')) || 0;
  const watchedSecurityDeposit = parseInt(watch('securityDeposit')) || 0;
  const watchedDiscount = parseInt(watch('discount')) || 0;

  const netPayable = Math.max(0, watchedAdmissionFee + watchedTuitionFee + watchedSecurityDeposit - watchedDiscount);

  // Auto Parent Linking Effect
  useEffect(() => {
    if (watchedPhone && watchedPhone.length >= 10) {
      const match = findParentByPhone(watchedPhone);
      if (match) {
        setParentMatch(match);
        if (match.parentName) setValue('parentName', match.parentName);
        if (match.parentEmail) setValue('parentEmail', match.parentEmail);
        if (match.address) setValue('address', match.address);
        toast.success(`🔗 Existing Parent Linked: ${match.parentName}`);
      } else {
        setParentMatch(null);
      }
    } else {
      setParentMatch(null);
    }
  }, [watchedPhone, findParentByPhone, setValue]);

  // Uniqueness Check for Admission Number
  useEffect(() => {
    if (watchedAdmNo) {
      const unique = isAdmissionNoUnique(watchedAdmNo);
      setIsUniqueAdmNo(unique);
    }
  }, [watchedAdmNo, isAdmissionNoUnique]);

  // Validate fields per step before advancing
  const handleNextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['studentName', 'dob', 'gender', 'category'];
    } else if (step === 2) {
      fieldsToValidate = ['parentName', 'parentPhone', 'parentEmail', 'address'];
    } else if (step === 3) {
      fieldsToValidate = ['className', 'admissionNo'];
      if (!isUniqueAdmNo) {
        toast.error('Admission Number is already registered! Please use a unique number.');
        return;
      }
    } else if (step === 4) {
      fieldsToValidate = ['admissionFee', 'tuitionFee', 'securityDeposit', 'paymentMode', 'paymentRef'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => Math.min(5, prev + 1));
    } else {
      toast.error('Please fix validation errors in the form');
    }
  };

  const handleFinalSubmit = async (data) => {
    setSubmitting(true);
    try {
      const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Save Student to store
      const newStudent = addStudent({
        tenantId: activeTenantId,
        name: data.studentName,
        studentEmail: data.studentEmail,
        password: data.password || 'student123',
        rollNo: data.rollNo,
        admissionNo: data.admissionNo,
        className: data.className,
        parentName: data.parentName,
        parentPhone: data.parentPhone,
        parentEmail: data.parentEmail,
        category: data.category,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        dob: data.dob,
        address: data.address,
        feeStatus: 'Paid',
        status: 'Active',
        feeReceipt: {
          receiptNo,
          totalPaid: netPayable,
          paymentMode: data.paymentMode,
          paymentRef: data.paymentRef,
          date: new Date().toISOString().split('T')[0]
        }
      });

      // Update CRM lead if referred
      if (leadId) {
        updateLeadStage(leadId, 'Admitted');
      }

      setCreatedReceipt({
        receiptNo,
        studentName: data.studentName,
        className: data.className,
        admissionNo: data.admissionNo,
        amount: netPayable,
        paymentMode: data.paymentMode,
        paymentRef: data.paymentRef,
        parentName: data.parentName,
        date: new Date().toISOString().split('T')[0]
      });

      toast.success(`🎉 Admission Completed! Student "${data.studentName}" admitted to ${data.className}!`);
      setTimeout(() => {
        navigate('/admin/students');
      }, 1800);
    } catch (err) {
      toast.error(`Admission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Student Admission Wizard</h1>
          <p className="page-subtitle">Register new student, perform uniqueness checks, link parent profile & collect initial fees</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/admin/students')}>← Student Directory</button>
      </div>

      <div className="card" style={{ padding: '28px 32px' }}>
        {/* Stepper Header */}
        <div className="stepper" style={{ marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={s.id} className="step-item">
              <div className="step-content">
                <div className={`step-bubble ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <div className={`step-label ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}>
                  {s.label}
                </div>
              </div>
              {i < steps.length - 1 && <div className={`step-line ${step > s.id ? 'done' : ''}`} />}
            </div>
          ))}
        </div>

        {/* Wizard Form Body */}
        <form onSubmit={handleSubmit(handleFinalSubmit)}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1: STUDENT PERSONAL INFO */}
              {step === 1 && (
                <div>
                  <h3 style={{ marginBottom: 20, color: '#0F172A' }}>👨‍🎓 Student Personal Details</h3>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" placeholder="e.g. Rohan Sharma" {...register('studentName')} />
                      {errors.studentName && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.studentName.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Date of Birth *</label>
                      <input type="date" className="form-input" {...register('dob')} />
                      {errors.dob && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.dob.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Gender *</label>
                      <select className="form-select" {...register('gender')}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quota Category *</label>
                      <select className="form-select" {...register('category')}>
                        <option value="GEN">General (GEN)</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Blood Group</label>
                      <select className="form-select" {...register('bloodGroup')}>
                        <option value="O+">O+</option>
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="AB+">AB+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Student Login Email ID *</label>
                      <input type="email" className="form-input" placeholder="e.g. student@gmail.com" {...register('studentEmail')} />
                      {errors.studentEmail && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.studentEmail.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Student Login Password *</label>
                      <input type="text" className="form-input" placeholder="e.g. student123" defaultValue="student123" {...register('password')} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PARENT & GUARDIAN INFO (WITH AUTO PARENT LINKING) */}
              {step === 2 && (
                <div>
                  <h3 style={{ marginBottom: 20, color: '#0F172A' }}>👨‍👩‍👧 Parent & Guardian Information</h3>

                  {parentMatch && (
                    <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', padding: 14, borderRadius: 8, marginBottom: 20 }}>
                      <div className="flex items-center gap-2" style={{ color: '#166534', fontWeight: 700, fontSize: '0.88rem' }}>
                        <ShieldCheck size={18} color="#16A34A" />
                        Existing Parent Account Linked Automatically!
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#15803D', marginTop: 4 }}>
                        Matched phone number with existing parent <strong>{parentMatch.parentName}</strong> (Parent of {parentMatch.linkedChildName} - Class {parentMatch.linkedChildClass}).
                      </div>
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Parent Mobile Number *</label>
                      <input className="form-input" placeholder="+91 98765 43210" {...register('parentPhone')} />
                      {errors.parentPhone && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.parentPhone.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Parent / Guardian Name *</label>
                      <input className="form-input" placeholder="e.g. Sanjeev Sharma" {...register('parentName')} />
                      {errors.parentName && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.parentName.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Parent Email (For Receipts & Parent Portal) *</label>
                      <input type="email" className="form-input" placeholder="parent@gmail.com" {...register('parentEmail')} />
                      {errors.parentEmail && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.parentEmail.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Occupation</label>
                      <input className="form-input" placeholder="e.g. Software Engineer" {...register('occupation')} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Residential Address *</label>
                    <textarea className="form-textarea" rows={2} placeholder="House no, street, area, city, pincode" {...register('address')} />
                    {errors.address && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.address.message}</span>}
                  </div>
                </div>
              )}

              {/* STEP 3: ACADEMIC ASSIGNMENT & ADMISSION NUMBER UNIQUENESS */}
              {step === 3 && (
                <div>
                  <h3 style={{ marginBottom: 20, color: '#0F172A' }}>🏫 Academic Class & Admission Number</h3>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Assign Class & Section *</label>
                      <select className="form-select" {...register('className')}>
                        <option value="10-A">Class 10-A</option>
                        <option value="10-B">Class 10-B</option>
                        <option value="9-A">Class 9-A</option>
                        <option value="9-B">Class 9-B</option>
                        <option value="8-A">Class 8-A</option>
                        <option value="8-B">Class 8-B</option>
                        <option value="6-C">Class 6-C</option>
                        <option value="5-A">Class 5-A</option>
                        <option value="1-B">Class 1-B</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Admission Number *
                        {isUniqueAdmNo ? (
                          <span style={{ color: '#16A34A', marginLeft: 8, fontSize: '0.75rem', fontWeight: 700 }}>✓ Unique Number</span>
                        ) : (
                          <span style={{ color: '#DC2626', marginLeft: 8, fontSize: '0.75rem', fontWeight: 700 }}>⚠️ Number already registered!</span>
                        )}
                      </label>
                      <input
                        className="form-input"
                        style={{ borderColor: isUniqueAdmNo ? '#CBD5E1' : '#FCA5A5', backgroundColor: isUniqueAdmNo ? '#FFFFFF' : '#FEF2F2' }}
                        {...register('admissionNo')}
                      />
                      {errors.admissionNo && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.admissionNo.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input className="form-input" placeholder="e.g. GV-2026-090" {...register('rollNo')} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Previous School Name</label>
                      <input className="form-input" placeholder="e.g. St. Mary School" {...register('prevSchool')} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: FEE COLLECTION AT TIME OF ADMISSION */}
              {step === 4 && (
                <div>
                  <h3 style={{ marginBottom: 20, color: '#0F172A' }}>💳 Fee Collection at Admission</h3>
                  
                  <div className="grid-2" style={{ marginBottom: 20 }}>
                    <div className="form-group">
                      <label className="form-label">Admission Fee (₹) *</label>
                      <input type="number" className="form-input" {...register('admissionFee')} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tuition Fee 1st Term (₹) *</label>
                      <input type="number" className="form-input" {...register('tuitionFee')} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Security Deposit Refundable (₹)</label>
                      <input type="number" className="form-input" {...register('securityDeposit')} />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Discount / Scholarship Waiver (₹)</label>
                      <input type="number" className="form-input" {...register('discount')} />
                    </div>
                  </div>

                  {/* Fee Summary Box */}
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #86EFAC', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                    <div className="flex justify-between items-center">
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#166534' }}>Net Amount Received at Admission:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#15803D' }}>₹{netPayable.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Mode of Payment *</label>
                      <select className="form-select" {...register('paymentMode')}>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Cash">Cash Receipt</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="NetBanking">Net Banking / NEFT</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Payment Reference / Receipt No *</label>
                      <input className="form-input" placeholder="e.g. TXN-982711 or Cash Book Ref" {...register('paymentRef')} />
                      {errors.paymentRef && <span style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: 4 }}>{errors.paymentRef.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: FINAL REVIEW & CONFIRMATION */}
              {step === 5 && (
                <div>
                  <h3 style={{ marginBottom: 20, color: '#0F172A' }}>✅ Review & Confirm Admission</h3>

                  <div className="card" style={{ padding: 20, backgroundColor: '#F8FAFC', marginBottom: 24 }}>
                    <div className="grid-2" style={{ gap: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>STUDENT NAME</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0F172A' }}>{watch('studentName')}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>ASSIGNED CLASS & ROLL</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563EB' }}>
                          Class {watch('className')} (Roll: {watch('rollNo')})
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>ADMISSION NUMBER</div>
                        <div style={{ fontWeight: 700, color: '#0F766E' }}>{watch('admissionNo')}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>PARENT & CONTACT</div>
                        <div style={{ fontWeight: 600 }}>{watch('parentName')} ({watch('parentPhone')})</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>FEE AMOUNT PAID</div>
                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#16A34A' }}>
                          ₹{netPayable.toLocaleString()} ({watch('paymentMode')})
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>TRANSACTION REF</div>
                        <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{watch('paymentRef')}</div>
                      </div>
                    </div>
                  </div>

                  {createdReceipt && (
                    <div style={{ padding: 16, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, marginBottom: 20 }}>
                      <div className="flex justify-between items-center">
                        <div>
                          <strong style={{ color: '#1D4ED8' }}>Receipt Generated: #{createdReceipt.receiptNo}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#3B82F6' }}>Amount ₹{createdReceipt.amount} paid via {createdReceipt.paymentMode}</div>
                        </div>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                          <Printer size={14} /> Print Receipt
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Footer Controls */}
          <div className="flex justify-between items-center" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
            {step > 1 ? (
              <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                {submitting ? 'Admitting Student...' : '🎉 Confirm & Admit Student'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentAdmission;
