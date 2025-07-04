export const enhancedCSP: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export class InputSanitizer {
    static sanitizeString(input: any, maxLength?: number): string;
    static sanitizeNumber(input: any, min?: number, max?: number): number;
    static sanitizeEmail(email: any): string | false;
    static sanitizeFilename(filename: any): string;
    static sanitizeSVGContent(svgContent: any): any;
}
export function csrfProtection(req: any, res: any, next: any): any;
export function generateCSRFToken(req: any, res: any): void;
export function secureFileUpload(req: any, res: any, next: any): any;
export function validateRequest(schema: any): (req: any, res: any, next: any) => void;
export function securityHeaders(req: any, res: any, next: any): void;
declare namespace _default {
    export { enhancedCSP };
    export { InputSanitizer };
    export { csrfProtection };
    export { generateCSRFToken };
    export { secureFileUpload };
    export { validateRequest };
    export { securityHeaders };
}
export default _default;
//# sourceMappingURL=security.d.ts.map