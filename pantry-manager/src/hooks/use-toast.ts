// Simplified toast hook using CustomEvent for Radix UI toasts
export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const useToast = () => {
  const toast = (props: ToastProps) => {
    window.dispatchEvent(new CustomEvent('radix-toast', { detail: props }));
  };
  return { toast };
};
