-- CREATE STRUCTURE
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table with enhanced profile features
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    account_status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, inactive
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to hash password before insert
CREATE OR REPLACE FUNCTION hash_password() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password IS NOT NULL THEN
        NEW.password := crypt(NEW.password, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_users
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION hash_password();

-- Trigger to update timestamp on user update
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- User preferences/settings table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY,
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, system
    language VARCHAR(10) DEFAULT 'pt-BR',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
    default_house_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Enhanced houses table
CREATE TABLE houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    house_name VARCHAR(50) NOT NULL,
    description TEXT,
    address TEXT,
    cover_image_url VARCHAR(255),
    db_created BOOLEAN DEFAULT FALSE, -- Flag to track if the house database has been created
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Set house_name to id if null
CREATE OR REPLACE FUNCTION set_house_name_to_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.house_name IS NULL THEN
        NEW.house_name := NEW.id::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_house
BEFORE INSERT ON houses
FOR EACH ROW
EXECUTE FUNCTION set_house_name_to_id();

-- Update timestamp on houses update
CREATE TRIGGER update_houses_timestamp
BEFORE UPDATE ON houses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Role definitions table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL
);

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
    ('owner', 'Full access to house data and settings', '{"read": true, "write": true, "delete": true, "admin": true}'::jsonb),
    ('member', 'Can view and modify data but not settings', '{"read": true, "write": true, "delete": false, "admin": false}'::jsonb),
    ('visitor', 'Can only view data', '{"read": true, "write": false, "delete": false, "admin": false}'::jsonb);

-- Enhanced house_users table with proper roles
CREATE TABLE house_users (
    user_id UUID NOT NULL,
    house_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'visitor',
    invited_by UUID,
    invitation_status VARCHAR(20) DEFAULT 'accepted', -- pending, accepted, rejected
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, house_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (role) REFERENCES roles(name) ON DELETE RESTRICT,
    CHECK (role IN ('owner', 'member', 'visitor'))
);

-- Update timestamp on house_users update
CREATE TRIGGER update_house_users_timestamp
BEFORE UPDATE ON house_users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Auto-assign owner role when creating a house
CREATE OR REPLACE FUNCTION insert_into_house_users() 
RETURNS TRIGGER AS $$ 
BEGIN 
    -- Insere automaticamente na tabela house_users com role owner
    INSERT INTO house_users (user_id, house_id, role, invitation_status)
    VALUES (NEW.user_id, NEW.id, 'owner', 'accepted');
    
    -- Define esta casa como default para o usuário se ele não tiver uma casa default
    UPDATE user_settings
    SET default_house_id = NEW.id
    WHERE user_id = NEW.user_id AND default_house_id IS NULL;
    
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_house
AFTER INSERT ON houses
FOR EACH ROW
EXECUTE FUNCTION insert_into_house_users();

-- System settings table
CREATE TABLE system_settings (
    key VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insert some default system settings
INSERT INTO system_settings (key, value, description) VALUES
    ('default_theme', '"light"', 'Default theme for new users'),
    ('default_language', '"pt-BR"', 'Default language for new users'),
    ('system_version', '"1.0.0"', 'Current system version'),
    ('maintenance_mode', 'false', 'Whether the system is in maintenance mode');

-- Auto-create user_settings when a user is created
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
DECLARE
    default_theme VARCHAR;
    default_language VARCHAR;
BEGIN
    -- Get system defaults
    SELECT value::text INTO default_theme FROM system_settings WHERE key = 'default_theme';
    SELECT value::text INTO default_language FROM system_settings WHERE key = 'default_language';
    
    -- Remove quotes
    default_theme := REPLACE(default_theme, '"', '');
    default_language := REPLACE(default_language, '"', '');
    
    -- Create user settings with system defaults
    INSERT INTO user_settings (user_id, theme, language)
    VALUES (NEW.id, default_theme, default_language);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_insert_user
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_settings();

-- Add invitation/pending access table
CREATE TABLE house_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL,
    invited_email VARCHAR(100) NOT NULL,
    invited_by UUID NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'visitor',
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role) REFERENCES roles(name) ON DELETE RESTRICT
);

-- Sample users for development
INSERT INTO users (username, email, password, full_name, email_verified)
VALUES
    ('user1', 'user1@domain.com', '123', 'User One', TRUE),
    ('user2', 'user2@domain.com', '123', 'User Two', TRUE);
