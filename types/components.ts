export interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface StepProps<T> {
  data: T;
  onUpdate: (field: keyof T, value: any) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
}