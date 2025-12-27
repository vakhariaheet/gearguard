/**
 * Search input component for admin dashboard
 */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ position: 'relative', maxWidth: '450px' }}>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            borderRadius: '0.75rem',
            border: '2px solid #e2e8f0',
            fontSize: '1rem',
            backgroundColor: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'all 0.2s ease',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#2563eb';
            e.target.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
          }}
        />
      </div>
    </div>
  );
}