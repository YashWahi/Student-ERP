// src/components/common/EmptyState.jsx
import { FolderOpen } from 'lucide-react';

const EmptyState = ({
  icon: Icon = FolderOpen,
  title = 'No Records Found',
  description = 'There are no active records matching your criteria in this view.',
  actionLabel,
  onAction,
}) => (
  <div style={{
    padding: '48px 24px', textAlign: 'center', backgroundColor: 'var(--color-bg-surface)',
    borderRadius: 12, border: '1px dashed var(--color-border)', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{
      width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--color-bg-primary)',
      color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16
    }}>
      <Icon size={28} />
    </div>

    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 6 }}>
      {title}
    </h3>
    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: 400, margin: '0 0 20px', lineHeight: 1.5 }}>
      {description}
    </p>

    {actionLabel && onAction && (
      <button className="btn btn-primary" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
