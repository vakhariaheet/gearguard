/**
 * Pagination component for admin dashboard
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1.5rem',
      borderTop: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
    }}>
      <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            backgroundColor: currentPage <= 1 ? '#f1f5f9' : '#fff',
            color: currentPage <= 1 ? '#94a3b8' : '#374151',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
          }}
        >
          ← Previous
        </button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #e2e8f0',
                backgroundColor: currentPage === pageNum ? '#2563eb' : '#fff',
                color: currentPage === pageNum ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '0.875rem',
                minWidth: '40px',
              }}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            backgroundColor: currentPage >= totalPages ? '#f1f5f9' : '#fff',
            color: currentPage >= totalPages ? '#94a3b8' : '#374151',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}