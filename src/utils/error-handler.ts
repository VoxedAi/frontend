import { z } from 'zod';
import toast from 'react-hot-toast';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      cause?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code || 'APP_ERROR';
    this.status = options.status || 500;
    this.cause = options.cause;
    this.context = options.context;
  }
}

/**
 * Handle errors consistently throughout the application
 */
export function handleError(error: unknown, fallbackMessage = 'An unexpected error occurred'): AppError {
  // Already an AppError, just return it
  if (error instanceof AppError) {
    // Log the error in development
    if (import.meta.env.DEV) {
      console.error(`[${error.code}]`, error.message, error.context || '');
    }
    
    // Show toast notification
    toast.error(error.message);
    return error;
  }
  
  // Zod validation error
  if (error instanceof z.ZodError) {
    const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    const appError = new AppError(`Validation error: ${message}`, {
      code: 'VALIDATION_ERROR',
      status: 400,
      cause: error,
      context: { zodErrors: error.errors },
    });
    
    // Log the error in development
    if (import.meta.env.DEV) {
      console.error(`[${appError.code}]`, appError.message, appError.context || '');
    }
    
    // Show toast notification
    toast.error('Please check your input and try again');
    return appError;
  }
  
  // Generic error handling
  const message = error instanceof Error ? error.message : String(error);
  const appError = new AppError(message || fallbackMessage, {
    code: 'UNKNOWN_ERROR',
    status: 500,
    cause: error instanceof Error ? error : undefined,
  });
  
  // Log the error in development
  if (import.meta.env.DEV) {
    console.error(`[${appError.code}]`, appError.message, error);
  }
  
  // Show toast notification
  toast.error(appError.message);
  return appError;
}

/**
 * Create a safe async function that catches errors
 */
export function createSafeAsyncFunction<Args extends any[], Return>(
  fn: (...args: Args) => Promise<Return>,
  options: {
    fallbackValue?: Return;
    fallbackMessage?: string;
    onError?: (error: AppError) => void;
  } = {}
): (...args: Args) => Promise<Return | undefined> {
  return async (...args: Args): Promise<Return | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, options.fallbackMessage);
      options.onError?.(appError);
      return options.fallbackValue;
    }
  };
}

export default handleError; 