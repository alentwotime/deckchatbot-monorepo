-- Enhanced DeckChatbot Database Schema with Data Protection
-- This schema includes encryption support, data retention, and privacy features

-- Enable necessary extensions for PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: users (Enhanced with data protection)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_encrypted TEXT NOT NULL, -- Encrypted email address
    email_hash TEXT UNIQUE NOT NULL, -- Hashed email for lookups
    consent_given BOOLEAN DEFAULT FALSE, -- GDPR consent
    consent_date TIMESTAMP DEFAULT NULL, -- When consent was given
    data_retention_until DATE DEFAULT NULL, -- When data should be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    deletion_requested BOOLEAN DEFAULT FALSE, -- GDPR right to be forgotten
    deletion_requested_at TIMESTAMP DEFAULT NULL
);

-- Table: user_preferences (New table for privacy settings)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    analytics_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    retention_preference INTEGER DEFAULT 365, -- Days to retain data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: sessions (Enhanced with security features)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token_hash TEXT NOT NULL, -- Hashed session token
    ip_address_encrypted TEXT, -- Encrypted IP address
    user_agent_hash TEXT, -- Hashed user agent
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    security_flags JSONB DEFAULT '{}', -- Security-related flags
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: deck_shapes (Enhanced with encryption)
CREATE TABLE deck_shapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    shape_type VARCHAR(50) NOT NULL,
    description_encrypted TEXT NULL, -- Encrypted description
    dimensions_encrypted TEXT NOT NULL, -- Encrypted dimensions JSON
    area_sqft DECIMAL(10,2),
    metadata_encrypted TEXT, -- Encrypted additional metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL, -- When this data expires
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Table: uploads (Enhanced with security and encryption)
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    file_name_encrypted TEXT, -- Encrypted original filename
    file_path_encrypted TEXT, -- Encrypted file path
    file_url_encrypted TEXT, -- Encrypted file URL
    file_type VARCHAR(50),
    file_size BIGINT,
    file_hash TEXT NOT NULL, -- SHA-256 hash of file content
    metadata_encrypted TEXT, -- Encrypted file metadata
    scan_status VARCHAR(20) DEFAULT 'pending', -- virus/malware scan status
    scan_results JSONB DEFAULT '{}', -- scan results
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL, -- When file should be deleted
    is_sensitive BOOLEAN DEFAULT FALSE, -- Contains PII or sensitive data
    encryption_key_id VARCHAR(50), -- Reference to encryption key used
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Table: skirting_options (Enhanced)
CREATE TABLE skirting_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_shape_id UUID NOT NULL,
    material VARCHAR(50),
    linear_feet DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    cost_encrypted TEXT, -- Encrypted detailed cost breakdown
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL,
    FOREIGN KEY (deck_shape_id) REFERENCES deck_shapes(id) ON DELETE CASCADE
);

-- Table: analyses (New table for AI analysis results)
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    file_ids TEXT[], -- Array of file IDs analyzed
    analysis_type VARCHAR(50) NOT NULL, -- Type of analysis performed
    analysis_data_encrypted TEXT NOT NULL, -- Encrypted analysis results
    confidence_score DECIMAL(3,2), -- AI confidence score
    processing_time_ms INTEGER, -- Time taken for analysis
    model_version VARCHAR(50), -- AI model version used
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Table: blueprints (New table for generated blueprints)
CREATE TABLE blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    analysis_id UUID,
    blueprint_data_encrypted TEXT NOT NULL, -- Encrypted blueprint data
    blueprint_hash TEXT NOT NULL, -- Hash for integrity checking
    format VARCHAR(20) DEFAULT 'svg', -- svg, pdf, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE SET NULL
);

-- Table: audit_logs (New table for security auditing)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id UUID,
    action VARCHAR(100) NOT NULL, -- Action performed
    resource_type VARCHAR(50), -- Type of resource affected
    resource_id UUID, -- ID of affected resource
    ip_address_encrypted TEXT, -- Encrypted IP address
    user_agent_hash TEXT, -- Hashed user agent
    details_encrypted TEXT, -- Encrypted additional details
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    retention_until DATE DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Table: data_processing_logs (GDPR compliance)
CREATE TABLE data_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    processing_purpose VARCHAR(100) NOT NULL, -- Purpose of data processing
    legal_basis VARCHAR(50) NOT NULL, -- GDPR legal basis
    data_categories TEXT[], -- Categories of data processed
    retention_period INTEGER, -- Retention period in days
    consent_id UUID, -- Reference to consent record
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processor VARCHAR(100), -- Who processed the data
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: encryption_keys (Key management)
CREATE TABLE encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_id VARCHAR(50) UNIQUE NOT NULL, -- Key identifier
    key_type VARCHAR(20) NOT NULL, -- Type of key (data, file, etc.)
    algorithm VARCHAR(50) NOT NULL, -- Encryption algorithm
    key_length INTEGER NOT NULL, -- Key length in bits
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Key expiration
    is_active BOOLEAN DEFAULT TRUE,
    rotation_count INTEGER DEFAULT 0, -- Number of times key was rotated
    previous_key_id VARCHAR(50) -- Reference to previous key for rotation
);

-- Indexes for performance and security

-- User indexes
CREATE INDEX idx_users_email_hash ON users(email_hash);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deletion_requested ON users(deletion_requested) WHERE deletion_requested = TRUE;
CREATE INDEX idx_users_retention_until ON users(data_retention_until) WHERE data_retention_until IS NOT NULL;

-- Session indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(session_token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- Upload indexes
CREATE INDEX idx_uploads_session_id ON uploads(session_id);
CREATE INDEX idx_uploads_file_hash ON uploads(file_hash);
CREATE INDEX idx_uploads_retention_until ON uploads(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_uploads_scan_status ON uploads(scan_status);

-- Analysis indexes
CREATE INDEX idx_analyses_session_id ON analyses(session_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_retention_until ON analyses(retention_until) WHERE retention_until IS NOT NULL;

-- Audit log indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_retention_until ON audit_logs(retention_until) WHERE retention_until IS NOT NULL;

-- Data retention indexes
CREATE INDEX idx_deck_shapes_retention_until ON deck_shapes(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_skirting_options_retention_until ON skirting_options(retention_until) WHERE retention_until IS NOT NULL;
CREATE INDEX idx_blueprints_retention_until ON blueprints(retention_until) WHERE retention_until IS NOT NULL;

-- Functions for automatic data retention date setting
CREATE OR REPLACE FUNCTION set_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set retention date based on data type
    CASE TG_TABLE_NAME
        WHEN 'users' THEN
            NEW.data_retention_until := CURRENT_DATE + INTERVAL '7 years';
        WHEN 'sessions' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '90 days';
        WHEN 'uploads' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '1 year';
        WHEN 'analyses' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '1 year';
        WHEN 'blueprints' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '1 year';
        WHEN 'audit_logs' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '30 days';
        WHEN 'deck_shapes' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '1 year';
        WHEN 'skirting_options' THEN
            NEW.retention_until := CURRENT_DATE + INTERVAL '1 year';
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic retention date setting
CREATE TRIGGER set_users_retention_date
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_sessions_retention_date
    BEFORE INSERT ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_uploads_retention_date
    BEFORE INSERT ON uploads
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_analyses_retention_date
    BEFORE INSERT ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_blueprints_retention_date
    BEFORE INSERT ON blueprints
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_audit_logs_retention_date
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_deck_shapes_retention_date
    BEFORE INSERT ON deck_shapes
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

CREATE TRIGGER set_skirting_options_retention_date
    BEFORE INSERT ON skirting_options
    FOR EACH ROW
    EXECUTE FUNCTION set_retention_date();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deck_shapes_updated_at
    BEFORE UPDATE ON deck_shapes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Views for data protection compliance

-- View for user data summary (GDPR Article 15 - Right of access)
CREATE VIEW user_data_summary AS
SELECT 
    u.id,
    u.created_at,
    u.consent_given,
    u.consent_date,
    u.data_retention_until,
    u.deletion_requested,
    COUNT(DISTINCT s.id) as session_count,
    COUNT(DISTINCT up.id) as upload_count,
    COUNT(DISTINCT a.id) as analysis_count,
    MAX(s.last_activity) as last_activity
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
LEFT JOIN uploads up ON s.id = up.session_id
LEFT JOIN analyses a ON s.id = a.session_id
GROUP BY u.id, u.created_at, u.consent_given, u.consent_date, u.data_retention_until, u.deletion_requested;

-- View for data retention monitoring
CREATE VIEW data_retention_status AS
SELECT 
    'users' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE data_retention_until < CURRENT_DATE) as expired_records,
    MIN(data_retention_until) as earliest_expiry,
    MAX(data_retention_until) as latest_expiry
FROM users
WHERE data_retention_until IS NOT NULL
UNION ALL
SELECT 
    'sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE retention_until < CURRENT_DATE) as expired_records,
    MIN(retention_until) as earliest_expiry,
    MAX(retention_until) as latest_expiry
FROM sessions
WHERE retention_until IS NOT NULL
UNION ALL
SELECT 
    'uploads' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE retention_until < CURRENT_DATE) as expired_records,
    MIN(retention_until) as earliest_expiry,
    MAX(retention_until) as latest_expiry
FROM uploads
WHERE retention_until IS NOT NULL
UNION ALL
SELECT 
    'analyses' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE retention_until < CURRENT_DATE) as expired_records,
    MIN(retention_until) as earliest_expiry,
    MAX(retention_until) as latest_expiry
FROM analyses
WHERE retention_until IS NOT NULL;

-- Security policies (Row Level Security examples)
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (users can only see their own data)
-- CREATE POLICY user_isolation_policy ON users
--     FOR ALL
--     TO application_role
--     USING (id = current_setting('app.current_user_id')::uuid);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with encrypted PII and GDPR compliance features';
COMMENT ON TABLE user_preferences IS 'User privacy preferences and consent management';
COMMENT ON TABLE sessions IS 'User sessions with security tracking';
COMMENT ON TABLE uploads IS 'File uploads with encryption and security scanning';
COMMENT ON TABLE analyses IS 'AI analysis results with data retention';
COMMENT ON TABLE blueprints IS 'Generated blueprints with integrity checking';
COMMENT ON TABLE audit_logs IS 'Security audit trail for compliance';
COMMENT ON TABLE data_processing_logs IS 'GDPR data processing records';
COMMENT ON TABLE encryption_keys IS 'Encryption key management';

COMMENT ON COLUMN users.email_encrypted IS 'AES-256-GCM encrypted email address';
COMMENT ON COLUMN users.email_hash IS 'SHA-256 hash of email for unique constraints and lookups';
COMMENT ON COLUMN users.consent_given IS 'GDPR consent status';
COMMENT ON COLUMN users.data_retention_until IS 'Date when user data should be automatically deleted';
COMMENT ON COLUMN uploads.file_hash IS 'SHA-256 hash of file content for integrity verification';
COMMENT ON COLUMN uploads.scan_status IS 'Malware/virus scan status: pending, clean, infected, error';
