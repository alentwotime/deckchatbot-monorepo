// Custom error class for structured error handling
export class AppError extends Error {
    statusCode;
    isOperational;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
// Async handler wrapper to catch async errors
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// Development error response with full details
const sendErrorDev = (err, res) => {
    const errorResponse = {
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
const sendErrorProd = (err, res) => {
    // Only send operational errors to client in production
    if (err.isOperational) {
        const errorResponse = {
            success: false,
            error: {
                message: err.message,
                code: err.code,
                statusCode: err.statusCode
            }
        };
        res.status(err.statusCode).json(errorResponse);
    }
    else {
        // Programming or unknown errors - don't leak details
        console.error('ERROR:', err);
        const errorResponse = {
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
const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400, 'CAST_ERROR');
};
const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400, 'DUPLICATE_FIELD');
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400, 'VALIDATION_ERROR');
};
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');
// Global error handling middleware
export const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err };
        error.message = err.message;
        // Handle specific error types
        if (error.name === 'CastError')
            error = handleCastErrorDB(error);
        if (error.code === 11000)
            error = handleDuplicateFieldsDB(error);
        if (error.name === 'ValidationError')
            error = handleValidationErrorDB(error);
        if (error.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (error.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        sendErrorProd(error, res);
    }
};
// 404 handler for unhandled routes
export const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
    next(err);
};
// Helper functions for creating common errors
export const createValidationError = (message) => {
    return new AppError(message, 400, 'VALIDATION_ERROR');
};
export const createAuthError = (message = 'Authentication required') => {
    return new AppError(message, 401, 'AUTH_ERROR');
};
export const createForbiddenError = (message = 'Access forbidden') => {
    return new AppError(message, 403, 'FORBIDDEN');
};
export const createNotFoundError = (message = 'Resource not found') => {
    return new AppError(message, 404, 'NOT_FOUND');
};
export const createRateLimitError = (message = 'Too many requests') => {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
};
export const createServerError = (message = 'Internal server error') => {
    return new AppError(message, 500, 'SERVER_ERROR');
};
//# sourceMappingURL=error-handler.js.map