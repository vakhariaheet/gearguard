/**
 * Stats card component for admin dashboard
 */

interface StatsCardProps {
  title: string;
  value: number | string;
  color: string;
}

export function StatsCard({ title, value, color }: StatsCardProps) {
  return (
    <div 
      style={{
        padding: '1.75rem',
        backgroundColor: '#fff',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #f1f5f9',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60px',
        height: '60px',
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        borderRadius: '0 1rem 0 100%',
      }} />
      <h4 style={{ 
        margin: 0, 
        color: '#64748b', 
        fontSize: '0.875rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {title}
      </h4>
      <p style={{ 
        margin: '0.75rem 0 0', 
        fontSize: '2rem', 
        fontWeight: 800, 
        color: '#0f172a',
        lineHeight: 1
      }}>
        {value}
      </p>
    </div>
  );
}