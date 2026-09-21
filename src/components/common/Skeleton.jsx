// src/components/common/Skeleton.jsx
export const SkeletonCard = () => (
  <div className="card" style={{ padding: 20, animation: 'pulse 1.5s infinite ease-in-out' }}>
    <div style={{ width: '40%', height: 16, backgroundColor: 'var(--color-border)', borderRadius: 4, marginBottom: 12 }} />
    <div style={{ width: '70%', height: 28, backgroundColor: 'var(--color-border)', borderRadius: 6, marginBottom: 8 }} />
    <div style={{ width: '30%', height: 14, backgroundColor: 'var(--color-border)', borderRadius: 4 }} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ width: '30%', height: 20, backgroundColor: 'var(--color-border)', borderRadius: 4, marginBottom: 20 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: '25%', height: 16, backgroundColor: 'var(--color-border)', borderRadius: 4 }} />
          <div style={{ width: '20%', height: 16, backgroundColor: 'var(--color-border)', borderRadius: 4 }} />
          <div style={{ width: '35%', height: 16, backgroundColor: 'var(--color-border)', borderRadius: 4 }} />
          <div style={{ width: '15%', height: 16, backgroundColor: 'var(--color-border)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  </div>
);
