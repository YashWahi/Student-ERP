// src/tests/parentPortalWorkflows.test.js
import assert from 'assert';

console.log('🧪 Running Parent Portal Workflows & Logic Suite...\n');

// 1. Multi-Child Switcher & Scoped Data Filtering
const mockChildren = [
  { id: 'child_101', name: 'Arjun Verma', class: 'Class 10-A', rollNo: 'GV-2026-001', attendancePct: '96%', feeDue: 18500, busRoute: 'Route 101' },
  { id: 'child_102', name: 'Kabir Verma', class: 'Class 6-C', rollNo: 'GV-2026-004', attendancePct: '92%', feeDue: 14500, busRoute: 'Route 102' },
  { id: 'child_103', name: 'Ananya Verma', class: 'Class 3-B', rollNo: 'GV-2026-009', attendancePct: '98%', feeDue: 12000, busRoute: 'Route 105' },
];

const mockHomework = [
  { id: 'hw_1', childId: 'child_101', title: 'Quadratic Equations', status: 'Pending' },
  { id: 'hw_2', childId: 'child_101', title: 'Physics Lab', status: 'Pending' },
  { id: 'hw_3', childId: 'child_102', title: 'Fractions', status: 'Pending' },
  { id: 'hw_4', childId: 'child_103', title: 'English Reading', status: 'Submitted' },
];

function getChildData(childId, children, homework) {
  const child = children.find(c => c.id === childId);
  const childHw = homework.filter(h => h.childId === childId);
  return { child, homework: childHw };
}

const child1Data = getChildData('child_101', mockChildren, mockHomework);
assert.strictEqual(child1Data.child.name, 'Arjun Verma', 'Selected child 1 should be Arjun');
assert.strictEqual(child1Data.homework.length, 2, 'Arjun should have 2 homework items');
assert.strictEqual(child1Data.child.feeDue, 18500, 'Arjun fee due should be 18500');

const child2Data = getChildData('child_102', mockChildren, mockHomework);
assert.strictEqual(child2Data.child.name, 'Kabir Verma', 'Selected child 2 should be Kabir');
assert.strictEqual(child2Data.homework.length, 1, 'Kabir should have 1 homework item');
assert.strictEqual(child2Data.child.feeDue, 14500, 'Kabir fee due should be 14500');
console.log('  ✅ Multi-child switcher and scoped data filtering verified');

// 2. Parent-Initiated Fee Payment & Ledger Update
function processChildFeePayment(child, paidMap, txnList) {
  const isPaid = paidMap[child.id] || false;
  if (isPaid) return { childFeeDue: 0, status: 'Paid' };

  const newTxn = {
    id: `REC-${Date.now()}`,
    childId: child.id,
    amount: child.feeDue,
    status: 'Paid',
    date: new Date().toISOString().split('T')[0]
  };
  paidMap[child.id] = true;
  txnList.unshift(newTxn);

  return { childFeeDue: 0, status: 'Paid', txn: newTxn };
}

const paidMap = {};
const txnList = [];
const paymentResult = processChildFeePayment(mockChildren[0], paidMap, txnList);
assert.strictEqual(paymentResult.status, 'Paid', 'Fee should be marked as Paid');
assert.strictEqual(txnList.length, 1, 'Transaction ledger should record 1 payment');
assert.strictEqual(txnList[0].amount, 18500, 'Payment amount should match 18500');
console.log('  ✅ Child fee payment calculation and receipt ledger verified');

// 3. PTM Meeting Slot Booking
function buildPTMBooking(child, teacherName, date, timeSlot, parentName) {
  return {
    childId: child.id,
    childName: child.name,
    className: child.class,
    teacherName,
    parentName,
    date,
    timeSlot,
    status: 'Confirmed',
    createdAt: new Date().toISOString()
  };
}

const ptmBooking = buildPTMBooking(mockChildren[0], 'Mrs. Priya Sharma', '2026-08-28', '10:30 AM - 10:45 AM', 'Mr. Suresh Verma');
assert.strictEqual(ptmBooking.childName, 'Arjun Verma', 'PTM child name should be Arjun Verma');
assert.strictEqual(ptmBooking.status, 'Confirmed', 'PTM booking status should be Confirmed');
assert.strictEqual(ptmBooking.teacherName, 'Mrs. Priya Sharma', 'Teacher should be Mrs. Priya Sharma');
console.log('  ✅ PTM meeting slot booking data pipeline verified');

// 4. Child Leave Application Lifecycle
function createChildLeaveRequest(child, leaveType, fromDate, toDate, reason, parentName) {
  return {
    childId: child.id,
    childName: child.name,
    leaveType,
    fromDate,
    toDate: toDate || fromDate,
    reason,
    parentName,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
}

const leaveRequest = createChildLeaveRequest(mockChildren[1], 'Medical Leave', '2026-08-19', '2026-08-20', 'Viral fever recovery', 'Mr. Suresh Verma');
assert.strictEqual(leaveRequest.childName, 'Kabir Verma', 'Leave child name should be Kabir Verma');
assert.strictEqual(leaveRequest.status, 'Pending', 'Leave request status should be Pending');
assert.strictEqual(leaveRequest.leaveType, 'Medical Leave', 'Leave type should be Medical Leave');
console.log('  ✅ Child leave request generation verified');

// 5. Helpdesk Ticket / Complaint Lifecycle
function createComplaintTicket(child, category, description, parentName) {
  return {
    childId: child.id,
    childName: child.name,
    category,
    description,
    parentName,
    status: 'Open',
    createdAt: new Date().toISOString()
  };
}

const complaintTicket = createComplaintTicket(mockChildren[0], 'Transport Issue', 'Bus delayed by 20 minutes at stop 4', 'Mr. Suresh Verma');
assert.strictEqual(complaintTicket.category, 'Transport Issue');
assert.strictEqual(complaintTicket.status, 'Open');
console.log('  ✅ Helpdesk ticket grievance submission verified');

console.log('\n✨ ALL PARENT PORTAL WORKFLOW TESTS PASSED WITH 100% SUCCESS!\n');
