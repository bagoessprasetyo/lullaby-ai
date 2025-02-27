export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SubscriptionError extends ApiError {
  type: 'payment' | 'validation' | 'service';
  validationErrors?: ValidationError[];
}