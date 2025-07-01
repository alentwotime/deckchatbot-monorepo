export const generalLimiter: any;
export const aiLimiter: any;
export const uploadLimiter: any;
export const dbLimiter: any;
export const speedLimiter: any;
export function createCustomLimiter(options?: {}): (req: any, res: any, next: any) => Promise<any>;
export function adaptiveLimiter(baseOptions?: {}): (req: any, res: any, next: any) => Promise<any>;
export function createUserBasedLimiter(getUserLimits: any): (req: any, res: any, next: any) => Promise<any>;
declare namespace _default {
    export { generalLimiter as general };
    export { aiLimiter as ai };
    export { uploadLimiter as upload };
    export { dbLimiter as db };
    export { speedLimiter as speed };
    export { createCustomLimiter as custom };
    export { adaptiveLimiter as adaptive };
    export { createUserBasedLimiter as userBased };
}
export default _default;
//# sourceMappingURL=rateLimiting.d.ts.map