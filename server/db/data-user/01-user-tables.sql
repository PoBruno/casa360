-- CREATE STRUCTURE
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    house_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cria a função e a trigger antes de realizar INSERTs em houses
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

CREATE TABLE house_users (
    user_id UUID NOT NULL,
    house_id UUID NOT NULL,
    role TEXT DEFAULT 'viewer',
    PRIMARY KEY (user_id, house_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
);

-- Criação da função para inserir automaticamente na tabela house_users
CREATE OR REPLACE FUNCTION insert_into_house_users() 
RETURNS TRIGGER AS $$ 
BEGIN 
    -- Insere automaticamente na tabela house_users
    INSERT INTO house_users (user_id, house_id, role)
    VALUES (NEW.user_id, NEW.id, 'owner');
    RETURN NEW;
END; 
$$ LANGUAGE plpgsql;

-- Criação da trigger que chama a função após a inserção na tabela houses
CREATE TRIGGER after_insert_house
AFTER INSERT ON houses
FOR EACH ROW
EXECUTE FUNCTION insert_into_house_users();


-- INSERTs na tabela users
INSERT INTO users (username, email, password)
VALUES
    ('user1', 'user1@domain.com', '123'),
    ('user2', 'user2@domain.com', '123');

-- INSERT de exemplo com ponto-e-vírgula ao final
--INSERT INTO houses (user_id, house_name) 
--VALUES ('576cccda-9ee5-4ff0-a810-420b6d2acfe0' ) 
--RETURNING id;
