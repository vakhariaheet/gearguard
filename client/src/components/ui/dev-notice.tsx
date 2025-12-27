import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export const DevNotice = () => {
  return (
    <Alert className="mb-4 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Development Mode:</strong> Backend APIs are not running. Displaying demo data for
        M07 features. Deploy the backend to see live data.
      </AlertDescription>
    </Alert>
  );
};
