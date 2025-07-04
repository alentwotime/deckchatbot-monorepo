import winston from 'winston';
import path from 'path';
import fs from 'fs';
// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
// Define log levels
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// Define colors for each log level
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(logColors);
// Development format - colorized and readable
const developmentFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston.format.colorize({ all: true }), winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`));
// Production format - structured JSON
const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
// File format - structured but readable
const fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
}));
// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';
// Create transports
const transports = [];
// Console transport
transports.push(new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? productionFormat : developmentFormat,
}));
// File transports
if (isProduction) {
    // Production file transports
    transports.push(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }), new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
else {
    // Development file transport
    transports.push(new winston.transports.File({
        filename: path.join(logsDir, 'development.log'),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
    }));
}
// Create the logger
const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    levels: logLevels,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true })),
    transports,
    exitOnError: false,
});
// Structured logging helpers
export const structuredLogger = {
    // HTTP request logging
    httpRequest: (req, res, responseTime) => {
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            responseTime: responseTime ? `${responseTime}ms` : undefined,
        };
        if (res.statusCode >= 400) {
            logger.warn('HTTP Request', logData);
        }
        else {
            logger.http('HTTP Request', logData);
        }
    },
    // Database operation logging
    dbOperation: (operation, table, duration, error) => {
        const logData = {
            operation,
            table,
            duration: duration ? `${duration}ms` : undefined,
            error: error?.message,
        };
        if (error) {
            logger.error('Database Operation Failed', logData);
        }
        else {
            logger.debug('Database Operation', logData);
        }
    },
    // API call logging
    apiCall: (service, endpoint, method, statusCode, duration) => {
        const logData = {
            service,
            endpoint,
            method,
            statusCode,
            duration: duration ? `${duration}ms` : undefined,
        };
        if (statusCode && statusCode >= 400) {
            logger.warn('External API Call Failed', logData);
        }
        else {
            logger.info('External API Call', logData);
        }
    },
    // User action logging
    userAction: (userId, action, resource, metadata) => {
        const logData = {
            userId,
            action,
            resource,
            metadata,
        };
        logger.info('User Action', logData);
    },
    // Security event logging
    securityEvent: (event, userId, ip, details) => {
        const logData = {
            event,
            userId,
            ip,
            details,
            severity: 'high',
        };
        logger.warn('Security Event', logData);
    },
    // Performance logging
    performance: (operation, duration, metadata) => {
        const logData = {
            operation,
            duration: `${duration}ms`,
            metadata,
        };
        if (duration > 1000) {
            logger.warn('Slow Operation', logData);
        }
        else {
            logger.debug('Performance', logData);
        }
    },
};
// Morgan integration for HTTP request logging
export const morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Morgan format for different environments
export const morganFormat = isProduction
    ? 'combined'
    : ':method :url :status :res[content-length] - :response-time ms';
// Error logging helper
export const logError = (error, context, metadata) => {
    const logData = {
        message: error.message,
        stack: error.stack,
        context,
        metadata,
    };
    logger.error('Application Error', logData);
};
// Info logging helper
export const logInfo = (message, metadata) => {
    logger.info(message, metadata);
};
// Debug logging helper
export const logDebug = (message, metadata) => {
    logger.debug(message, metadata);
};
// Warn logging helper
export const logWarn = (message, metadata) => {
    logger.warn(message, metadata);
};
// Create child logger with additional context
export const createChildLogger = (context, metadata) => {
    return logger.child({ context, ...metadata });
};
// Graceful shutdown
export const closeLogger = () => {
    return new Promise((resolve) => {
        logger.end(() => {
            resolve();
        });
    });
};
export default logger;
//# sourceMappingURL=logger.js.map