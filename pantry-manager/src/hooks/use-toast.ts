// Simplified toast hook using CustomEvent for Radix UI toasts
export interface ToastProps {
  id?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export interface Toast extends ToastProps {
  id: string;
}

export const useToast = () => {
  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).slice(2, 9);
    window.dispatchEvent(
      new CustomEvent('radix-toast', { detail: { ...props, id } })
    );
  };

  // Mock array of toasts for type compatibility
  const toasts: Toast[] = [];

  return { toast, toasts };
};
