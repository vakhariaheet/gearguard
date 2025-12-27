import { toast as sonnerToast } from 'sonner';

// Simple wrapper around sonner for compatibility with shadcn/ui patterns
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
};

export { toast as useToast };
