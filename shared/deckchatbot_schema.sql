
-- Table: users
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- Table: sessions
CREATE TABLE sessions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    started_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table: deck_shapes
CREATE TABLE deck_shapes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL,
    shape_type NVARCHAR(50) NOT NULL,
    description TEXT NULL,
    dimensions JSON NOT NULL,
    area_sqft FLOAT,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Table: uploads
CREATE TABLE uploads (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    session_id UNIQUEIDENTIFIER NOT NULL,
    file_name NVARCHAR(255),
    file_url NVARCHAR(2083),
    file_type NVARCHAR(50),
    uploaded_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Table: skirting_options
CREATE TABLE skirting_options (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    deck_shape_id UNIQUEIDENTIFIER NOT NULL,
    material NVARCHAR(50),
    linear_feet FLOAT,
    estimated_cost DECIMAL(10,2),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (deck_shape_id) REFERENCES deck_shapes(id)
);
