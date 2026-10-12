import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { useCrmStore } from '../store/crmStore.js';

export const WEBSITE_TEMPLATES = [
  { id: 'academic-classic', name: 'Academic Classic', desc: 'Traditional collegiate layout with serif accents & rich hero cards' },
  { id: 'modern-campus', name: 'Modern Campus', desc: 'Sleek tech-forward layout with floating glass badges & particle background' },
  { id: 'premium-university', name: 'Premium University', desc: 'Elite research institution style with bold typography & video header' },
  { id: 'tech-education', name: 'Tech & STEM Academy', desc: 'High-contrast vibrant cards tailored for engineering & coding institutes' },
  { id: 'minimal-academic', name: 'Minimal Academic', desc: 'Ultra-clean Scandinavian layout prioritizing typography & white space' },
];

export const DEFAULT_WEBSITE_CONFIG = {
  template: 'modern-campus',
  slug: 'greenfield-college',
  status: 'published',
  version: 1,
  seo: {
    title: 'Greenfield College — Empowering Future Leaders',
    description: 'Premier higher education and school campus fostering academic excellence, innovation, and global leadership.',
    keywords: 'college, school, education, admissions, academics, campus',
  },
  navigation: [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Principal', href: '#principal' },
    { label: 'Programs', href: '#programs' },
    { label: 'Facilities', href: '#facilities' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Contact', href: '#contact' },
  ],
  hero: {
    enabled: true,
    badge: '🎓 Admissions Open for Academic Session 2026-27',
    headline: 'Empowering Next-Gen Leaders Through Academic & Research Distinction',
    subheadline: 'An accredited premier institution offering experiential curriculum, modern science & IoT laboratories, distinguished faculty, and holistic leadership development.',
    primaryCtaText: 'Apply for Admission',
    primaryCtaLink: '#apply',
    secondaryCtaText: 'Explore Programs',
    secondaryCtaLink: '#programs',
    stats: [
      { label: 'Enrolled Students', value: '2,850+' },
      { label: 'Faculty Scholars', value: '185+' },
      { label: 'Placement Success', value: '98.6%' },
      { label: 'Accreditation Rank', value: 'A++ Grade' },
    ],
  },
  about: {
    enabled: true,
    heading: 'About Our Institution',
    tagline: '25 Years of Transformative Educational Excellence',
    description: 'Established with a vision to ignite intellect and cultivate ethical leadership, our campus provides an immersive environment where scholarly discipline meets innovation and character building.',
    mission: 'To impart holistic education through world-class pedagogy, state-of-the-art infrastructure, and continuous industry partnerships.',
    vision: 'To be a globally celebrated sanctuary of academic distinction, research breakthroughs, and ethical human values.',
    yearEstablished: '2001',
    campusSize: '45 Acres Green Campus',
  },
  principal: {
    enabled: true,
    name: 'Dr. Anandita Sen, Ph.D.',
    designation: 'Principal & Academic Director',
    message: 'Welcome to our vibrant campus. Here, we do not merely teach textbooks; we spark curious minds, encourage rigorous inquiry, and empower every learner to lead with courage and compassion in a rapidly evolving world.',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    signatureTitle: 'Office of the Principal',
  },
  programs: [
    {
      id: 'prog_1',
      title: 'Senior Secondary (Science & Technology)',
      duration: '2 Academic Years',
      eligibility: 'Class 10 CBSE/ICSE with 75%+',
      description: 'Intensive coursework covering Physics, Chemistry, Advanced Mathematics, Computer Science, and Artificial Intelligence.',
      category: 'Science',
      icon: 'Cpu',
    },
    {
      id: 'prog_2',
      title: 'Senior Secondary (Commerce & Financial Analytics)',
      duration: '2 Academic Years',
      eligibility: 'Class 10 CBSE/ICSE with 65%+',
      description: 'Comprehensive curriculum in Accountancy, Business Studies, Micro/Macro Economics, and Data Analytics.',
      category: 'Commerce',
      icon: 'BarChart2',
    },
    {
      id: 'prog_3',
      title: 'Senior Secondary (Humanities, Law & Liberal Arts)',
      duration: '2 Academic Years',
      eligibility: 'Class 10 CBSE/ICSE with 60%+',
      description: 'Broad-based exploration in Political Science, Psychology, Sociology, World History, and Rhetoric.',
      category: 'Arts',
      icon: 'BookOpen',
    },
  ],
  admissions: {
    enabled: true,
    title: 'Admissions Open 2026-27',
    deadline: 'April 30, 2026',
    processSteps: [
      { step: '1', title: 'Online Application', desc: 'Fill out the digital enquiry form with candidate details.' },
      { step: '2', title: 'Aptitude Assessment', desc: 'Participate in the holistic scholarship and aptitude evaluation.' },
      { step: '3', title: 'Counseling & Enrollment', desc: 'Interact with faculty counselors and complete document verification.' },
    ],
  },
  facilities: [
    {
      id: 'fac_1',
      title: 'Smart Digital Classrooms',
      description: 'Equipped with 4K interactive touch displays, hybrid lecture capture, and ergonomic modular seating.',
      icon: 'Monitor',
    },
    {
      id: 'fac_2',
      title: 'Robotics & STEM Innovation Hub',
      description: '3D printers, IoT microcontrollers, physics and robotics testbeds for hands-on prototyping.',
      icon: 'Cpu',
    },
    {
      id: 'fac_3',
      title: 'Central Digital Research Library',
      description: 'Over 45,000 physical volumes, 200,000+ IEEE/JSTOR e-journals, and soundproof study carrels.',
      icon: 'BookOpen',
    },
    {
      id: 'fac_4',
      title: 'Olympic Sports & Aquatics Complex',
      description: 'All-weather athletic synthetic track, semi-Olympic heated pool, and indoor badminton arenas.',
      icon: 'Activity',
    },
    {
      id: 'fac_5',
      title: 'Fleet Transportation with GPS & RFID',
      description: 'Air-conditioned bus network with real-time GPS tracking and parent portal SMS alerts.',
      icon: 'Truck',
    },
    {
      id: 'fac_6',
      title: 'Hygienic Dining & Nutrition Center',
      description: 'FSSAI certified nutritionist-curated meals prepared under strict sanitary standards.',
      icon: 'Coffee',
    },
  ],
  gallery: [
    { id: 'gal_1', title: 'Main Academic Quadrangle', category: 'Campus', url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&q=80' },
    { id: 'gal_2', title: 'Annual Robotics Symposium', category: 'Events', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80' },
    { id: 'gal_3', title: 'Central Amphitheater & Arts', category: 'Campus', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&q=80' },
    { id: 'gal_4', title: 'Inter-College Football Championship', category: 'Sports', url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=600&q=80' },
  ],
  testimonials: [
    {
      id: 't_1',
      name: 'Pooja Sharma',
      role: 'Alumnus (Batch 2024), Software Engineer at Microsoft',
      message: 'The mentorship and cutting-edge lab exposure at Greenfield gave me the confidence to excel in competitive hackathons and land my dream tech career.',
      rating: 5,
    },
    {
      id: 't_2',
      name: 'Col. Rajesh Verma',
      role: 'Proud Parent of Class 12 Scholar',
      message: 'The balance between academic rigor, sports infrastructure, and character development is extraordinary. The parent portal keeps us informed daily.',
      rating: 5,
    },
  ],
  contact: {
    enabled: true,
    email: 'admissions@greenfield.edu.in',
    phone: '+91 (0120) 456-7890',
    admissionPhone: '+91 98765 43210',
    address: 'Plot 14, Institutional Area, Sector 62, Noida, NCR Delhi 201309, India',
    officeHours: 'Monday – Saturday: 08:30 AM – 05:00 PM',
  },
  footer: {
    about: 'Greenfield College is an autonomous premier education institution affiliated with national boards and committed to empowering the scholars of tomorrow.',
    copyright: `© ${new Date().getFullYear()} Greenfield College. All Rights Reserved. Powered by EduERP Pro.`,
  },
};

// In-Memory cache for fast resolution
const websiteConfigCache = new Map();

/**
 * Fetch website config for a tenant or slug
 */
export const getWebsiteConfig = async (tenantIdOrSlug) => {
  if (!tenantIdOrSlug) return DEFAULT_WEBSITE_CONFIG;

  if (websiteConfigCache.has(tenantIdOrSlug)) {
    return websiteConfigCache.get(tenantIdOrSlug);
  }

  try {
    const docRef = doc(db, 'tenants', tenantIdOrSlug);
    const snap = await getDoc(docRef);

    if (snap.exists() && snap.data().websiteConfig) {
      const config = { ...DEFAULT_WEBSITE_CONFIG, ...snap.data().websiteConfig };
      websiteConfigCache.set(tenantIdOrSlug, config);
      return config;
    }
  } catch (err) {
    console.warn(`[WebsiteService] Failed to load websiteConfig for ${tenantIdOrSlug}:`, err.message);
  }

  return DEFAULT_WEBSITE_CONFIG;
};

/**
 * Save draft or publish website config
 */
export const saveWebsiteConfig = async (tenantId, newConfig, isPublish = false) => {
  const updated = {
    ...newConfig,
    updatedAt: new Date().toISOString(),
    status: isPublish ? 'published' : 'draft',
    version: (newConfig.version || 1) + (isPublish ? 1 : 0),
  };

  websiteConfigCache.set(tenantId, updated);

  try {
    const docRef = doc(db, 'tenants', tenantId);
    await updateDoc(docRef, {
      websiteConfig: updated,
      websiteVersions: arrayUnion({
        version: updated.version,
        timestamp: new Date().toISOString(),
        status: updated.status,
        config: updated,
      }),
    });
  } catch (err) {
    console.warn(`[WebsiteService] Firestore update skipped (${err.message}). In-memory updated.`);
  }

  return updated;
};

/**
 * Submit admission lead from public college landing page directly into Admissions CRM
 */
export const submitAdmissionLead = async (tenantId, leadData) => {
  const newLead = {
    id: `lead_${Date.now()}`,
    tenantId: tenantId || 'tenant_gvis',
    studentName: leadData.name,
    parentName: leadData.parentName || leadData.name,
    email: leadData.email,
    phone: leadData.phone,
    grade: leadData.course || 'Senior Secondary',
    source: 'Public Website Landing Page',
    status: 'New',
    priority: 'High',
    notes: leadData.message || 'Submitted enquiry via public college website landing page.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Push into Zustand CRM Store immediately for instant Admin UI updates
  try {
    const { addLead } = useCrmStore.getState();
    if (addLead) {
      addLead(newLead);
    }
  } catch {
    // fallback
  }

  // Persist into Firestore CRM collection
  try {
    await addDoc(collection(db, 'crm_leads'), {
      ...newLead,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[WebsiteService] Lead saved to memory. Firestore sync skipped:', err.message);
  }

  return newLead;
};

/**
 * Submit contact message from public landing page
 */
export const submitContactMessage = async (tenantId, messageData) => {
  const messageDoc = {
    tenantId: tenantId || 'tenant_gvis',
    name: messageData.name,
    email: messageData.email,
    phone: messageData.phone,
    subject: messageData.subject || 'Website Enquiry',
    message: messageData.message,
    status: 'unread',
    createdAt: new Date().toISOString(),
  };

  try {
    await addDoc(collection(db, 'website_messages'), {
      ...messageDoc,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[WebsiteService] Message recorded locally:', err.message);
  }

  return messageDoc;
};
