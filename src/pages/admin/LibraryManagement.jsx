// src/pages/admin/LibraryManagement.jsx
import { useState } from 'react';
import { BookOpen, Plus, Download, Trash2, CheckCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { exportToCSV } from '../../services/exportService';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const MOCK_BOOKS = [
  { id: '1', isbn: '978-0131103627', title: 'The C Programming Language', author: 'Brian W. Kernighan', category: 'Computer Science', totalCopies: 15, availableCopies: 9, status: 'In Stock' },
  { id: '2', isbn: '978-0321125217', title: 'Domain-Driven Design', author: 'Eric Evans', category: 'Software Engineering', totalCopies: 8, availableCopies: 2, status: 'In Stock' },
  { id: '3', isbn: '978-0132350884', title: 'Clean Code', author: 'Robert C. Martin', category: 'Software Development', totalCopies: 10, availableCopies: 0, status: 'All Issued' },
];

const LibraryManagement = () => {
  const { userProfile, tenantId: activeTenantId } = useAuthStore();
  const currentTenant = userProfile?.tenantId || activeTenantId || 'tenant_gvis';
  const isCustomCollege = currentTenant && currentTenant !== 'tenant_gvis';

  const [books, setBooks] = useState(() => {
    try {
      const saved = localStorage.getItem(`library_books_${currentTenant}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return isCustomCollege ? [] : MOCK_BOOKS;
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Add Book Form States
  const [bookTitle, setBookTitle] = useState('');
  const [bookISBN, setBookISBN] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCopies, setBookCopies] = useState('5');
  const [bookCategory, setBookCategory] = useState('General');

  // Issue Book Form State
  const [issueStudentName, setIssueStudentName] = useState('');

  const updateBooksState = (newBooks) => {
    setBooks(newBooks);
    try {
      localStorage.setItem(`library_books_${currentTenant}`, JSON.stringify(newBooks));
    } catch {}
  };

  const handleAddBook = (e) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;
    const newBook = {
      id: `bk_${Date.now()}`,
      isbn: bookISBN || `ISBN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      title: bookTitle,
      author: bookAuthor || 'Faculty Author',
      category: bookCategory,
      totalCopies: parseInt(bookCopies) || 1,
      availableCopies: parseInt(bookCopies) || 1,
      status: 'In Stock',
    };
    updateBooksState([newBook, ...books]);
    toast.success(`📚 "${bookTitle}" added to Library catalog!`);
    setShowAddModal(false);
    setBookTitle(''); setBookISBN(''); setBookAuthor(''); setBookCopies('5');
  };

  const handleIssueBook = (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    const updated = books.map(b => b.id === selectedBook.id ? {
      ...b,
      availableCopies: Math.max(0, b.availableCopies - 1),
      status: b.availableCopies - 1 === 0 ? 'All Issued' : 'In Stock',
    } : b);
    updateBooksState(updated);
    toast.success(`📖 "${selectedBook.title}" issued to ${issueStudentName || 'Student'}!`);
    setShowIssueModal(false);
    setIssueStudentName('');
  };

  const handleDeleteBook = (id) => {
    updateBooksState(books.filter(b => b.id !== id));
    toast.success('Book removed from library catalog');
  };

  const columns = [
    { key: 'isbn', label: 'ISBN Code' },
    { key: 'title', label: 'Book Title & Subject', render: (v, r) => <div><strong>{v}</strong><br /><span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>By {r.author}</span></div> },
    { key: 'category', label: 'Category' },
    { key: 'totalCopies', label: 'Total Copies' },
    { key: 'availableCopies', label: 'Available Copies', render: (v, r) => <span><strong>{v}</strong> / {r.totalCopies}</span> },
    { key: 'status', label: 'Availability', render: (v) => <span className={`badge ${v === 'In Stock' ? 'badge-success' : 'badge-danger'}`}>{v}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, r) => (
        <div className="flex gap-1">
          <button
            className="btn btn-secondary btn-sm"
            disabled={r.availableCopies <= 0}
            onClick={() => { setSelectedBook(r); setShowIssueModal(true); }}
            title="Issue book"
          >
            Issue Book
          </button>
          <button
            className="btn btn-ghost btn-icon btn-sm text-danger"
            onClick={() => handleDeleteBook(r.id)}
            title="Remove book"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Digital Library & Book Catalog</h1>
          <p className="page-subtitle">Manage accession register, circulation, book issuing, returns and catalog records</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => exportToCSV('Library_Books', books, columns)}>
            <Download size={16} /> Export Catalog CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add New Book
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={books}
        searchPlaceholder="Search by title, author, category or ISBN..."
      />

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Book to Library Catalog">
        <form onSubmit={handleAddBook}>
          <div className="form-group">
            <label className="form-label">Book Title *</label>
            <input className="form-input" required placeholder="e.g. Higher Engineering Mathematics" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Author Name</label>
              <input className="form-input" placeholder="e.g. Dr. B.S. Grewal" value={bookAuthor} onChange={e => setBookAuthor(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">ISBN Code</label>
              <input className="form-input" placeholder="e.g. 978-8174091955" value={bookISBN} onChange={e => setBookISBN(e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category / Subject</label>
              <select className="form-select" value={bookCategory} onChange={e => setBookCategory(e.target.value)}>
                <option value="General">General Reference</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Literature">Literature</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Initial Copies</label>
              <input className="form-input" type="number" min="1" value={bookCopies} onChange={e => setBookCopies(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Book</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showIssueModal} onClose={() => setShowIssueModal(false)} title={`Issue Book: ${selectedBook?.title}`}>
        <form onSubmit={handleIssueBook}>
          <div className="form-group">
            <label className="form-label">Student Name / Roll Number *</label>
            <input className="form-input" required placeholder="e.g. Rohan Sharma (GV-2026-002)" value={issueStudentName} onChange={e => setIssueStudentName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowIssueModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Issue</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LibraryManagement;
