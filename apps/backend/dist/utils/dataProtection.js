import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Data Protection Utility for DeckChatbot
 * Handles encryption, decryption, and data protection policies
 */
class DataProtectionService {
    constructor() {
        // Use environment variable or generate a secure key
        this.encryptionKey = process.env.DATA_ENCRYPTION_KEY || this.generateEncryptionKey();
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
        if (!process.env.DATA_ENCRYPTION_KEY) {
            console.warn('⚠️ DATA_ENCRYPTION_KEY not set. Using generated key. Set in production!');
        }
    }
    /**
     * Generate a secure encryption key
     */
    generateEncryptionKey() {
        return crypto.randomBytes(this.keyLength).toString('hex');
    }
    /**
     * Encrypt sensitive data
     * @param {string} plaintext - Data to encrypt
     * @returns {string} - Encrypted data with IV and tag
     */
    encrypt(plaintext) {
        if (!plaintext || typeof plaintext !== 'string') {
            throw new Error('Invalid input for encryption');
        }
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, Buffer.from(this.encryptionKey, 'hex'));
            cipher.setAAD(Buffer.from('DeckChatbot-AAD')); // Additional authenticated data
            let encrypted = cipher.update(plaintext, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            // Combine IV, tag, and encrypted data
            const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
            return result;
        }
        catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt data');
        }
    }
    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Encrypted data with IV and tag
     * @returns {string} - Decrypted plaintext
     */
    decrypt(encryptedData) {
        if (!encryptedData || typeof encryptedData !== 'string') {
            throw new Error('Invalid input for decryption');
        }
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) {
                throw new Error('Invalid encrypted data format');
            }
            const iv = Buffer.from(parts[0], 'hex');
            const tag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            const decipher = crypto.createDecipher(this.algorithm, Buffer.from(this.encryptionKey, 'hex'));
            decipher.setAAD(Buffer.from('DeckChatbot-AAD'));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt data');
        }
    }
    /**
     * Hash sensitive data (one-way)
     * @param {string} data - Data to hash
     * @param {string} salt - Optional salt
     * @returns {string} - Hashed data
     */
    hash(data, salt = null) {
        if (!data || typeof data !== 'string') {
            throw new Error('Invalid input for hashing');
        }
        const actualSalt = salt || crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
        return actualSalt + ':' + hash.toString('hex');
    }
    /**
     * Verify hashed data
     * @param {string} data - Original data
     * @param {string} hashedData - Hashed data with salt
     * @returns {boolean} - Whether data matches
     */
    verifyHash(data, hashedData) {
        try {
            const parts = hashedData.split(':');
            if (parts.length !== 2) {
                return false;
            }
            const salt = parts[0];
            const originalHash = parts[1];
            const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
            return hash.toString('hex') === originalHash;
        }
        catch (error) {
            console.error('Hash verification error:', error);
            return false;
        }
    }
    /**
     * Encrypt email addresses (PII)
     * @param {string} email - Email to encrypt
     * @returns {string} - Encrypted email
     */
    encryptEmail(email) {
        if (!email || !this.isValidEmail(email)) {
            throw new Error('Invalid email address');
        }
        return this.encrypt(email.toLowerCase().trim());
    }
    /**
     * Decrypt email addresses
     * @param {string} encryptedEmail - Encrypted email
     * @returns {string} - Decrypted email
     */
    decryptEmail(encryptedEmail) {
        return this.decrypt(encryptedEmail);
    }
    /**
     * Encrypt API keys and tokens
     * @param {string} apiKey - API key to encrypt
     * @returns {string} - Encrypted API key
     */
    encryptApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key');
        }
        return this.encrypt(apiKey);
    }
    /**
     * Decrypt API keys and tokens
     * @param {string} encryptedApiKey - Encrypted API key
     * @returns {string} - Decrypted API key
     */
    decryptApiKey(encryptedApiKey) {
        return this.decrypt(encryptedApiKey);
    }
    /**
     * Encrypt file metadata
     * @param {object} metadata - File metadata object
     * @returns {string} - Encrypted metadata
     */
    encryptFileMetadata(metadata) {
        if (!metadata || typeof metadata !== 'object') {
            throw new Error('Invalid metadata object');
        }
        return this.encrypt(JSON.stringify(metadata));
    }
    /**
     * Decrypt file metadata
     * @param {string} encryptedMetadata - Encrypted metadata
     * @returns {object} - Decrypted metadata object
     */
    decryptFileMetadata(encryptedMetadata) {
        const decrypted = this.decrypt(encryptedMetadata);
        return JSON.parse(decrypted);
    }
    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} - Whether email is valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    /**
     * Anonymize data for analytics (remove PII)
     * @param {object} data - Data object to anonymize
     * @returns {object} - Anonymized data
     */
    anonymizeData(data) {
        const anonymized = { ...data };
        // Remove or hash PII fields
        const piiFields = ['email', 'name', 'address', 'phone', 'ip_address'];
        piiFields.forEach(field => {
            if (anonymized[field]) {
                // Replace with hashed version for analytics
                anonymized[field] = this.hash(anonymized[field]).split(':')[1].substring(0, 8);
            }
        });
        // Remove file paths and sensitive metadata
        if (anonymized.file_path) {
            delete anonymized.file_path;
        }
        if (anonymized.file_url) {
            delete anonymized.file_url;
        }
        return anonymized;
    }
    /**
     * Check if data should be retained based on retention policy
     * @param {Date} createdAt - When data was created
     * @param {string} dataType - Type of data (user, session, file, etc.)
     * @returns {boolean} - Whether data should be retained
     */
    shouldRetainData(createdAt, dataType) {
        const now = new Date();
        const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
        const retentionPolicies = {
            user: 2555, // 7 years for user accounts
            session: 90, // 3 months for sessions
            file: 365, // 1 year for uploaded files
            analysis: 365, // 1 year for analysis results
            logs: 30, // 1 month for logs
            cache: 7, // 1 week for cache entries
            temp: 1 // 1 day for temporary data
        };
        const retentionDays = retentionPolicies[dataType] || retentionPolicies.temp;
        return ageInDays <= retentionDays;
    }
    /**
     * Get data retention period for a data type
     * @param {string} dataType - Type of data
     * @returns {number} - Retention period in days
     */
    getRetentionPeriod(dataType) {
        const retentionPolicies = {
            user: 2555, // 7 years
            session: 90, // 3 months
            file: 365, // 1 year
            analysis: 365, // 1 year
            logs: 30, // 1 month
            cache: 7, // 1 week
            temp: 1 // 1 day
        };
        return retentionPolicies[dataType] || retentionPolicies.temp;
    }
    /**
     * Secure delete - overwrite data before deletion
     * @param {string} data - Data to securely delete
     * @returns {string} - Overwritten data
     */
    secureDelete(data) {
        if (!data || typeof data !== 'string') {
            return '';
        }
        // Overwrite with random data multiple times
        let overwritten = data;
        for (let i = 0; i < 3; i++) {
            overwritten = crypto.randomBytes(data.length).toString('hex').substring(0, data.length);
        }
        return overwritten;
    }
    /**
     * Generate data protection report
     * @returns {object} - Data protection status report
     */
    generateProtectionReport() {
        return {
            encryptionEnabled: !!this.encryptionKey,
            algorithm: this.algorithm,
            keyLength: this.keyLength,
            retentionPolicies: {
                user: '7 years',
                session: '3 months',
                file: '1 year',
                analysis: '1 year',
                logs: '1 month',
                cache: '1 week',
                temp: '1 day'
            },
            features: {
                encryption: 'AES-256-GCM',
                hashing: 'PBKDF2-SHA512',
                anonymization: 'Enabled',
                secureDelete: 'Enabled',
                retentionManagement: 'Enabled'
            },
            compliance: {
                gdpr: 'Partial - requires user consent management',
                ccpa: 'Partial - requires user rights management',
                hipaa: 'Not applicable',
                pci: 'Not applicable'
            }
        };
    }
}
// Export singleton instance
const dataProtectionService = new DataProtectionService();
export default dataProtectionService;
//# sourceMappingURL=dataProtection.js.map