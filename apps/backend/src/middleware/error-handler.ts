import { Request, Response, NextFunction } from 'express';

// Custom error class for structured error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper to catch async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    stack?: string;
    details?: any;
  };
}

// Development error response with full details
const sendErrorDev = (err: AppError, res: Response): void => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
      details: err
    }
  };

  res.status(err.statusCode).json(errorResponse);
};

// Production error response with limited details
const sendErrorProd = (err: AppError, res: Response): void => {
  // Only send operational errors to client in production
  if (err.isOperational) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        code: err.code,
        statusCode: err.statusCode
      }
    };

    res.status(err.statusCode).json(errorResponse);
  } else {
    // Programming or unknown errors - don't leak details
    console.error('ERROR:', err);
    
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        message: 'Something went wrong!',
        statusCode: 500
      }
    };

    res.status(500).json(errorResponse);
  }
};

// Handle specific error types
const handleCastErrorDB = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'CAST_ERROR');
};

const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

// Global error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// 404 handler for unhandled routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
  next(err);
};

// Helper functions for creating common errors
export const createValidationError = (message: string): AppError => {
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

export const createAuthError = (message: string = 'Authentication required'): AppError => {
  return new AppError(message, 401, 'AUTH_ERROR');
};

export const createForbiddenError = (message: string = 'Access forbidden'): AppError => {
  return new AppError(message, 403, 'FORBIDDEN');
};

export const createNotFoundError = (message: string = 'Resource not found'): AppError => {
  return new AppError(message, 404, 'NOT_FOUND');
};

export const createRateLimitError = (message: string = 'Too many requests'): AppError => {
  return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
};

export const createServerError = (message: string = 'Internal server error'): AppError => {
  return new AppError(message, 500, 'SERVER_ERROR');
};
