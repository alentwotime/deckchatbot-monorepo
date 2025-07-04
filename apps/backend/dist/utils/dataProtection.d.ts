export default dataProtectionService;
declare const dataProtectionService: DataProtectionService;
/**
 * Data Protection Utility for DeckChatbot
 * Handles encryption, decryption, and data protection policies
 */
declare class DataProtectionService {
    encryptionKey: string;
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
    /**
     * Generate a secure encryption key
     */
    generateEncryptionKey(): string;
    /**
     * Encrypt sensitive data
     * @param {string} plaintext - Data to encrypt
     * @returns {string} - Encrypted data with IV and tag
     */
    encrypt(plaintext: string): string;
    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data with IV and tag
     * @returns {string} - Decrypted plaintext
     */
    decrypt(encryptedData: string): string;
    /**
     * Hash sensitive data (one-way)
     * @param {string} data - Data to hash
     * @param {string} salt - Optional salt
     * @returns {string} - Hashed data
     */
    hash(data: string, salt?: string): string;
    /**
     * Verify hashed data
     * @param {string} data - Original data
     * @param {string} hashedData - Hashed data with salt
     * @returns {boolean} - Whether data matches
     */
    verifyHash(data: string, hashedData: string): boolean;
    /**
     * Encrypt email addresses (PII)
     * @param {string} email - Email to encrypt
     * @returns {string} - Encrypted email
     */
    encryptEmail(email: string): string;
    /**
     * Decrypt email addresses
     * @param {string} encryptedEmail - Encrypted email
     * @returns {string} - Decrypted email
     */
    decryptEmail(encryptedEmail: string): string;
    /**
     * Encrypt API keys and tokens
     * @param {string} apiKey - API key to encrypt
     * @returns {string} - Encrypted API key
     */
    encryptApiKey(apiKey: string): string;
    /**
     * Decrypt API keys and tokens
     * @param {string} encryptedApiKey - Encrypted API key
     * @returns {string} - Decrypted API key
     */
    decryptApiKey(encryptedApiKey: string): string;
    /**
     * Encrypt file metadata
     * @param {object} metadata - File metadata object
     * @returns {string} - Encrypted metadata
     */
    encryptFileMetadata(metadata: object): string;
    /**
     * Decrypt file metadata
     * @param {string} encryptedMetadata - Encrypted metadata
     * @returns {object} - Decrypted metadata object
     */
    decryptFileMetadata(encryptedMetadata: string): object;
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    isValidEmail(email: string): boolean;
    /**
     * Anonymize data for analytics (remove PII)
     * @param {object} data - Data object to anonymize
     * @returns {object} - Anonymized data
     */
    anonymizeData(data: object): object;
    /**
     * Check if data should be retained based on retention policy
     * @param {Date} createdAt - When data was created
     * @param {string} dataType - Type of data (user, session, file, etc.)
     * @returns {boolean} - Whether data should be retained
     */
    shouldRetainData(createdAt: Date, dataType: string): boolean;
    /**
     * Get data retention period for a data type
     * @param {string} dataType - Type of data
     * @returns {number} - Retention period in days
     */
    getRetentionPeriod(dataType: string): number;
    /**
     * Secure delete - overwrite data before deletion
     * @param {string} data - Data to securely delete
     * @returns {string} - Overwritten data
     */
    secureDelete(data: string): string;
    /**
     * Generate data protection report
     * @returns {object} - Data protection status report
     */
    generateProtectionReport(): object;
}
//# sourceMappingURL=dataProtection.d.ts.map