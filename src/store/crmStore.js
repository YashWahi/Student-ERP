// src/store/crmStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_LEADS = [
  {
    id: 'lead_101',
    name: 'Kabir Verma',
    parentName: 'Anita Verma',
    class: 'Class 6-C',
    source: 'Website Enquiry',
    counsellor: 'Sunita Mehra',
    phone: '+91 98765 43215',
    status: 'New',
    followUpDate: '2026-08-15',
    notes: 'Interested in STEM labs & robotics club',
    callLogs: [
      { date: '2026-08-10', note: 'Initial website enquiry received' }
    ]
  },
  {
    id: 'lead_102',
    name: 'Aarav Gupta',
    parentName: 'Vikas Gupta',
    class: 'Class 8-A',
    source: 'Walk-in',
    counsellor: 'Amit Sharma',
    phone: '+91 98765 43214',
    status: 'Contacted',
    followUpDate: '2026-08-14',
    notes: 'Requires hostel facilities & transport',
    callLogs: [
      { date: '2026-08-11', note: 'Called parent; discussed fee structure & hostel' }
    ]
  },
  {
    id: 'lead_103',
    name: 'Sneha Roy',
    parentName: 'Ramesh Roy',
    class: 'Class 10-A',
    source: 'Referral',
    counsellor: 'Sunita Mehra',
    phone: '+91 98765 43219',
    status: 'Follow-up',
    followUpDate: '2026-08-16',
    notes: 'Campus tour scheduled for Saturday',
    callLogs: [
      { date: '2026-08-12', note: 'Sent prospectus on WhatsApp; scheduled campus visit' }
    ]
  },
  {
    id: 'lead_104',
    name: 'Rohan Sharma',
    parentName: 'Sanjeev Sharma',
    class: 'Class 10-A',
    source: 'Online Ad',
    counsellor: 'Rajesh Kumar',
    phone: '+91 98765 43213',
    status: 'Admitted',
    followUpDate: '2026-08-10',
    notes: 'Admission fee paid; enrolled in directory',
    callLogs: [
      { date: '2026-08-08', note: 'Form filled' },
      { date: '2026-08-10', note: 'Admitted successfully with receipt #REC-9821' }
    ]
  },
  {
    id: 'lead_105',
    name: 'Priya Mishra',
    parentName: 'Suresh Mishra',
    class: 'Class 9-B',
    source: 'Walk-in',
    counsellor: 'Amit Sharma',
    phone: '+91 98765 11223',
    status: 'Contacted',
    followUpDate: '2026-08-18',
    notes: 'Evaluating sports scholarship eligibility',
    callLogs: [
      { date: '2026-08-09', note: 'Provided sports trials schedule' }
    ]
  },
  {
    id: 'lead_106',
    name: 'Diya Patel',
    parentName: 'Bhavesh Patel',
    class: 'Class 5-A',
    source: 'Social Media',
    counsellor: 'Sunita Mehra',
    phone: '+91 98765 77889',
    status: 'Follow-up',
    followUpDate: '2026-08-13',
    notes: 'Parent requested phone callback regarding bus routes',
    callLogs: [
      { date: '2026-08-12', note: 'Callback requested' }
    ]
  },
  {
    id: 'lead_107',
    name: 'Vihaan Joshi',
    parentName: 'Meera Joshi',
    class: 'Class 1-B',
    source: 'Referral',
    counsellor: 'Rajesh Kumar',
    phone: '+91 98765 99001',
    status: 'Lost',
    followUpDate: '2026-08-05',
    notes: 'Opted for another school due to location distance',
    callLogs: [
      { date: '2026-08-05', note: 'Lead marked as Lost - relocated to another city' }
    ]
  }
];

export const useCrmStore = create(
  persist(
    (set, get) => ({
      leads: INITIAL_LEADS,

      addLead: (leadData) => {
        const newLead = {
          id: `lead_${Date.now()}`,
          name: leadData.name,
          parentName: leadData.parentName || 'N/A',
          class: leadData.targetClass || leadData.class || 'Class 10-A',
          source: leadData.source || 'Website Enquiry',
          counsellor: leadData.counsellor || 'Sunita Mehra',
          phone: leadData.phone,
          status: leadData.status || 'New',
          followUpDate: leadData.followUpDate || new Date().toISOString().split('T')[0],
          notes: leadData.notes || 'Newly registered enquiry',
          callLogs: leadData.callLogs || [
            { date: new Date().toISOString().split('T')[0], note: 'Lead created in CRM system' }
          ]
        };
        set((state) => ({ leads: [newLead, ...state.leads] }));
        return newLead;
      },

      updateLeadStage: (leadId, newStage) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === leadId
              ? {
                  ...l,
                  status: newStage,
                  callLogs: [
                    ...(l.callLogs || []),
                    {
                      date: new Date().toISOString().split('T')[0],
                      note: `Pipeline stage changed to "${newStage}"`
                    }
                  ]
                }
              : l
          )
        }));
      },

      updateLeadFollowUp: (leadId, { nextDate, notes, callNote }) => {
        set((state) => ({
          leads: state.leads.map((l) => {
            if (l.id !== leadId) return l;
            const updatedLogs = [...(l.callLogs || [])];
            if (callNote) {
              updatedLogs.push({
                date: new Date().toISOString().split('T')[0],
                note: callNote
              });
            }
            return {
              ...l,
              followUpDate: nextDate || l.followUpDate,
              notes: notes || l.notes,
              callLogs: updatedLogs
            };
          })
        }));
      },

      bulkImportLeads: (importedLeads) => {
        set((state) => ({
          leads: [...importedLeads, ...state.leads]
        }));
      },

      deleteLead: (leadId) => {
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== leadId)
        }));
      },

      resetLeads: () => set({ leads: INITIAL_LEADS }),
    }),
    {
      name: 'admissions-crm-storage',
    }
  )
);
