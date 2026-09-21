// src/components/common/DataTable.jsx
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';

const DataTable = ({
  columns,
  data = [],
  searchable = true,
  searchPlaceholder = 'Search...',
  actions,
  title,
  subtitle,
  pageSize = 10,
  loading = false,
  emptyText = 'No records found',
  onExport,
}) => {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SkeletonRow = () => (
    <tr>
      {columns.map((_, i) => (
        <td key={i} style={{ padding: '14px 20px' }}>
          <div className="skeleton" style={{ height: 16, width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );

  return (
    <div className="data-table-wrapper">
      {/* Header */}
      {(title || searchable || actions || onExport) && (
        <div className="data-table-header">
          <div>
            {title && <h4 style={{ margin: 0 }}>{title}</h4>}
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {searchable && (
              <div className="data-table-search">
                <Search size={14} color="var(--text-muted)" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}
            {onExport && (
              <button className="btn btn-ghost btn-sm" onClick={onExport}>
                <Download size={14} /> Export
              </button>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{ cursor: col.sortable !== false && col.key ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(pageSize).fill(0).map((_, i) => <SkeletonRow key={i} />)
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <div className="empty-title">{emptyText}</div>
                    {search && <div className="empty-desc">Try adjusting your search</div>}
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {paged.map((row, ri) => (
                  <motion.tr
                    key={row.id || ri}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: ri * 0.03 }}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer flex items-center justify-between">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p = i + 1;
              if (totalPages > 5) {
                if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
              }
              return (
                <button
                  key={p}
                  className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setPage(p)}
                  style={{ minWidth: 32, padding: '6px 10px' }}
                >
                  {p}
                </button>
              );
            })}
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
