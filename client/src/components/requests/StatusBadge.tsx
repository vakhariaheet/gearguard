import { Badge } from '../ui/badge';
import { getStatusIcon, type RequestStatus } from '../../types/requests';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getVariant = (status: RequestStatus) => {
    switch (status) {
      case 'New':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Repaired':
        return 'default';
      case 'Scrap':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge
      variant={getVariant(status)}
      className={cn(
        'inline-flex items-center gap-1',
        status === 'Repaired' && 'bg-green-500 hover:bg-green-600 text-white',
        status === 'In Progress' && 'bg-yellow-500 hover:bg-yellow-600 text-white',
        className
      )}
    >
      <span className="text-xs">{getStatusIcon(status)}</span>
      {status}
    </Badge>
  );
};
