import winston from 'winston';
declare const logger: winston.Logger;
export declare const structuredLogger: {
    httpRequest: (req: any, res: any, responseTime?: number) => void;
    dbOperation: (operation: string, table: string, duration?: number, error?: Error) => void;
    apiCall: (service: string, endpoint: string, method: string, statusCode?: number, duration?: number) => void;
    userAction: (userId: string, action: string, resource?: string, metadata?: any) => void;
    securityEvent: (event: string, userId?: string, ip?: string, details?: any) => void;
    performance: (operation: string, duration: number, metadata?: any) => void;
};
export declare const morganStream: {
    write: (message: string) => void;
};
export declare const morganFormat: string;
export declare const logError: (error: Error, context?: string, metadata?: any) => void;
export declare const logInfo: (message: string, metadata?: any) => void;
export declare const logDebug: (message: string, metadata?: any) => void;
export declare const logWarn: (message: string, metadata?: any) => void;
export declare const createChildLogger: (context: string, metadata?: any) => winston.Logger;
export declare const closeLogger: () => Promise<void>;
export default logger;
//# sourceMappingURL=logger.d.ts.map