\c postgres;

-- Dropar conexões existentes com o template se houver
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'house_template';

-- Dropar o template se existir
DROP DATABASE IF EXISTS house_template;

-- Criar o template
CREATE DATABASE house_template;

-- Conectar ao template
\c house_template;

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;


------------------------------------------------------------
-- Tabelas Principais
------------------------------------------------------------

-- Tabela Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Payers
CREATE TABLE IF NOT EXISTS payers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Tabela Payment
CREATE TABLE IF NOT EXISTS payment (
    id SERIAL PRIMARY KEY,
    payer_id INT REFERENCES payers(id),
    percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100)
);

-- Tabela Payment_Details: para rateios (quando o pagamento envolver mais de um usuário)
CREATE TABLE IF NOT EXISTS payment_details (
    id SERIAL PRIMARY KEY,
    payment_id INT REFERENCES payment(id),
    payer_id INT REFERENCES payers(id),
    percentage NUMERIC(5,2) CHECK (percentage >= 0 AND percentage <= 100)
);

-- Tabela Wallet: registra as atualizações de saldo por usuário
CREATE TABLE IF NOT EXISTS wallet (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    balance NUMERIC(10,2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela Frequency: define as frequências para recorrência, com expressão CRON
CREATE TABLE IF NOT EXISTS frequency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    scheduler_cron VARCHAR(50) NOT NULL
);

-- Tabela Cost_Center
CREATE TABLE IF NOT EXISTS cost_center (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Tabela Category
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    cost_center_id INT REFERENCES cost_center(id),
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- Tabela Currency
CREATE TABLE IF NOT EXISTS currency (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) NOT NULL UNIQUE,
    symbol VARCHAR(5) NOT NULL,
    exchange_rate NUMERIC(10,4) DEFAULT 1.0000
);

-- Tabela Documents
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para Documents (se necessário)
CREATE INDEX IF NOT EXISTS idx_documents ON documents(id);

------------------------------------------------------------
-- Tabelas de Entradas e Tarefas
------------------------------------------------------------

-- Tabela Finance_Entries:
-- A coluna "type" é booleana: false = entrada (income), true = despesa (expense)
-- A coluna payment_id associa o lançamento à forma de rateio
CREATE TABLE IF NOT EXISTS finance_entries (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    category_id INT REFERENCES category(id),
    currency_id INT REFERENCES currency(id),
    amount NUMERIC(10,2) NOT NULL,
    frequency_id INT REFERENCES frequency(id),
    start_date DATE NOT NULL,
    end_date DATE, -- Se NULL, será considerado 1 ano de recorrência
    description TEXT,
    type BOOLEAN DEFAULT false,  -- false: income; true: expense
    payment_id INT REFERENCES payment(id)
);

CREATE INDEX IF NOT EXISTS idx_finance_entries_user ON finance_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_category ON finance_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_entries_currency ON finance_entries(currency_id);

-- Tabela Task_Entries: similar a Finance_Entries, mas para tarefas recorrentes
CREATE TABLE IF NOT EXISTS task_entries (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    category_id INT REFERENCES category(id),
    currency_id INT REFERENCES currency(id),
    amount NUMERIC(10,2) NOT NULL,
    frequency_id INT REFERENCES frequency(id),
    start_date DATE NOT NULL,
    end_date DATE, -- Se NULL, padrão de 1 ano
    description TEXT
);

CREATE INDEX IF NOT EXISTS idx_task_entries_user ON task_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_task_entries_category ON task_entries(category_id);
CREATE INDEX IF NOT EXISTS idx_task_entries_currency ON task_entries(currency_id);

------------------------------------------------------------
-- Tabela Tasks:
-- Utiliza-se os campos entry_type e entry_id para associar tanto Finance_Entries quanto Task_Entries.
-- O campo status é BOOLEAN: false = pendente, true = finalizado.
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    entry_type VARCHAR(50) CHECK (entry_type IN ('Finance_Entries', 'Task_Entries')),
    entry_id INT,
    due_date DATE NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    status BOOLEAN DEFAULT false,  -- false = pendente; true = finalizado
    document_id INT REFERENCES documents(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_entry_type ON tasks(entry_type);
CREATE INDEX IF NOT EXISTS idx_tasks_entry_id ON tasks(entry_id);

------------------------------------------------------------
-- Tabela Transactions:
-- Registra as transações efetuadas com base no fechamento das tasks.
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    finance_entry_id INT REFERENCES finance_entries(id),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

------------------------------------------------------------
-- Função Placeholder para Cálculo da Próxima Data (CRON)
------------------------------------------------------------
/*
  A função cron_next(cron_expression, current_date) deve retornar a próxima data
  de ocorrência com base na expressão CRON a partir de current_date.
  Essa função é apenas um placeholder. Em ambiente de produção, implemente ou utilize uma extensão apropriada.
*/
CREATE OR REPLACE FUNCTION cron_next(p_cron VARCHAR, p_date DATE)
RETURNS DATE AS $$
BEGIN
    -- Exemplo simples: se a expressão for '0 0 1 * *', assume que a próxima data é o primeiro dia do próximo mês.
    -- Essa lógica deve ser substituída por uma interpretação real de CRON.
    RETURN (date_trunc('month', p_date)::date + INTERVAL '1 month')::date;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Função para Gerar Tasks Recorrentes
------------------------------------------------------------
/*
  A função generate_tasks cria tasks para um intervalo entre p_start_date e p_end_date,
  utilizando a expressão CRON (p_cron_expression) para determinar as datas.
  Recebe:
    - p_entry_id e p_entry_type: identificadores para associar a task (Finance_Entries ou Task_Entries)
    - p_amount e p_description: valores para a task
*/
CREATE OR REPLACE FUNCTION generate_tasks(
    p_entry_id INT,
    p_entry_type VARCHAR,
    p_cron_expression VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_amount NUMERIC,
    p_description TEXT
)
RETURNS VOID AS $$
DECLARE
    v_current_date DATE := p_start_date;
    v_next_date DATE;
BEGIN
    -- Se end_date não for informado, assume 1 ano de recorrência
    IF p_end_date IS NULL THEN
        p_end_date := p_start_date + INTERVAL '1 year';
    END IF;
    
    WHILE v_current_date <= p_end_date LOOP
        -- Insere a task se ainda não existir para a data
        IF NOT EXISTS (
            SELECT 1 FROM tasks 
            WHERE entry_type = p_entry_type 
              AND entry_id = p_entry_id 
              AND due_date = v_current_date
        ) THEN
            INSERT INTO tasks(entry_type, entry_id, due_date, amount, description, status)
            VALUES (p_entry_type, p_entry_id, v_current_date, p_amount, p_description, false);
        END IF;
        -- Calcula a próxima data utilizando a função cron_next
        v_next_date := cron_next(p_cron_expression, v_current_date);
        IF v_next_date IS NULL OR v_next_date <= v_current_date THEN
            EXIT;
        END IF;
        v_current_date := v_next_date;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Triggers para Finance_Entries: Inserção e Atualização de Tasks
------------------------------------------------------------

-- Trigger INSERT para Finance_Entries: gera tasks recorrentes no momento do cadastro
CREATE OR REPLACE FUNCTION trg_finance_entry_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_cron VARCHAR;
BEGIN
    SELECT scheduler_cron INTO v_cron FROM frequency WHERE id = NEW.frequency_id;
    PERFORM generate_tasks(
        NEW.id,
        'Finance_Entries',
        v_cron,
        NEW.start_date,
        NEW.end_date,
        NEW.amount,
        NEW.description
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_entry_insert_trigger
AFTER INSERT ON finance_entries
FOR EACH ROW
EXECUTE FUNCTION trg_finance_entry_insert();

-- Trigger UPDATE para Finance_Entries: atualiza tasks futuras (a partir de CURRENT_DATE)
CREATE OR REPLACE FUNCTION trg_finance_entry_update()
RETURNS TRIGGER AS $$
DECLARE
    v_cron VARCHAR;
BEGIN
    IF NEW.start_date <> OLD.start_date OR NEW.amount <> OLD.amount OR NEW.end_date <> OLD.end_date OR NEW.description <> OLD.description THEN
        SELECT scheduler_cron INTO v_cron FROM frequency WHERE id = NEW.frequency_id;
        -- Remove tasks futuras para recriação
        DELETE FROM tasks
         WHERE entry_type = 'Finance_Entries'
           AND entry_id = NEW.id
           AND due_date >= CURRENT_DATE;
           
        PERFORM generate_tasks(
            NEW.id,
            'Finance_Entries',
            v_cron,
            NEW.start_date,
            NEW.end_date,
            NEW.amount,
            NEW.description
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_entry_update_trigger
AFTER UPDATE ON finance_entries
FOR EACH ROW
EXECUTE FUNCTION trg_finance_entry_update();

------------------------------------------------------------
-- Trigger para Gerar Transaction ao Finalizar Task
------------------------------------------------------------
/*
  Quando uma task (associada a uma Finance_Entry) for atualizada e seu status mudar para true,
  insere um registro em transactions.
*/
CREATE OR REPLACE FUNCTION trg_task_status_to_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = true AND (OLD.status IS DISTINCT FROM true) AND NEW.entry_type = 'Finance_Entries' THEN
        INSERT INTO transactions(finance_entry_id, transaction_date, amount, description, created_at)
        VALUES (NEW.entry_id, CURRENT_DATE, NEW.amount, 'Task finalizada: ' || NEW.description, CURRENT_TIMESTAMP);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_status_update_trigger
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION trg_task_status_to_transaction();

------------------------------------------------------------
-- Trigger para Atualizar Wallet ao Inserir Transaction
------------------------------------------------------------
/*
  Ao inserir uma transaction, a função:
    1. Busca a finance_entry associada.
    2. Verifica se há rateio definido em payment_details para o payment relacionado.
    3. Para cada usuário envolvido, recupera o último saldo da wallet, 
       e conforme o tipo (income ou expense) soma ou subtrai a parcela calculada.
    4. Insere uma nova entrada na wallet para cada usuário.
*/
CREATE OR REPLACE FUNCTION trg_transaction_insert_wallet_update()
RETURNS TRIGGER AS $$
DECLARE
    v_finance RECORD;
    rec_detail RECORD;
    v_last_balance NUMERIC;
    v_new_balance NUMERIC;
    rate_found BOOLEAN := false;
BEGIN
    -- Recupera a finance_entry associada à transaction
    SELECT * INTO v_finance FROM finance_entries WHERE id = NEW.finance_entry_id;
    IF NOT FOUND THEN
         RAISE EXCEPTION 'Finance entry % não encontrado', NEW.finance_entry_id;
    END IF;
    
    -- Itera sobre possíveis rateios em payment_details
    FOR rec_detail IN 
        SELECT * FROM payment_details WHERE payment_id = v_finance.payment_id
    LOOP
         rate_found := true;
         -- Garante obter o saldo mais recente usando ORDER BY updated_at DESC, id DESC
         SELECT balance INTO v_last_balance 
           FROM wallet WHERE user_id = rec_detail.payer_id
           ORDER BY updated_at DESC, id DESC 
           LIMIT 1;
         IF v_last_balance IS NULL THEN
             v_last_balance := 0;
         END IF;
         
         -- Se type = false (income) soma; se true (expense) subtrai
         IF v_finance.type = false THEN
             v_new_balance := v_last_balance + (NEW.amount * rec_detail.percentage / 100);
         ELSE
             v_new_balance := v_last_balance - (NEW.amount * rec_detail.percentage / 100);
         END IF;
         
         INSERT INTO wallet(user_id, balance, updated_at)
            VALUES (rec_detail.payer_id, v_new_balance, CURRENT_TIMESTAMP);
    END LOOP;
    
    -- Caso não haja registros em payment_details, utiliza o registro em payment
    IF rate_found = false THEN
         DECLARE
             v_payment RECORD;
         BEGIN
            SELECT * INTO v_payment FROM payment WHERE id = v_finance.payment_id;
            IF NOT FOUND THEN
               RAISE NOTICE 'Nenhuma informação de pagamento para finance_entry %', NEW.finance_entry_id;
               RETURN NEW;
            ELSE
               -- Garante obter o saldo mais recente
               SELECT balance INTO v_last_balance 
                 FROM wallet WHERE user_id = v_payment.payer_id
                 ORDER BY updated_at DESC, id DESC
                 LIMIT 1;
               IF v_last_balance IS NULL THEN
                   v_last_balance := 0;
               END IF;
               
               IF v_finance.type = false THEN
                   v_new_balance := v_last_balance + (NEW.amount * v_payment.percentage / 100);
               ELSE
                   v_new_balance := v_last_balance - (NEW.amount * v_payment.percentage / 100);
               END IF;
               
               INSERT INTO wallet(user_id, balance, updated_at)
                 VALUES (v_payment.payer_id, v_new_balance, CURRENT_TIMESTAMP);
            END IF;
         END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_insert_wallet_update_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION trg_transaction_insert_wallet_update();

------------------------------------------------------------
-- Função para Geração Manual de Tasks (caso seja necessário)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_manual_tasks(
    p_entry_type VARCHAR,
    p_entry_id INT,
    p_cron_expression VARCHAR,
    p_start_date DATE,
    p_end_date DATE,
    p_amount NUMERIC,
    p_description TEXT
)
RETURNS VOID AS $$
BEGIN
    PERFORM generate_tasks(
        p_entry_id,
        p_entry_type,
        p_cron_expression,
        p_start_date,
        p_end_date,
        p_amount,
        p_description
    );
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Fim do Script Completo para o Banco House_Template
------------------------------------------------------------
