-- Habilita a extensão pgcrypto (necessária para hashing e geração de UUID)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- a senha será armazenada já hashada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger e função para hashear a senha no insert
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
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

-- Cria o sequence:
CREATE SEQUENCE house_id_seq;

-- Cria a função que gera o house_id no formato desejado
CREATE OR REPLACE FUNCTION generate_house_id()
RETURNS TEXT AS
$$
DECLARE
    seq_val INT := nextval('house_id_seq');
    -- Gera algumas letras aleatórias (A-Z)
    letterA CHAR := chr((random() * 25)::int + 65);
    letterB CHAR := chr((random() * 25)::int + 65);
BEGIN
    /*
      Ajuste a lógica conforme o padrão que deseja.
      Abaixo é só um exemplo básico para ilustrar.
    */
    RETURN lpad(seq_val::text, 4, '0') || '-' ||
           '0' || letterA || '0'       || '-' ||
           lpad(seq_val::text, 4, '0') || '-' ||
           lpad(seq_val::text, 3, '0') || letterB;
END;
$$ LANGUAGE plpgsql;

-- Cria a tabela e utiliza a função para preencher house_id
CREATE TABLE houses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    house_id TEXT NOT NULL DEFAULT generate_house_id(),
    house_db_name VARCHAR(50) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Inserts iniciais: 2 usuários, 2 casas para cada usuário e um api_token para cada

-- Insere 2 usuários (as senhas serão automaticamente hashadas pelo trigger)
INSERT INTO users (username, email, password) VALUES
('user1', 'user1@domain.com', 'password'),
('user2', 'user2@domain.com', 'password');

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "user3", "email": "user3@domain.com", "password": "password"}'