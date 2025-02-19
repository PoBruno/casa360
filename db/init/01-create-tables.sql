---------------------------------------------------------------------------
-- Esquema do Banco de Dados para Sistema Financeiro + Compras/RFPs
--
-- Este script implementa:
--   • Tabelas com colunas de auditoria (created_at e updated_at)
--   • Validações de integridade e de regras de negócio por meio de constraints e triggers
--   • Log de erros enriquecido para triggers, armazenando informações detalhadas sobre a operação
--   • Módulo de Compras/RFPs com tabelas para solicitações de compra, produtos e fornecedores
--   • Registro de cada atualização do saldo dos usuários em uma tabela específica (User_Wallet_History)
--   • Índices adicionais em campos frequentemente consultados (status, datas, etc.)
---------------------------------------------------------------------------

----------------------------------------------
-- 0. Tabela de Log de Erros para Triggers
-- Registra erros ocorridos durante a execução de triggers, permitindo uma depuração mais eficiente.
----------------------------------------------
CREATE TABLE Trigger_Error_Log (
    id SERIAL PRIMARY KEY,
    trigger_name VARCHAR(100),         -- Nome do trigger
    function_name VARCHAR(100),        -- Nome da função que foi executada
    operation VARCHAR(50),             -- Tipo de operação (INSERT, UPDATE, DELETE, etc.)
    input_data JSONB,                  -- Dados de entrada que ocasionaram o erro
    error_message TEXT NOT NULL,       -- Mensagem de erro detalhada
    error_time TIMESTAMP DEFAULT NOW() -- Timestamp do erro
);

----------------------------------------------
-- Função Genérica para Atualizar o Campo updated_at
-- Será utilizada em triggers de atualização para manter o registro da última modificação.
----------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

----------------------------------------------
-- 1. Tabela Users (Usuários)
--
-- Armazena os dados dos usuários do sistema, com validação de email, campos para autenticação
-- e auditoria. Note que a coluna wallet NÃO possui restrição para valores negativos.
----------------------------------------------
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                         -- Nome completo do usuário
    email VARCHAR(255) NOT NULL UNIQUE                  -- Email, com validação de formato via expressão regular
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    wallet DECIMAL(10,2) DEFAULT 0,                     -- Saldo do usuário (podendo ser negativo)
    password_hash VARCHAR(255),                         -- Senha criptografada para autenticação
    account_status VARCHAR(50) DEFAULT 'active',        -- Status da conta (ex.: active, suspended)
    created_at TIMESTAMP DEFAULT NOW(),                 -- Data de criação do registro
    updated_at TIMESTAMP DEFAULT NOW()                  -- Data da última atualização
);

-- Índice extra para email (único já gera índice, mas reforça consultas)
CREATE INDEX idx_users_email ON Users(email);

-- Trigger para atualizar o campo updated_at
CREATE TRIGGER trg_update_users_updated_at
BEFORE UPDATE ON Users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- Tabela para Registro de Atualizações do Saldo dos Usuários
-- Cada alteração (crédito ou débito) é registrada nesta tabela.
----------------------------------------------
CREATE TABLE User_Wallet_History (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                              -- Referência ao usuário
    change_amount DECIMAL(10,2) NOT NULL,              -- Valor alterado (positivo ou negativo)
    resulting_balance DECIMAL(10,2) NOT NULL,          -- Saldo resultante após a alteração
    change_date TIMESTAMP DEFAULT NOW(),               -- Data/hora da alteração
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

----------------------------------------------
-- 2. Tabela Finance_Frequency (Frequência Financeira)
--
-- Define os intervalos para entradas financeiras (ex.: mensal, semanal).
----------------------------------------------
CREATE TABLE Finance_Frequency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,              -- Ex.: Mensal, Semanal, etc.
    days_interval INT NOT NULL DEFAULT 30,    -- Intervalo em dias (padrão: 30 dias)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_frequency_updated_at
BEFORE UPDATE ON Finance_Frequency
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 3. Tabela Finance_CC (Centro de Custo)
--
-- Representa centros de custo para classificação interna de gastos.
----------------------------------------------
CREATE TABLE Finance_CC (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,  -- Nome do centro de custo
    description TEXT,            -- Descrição detalhada do centro de custo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_cc_updated_at
BEFORE UPDATE ON Finance_CC
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 4. Tabela Finance_Category (Categorias Financeiras)
--
-- Permite classificar as entradas financeiras em categorias e subcategorias.
-- Possui hierarquia com categoria pai e validação para evitar loops.
----------------------------------------------
CREATE TABLE Finance_Category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,       -- Nome da categoria
    parent_category_id INT NULL,        -- Referência à categoria pai (para hierarquia)
    description TEXT,                   -- Descrição da categoria
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_no_self_parent CHECK (parent_category_id IS NULL OR parent_category_id <> id),
    FOREIGN KEY (parent_category_id)
        REFERENCES Finance_Category(id) ON DELETE CASCADE
    -- OBS.: Para hierarquias mais complexas, considere modelos como Nested Sets ou Materialized Paths.
);

CREATE TRIGGER trg_update_finance_category_updated_at
BEFORE UPDATE ON Finance_Category
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 5. Tabelas Finance_Payer e Finance_Payer_Users
--
-- Finance_Payer: Representa a entidade que efetua o pagamento.
-- Finance_Payer_Users: Tabela associativa que distribui percentuais entre usuários.
-- A soma dos percentuais para cada Finance_Payer deverá ser igual a 100.
----------------------------------------------
CREATE TABLE Finance_Payer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,   -- Nome do pagador
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_payer_updated_at
BEFORE UPDATE ON Finance_Payer
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela associativa entre Finance_Payer e Users
CREATE TABLE Finance_Payer_Users (
    finance_payer_id INT NOT NULL,                  -- Referência ao Finance_Payer
    user_id INT NOT NULL,                           -- Referência ao usuário
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),  -- Percentual atribuído
    PRIMARY KEY (finance_payer_id, user_id),
    FOREIGN KEY (finance_payer_id) REFERENCES Finance_Payer(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Trigger para validar que a soma dos percentuais para cada Finance_Payer seja 100
CREATE OR REPLACE FUNCTION check_finance_payer_users_sum()
RETURNS TRIGGER AS $$
DECLARE
    total NUMERIC;
    current_payer_id INT;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        current_payer_id := OLD.finance_payer_id;
    ELSE
        current_payer_id := NEW.finance_payer_id;
    END IF;
    
    SELECT COALESCE(SUM(percentage), 0)
      INTO total
      FROM Finance_Payer_Users
      WHERE finance_payer_id = current_payer_id;
      
    IF total <> 100 THEN
        RAISE EXCEPTION 'A soma dos percentuais para finance_payer_id % deve ser 100. Atualmente: %', current_payer_id, total;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_finance_payer_users_sum
AFTER INSERT OR UPDATE OR DELETE ON Finance_Payer_Users
FOR EACH ROW EXECUTE FUNCTION check_finance_payer_users_sum();

----------------------------------------------
-- 6. Tabela Finance_Currency (Moedas e Taxas de Câmbio)
--
-- Armazena informações sobre moedas e suas taxas de câmbio.
----------------------------------------------
CREATE TABLE Finance_Currency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,                 -- Nome da moeda (ex.: Dólar, Euro)
    symbol VARCHAR(10) NOT NULL,               -- Símbolo da moeda (ex.: $, €)
    exchange_rate DECIMAL(10,4) NOT NULL CHECK (exchange_rate > 0),  -- Taxa de câmbio
    last_updated TIMESTAMP DEFAULT NOW(),      -- Data da última atualização da taxa
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_currency_updated_at
BEFORE UPDATE ON Finance_Currency
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 7. Tabela Finance_Entries (Entradas Financeiras)
--
-- Registra entradas e saídas financeiras, com vínculos a centros de custo,
-- categorias, pagadores, moedas e frequência de repetição.
----------------------------------------------
CREATE TABLE Finance_Entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                         -- Usuário responsável pela entrada
    finance_cc_id INT NOT NULL,                   -- Centro de custo associado
    finance_category_id INT NOT NULL,             -- Categoria da entrada
    finance_payer_id INT NOT NULL,                -- Pagador associado (Finance_Payer)
    finance_currency_id INT NOT NULL,             -- Moeda utilizada
    finance_frequency_id INT NULL,                -- Frequência da entrada (para parcelamento/recorrência)
    is_income BOOLEAN NOT NULL,                   -- TRUE para receita; FALSE para despesa
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),  -- Valor da entrada
    start_date DATE NOT NULL,                     -- Data de início
    end_date DATE NULL,                           -- Data de término (para recorrência)
    description TEXT,                             -- Descrição detalhada da entrada
    installments_count INT DEFAULT 1 CHECK (installments_count > 0),  -- Número de parcelas
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_cc_id) REFERENCES Finance_CC(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_category_id) REFERENCES Finance_Category(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_payer_id) REFERENCES Finance_Payer(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_currency_id) REFERENCES Finance_Currency(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_frequency_id) REFERENCES Finance_Frequency(id) ON DELETE SET NULL
);

CREATE TRIGGER trg_update_finance_entries_updated_at
BEFORE UPDATE ON Finance_Entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 8. Tabela Finance_Installments (Parcelas)
--
-- Gera as parcelas de uma entrada financeira, com status para controle (ex.: pending, paid, overdue).
----------------------------------------------
CREATE TABLE Finance_Installments (
    id SERIAL PRIMARY KEY,
    finance_entries_id INT NOT NULL,                -- Referência à entrada financeira
    installment_number INT NOT NULL,                  -- Número da parcela
    due_date DATE NOT NULL,                           -- Data de vencimento
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),   -- Valor da parcela
    status VARCHAR(50) DEFAULT 'pending',             -- Status da parcela (pending, paid, overdue)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (finance_entries_id) REFERENCES Finance_Entries(id) ON DELETE CASCADE,
    CONSTRAINT uq_installment UNIQUE (finance_entries_id, installment_number)
);

CREATE TRIGGER trg_update_finance_installments_updated_at
BEFORE UPDATE ON Finance_Installments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 9. Tabela Transactions (Transações)
--
-- Registra as transações realizadas, vinculadas às parcelas, com status e auditoria.
----------------------------------------------
CREATE TABLE Transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                           -- Usuário que realizou a transação
    finance_installments_id INT NOT NULL,            -- Referência à parcela
    transaction_date TIMESTAMP DEFAULT NOW(),        -- Data/hora da transação
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),  -- Valor da transação
    is_income BOOLEAN NOT NULL,                      -- TRUE para receita; FALSE para despesa
    description TEXT,                                -- Descrição detalhada da transação
    status VARCHAR(50) DEFAULT 'pending',            -- Status da transação (pending, completed, failed)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_installments_id) REFERENCES Finance_Installments(id) ON DELETE CASCADE
);

-- Índices adicionais para otimizar consultas por data, status e usuário
CREATE INDEX idx_transactions_date ON Transactions(transaction_date);
CREATE INDEX idx_transactions_status ON Transactions(status);
CREATE INDEX idx_transactions_user ON Transactions(user_id);

CREATE TRIGGER trg_update_transactions_updated_at
BEFORE UPDATE ON Transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 10. Módulo de Compras / RFPs Domésticos
--
-- Permite o cadastro de solicitações de compra, produtos e fornecedores, integrando o fluxo financeiro.
----------------------------------------------

-- 10.1 Tabela RFP (Solicitação de Compra)
CREATE TABLE RFP (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                  -- Título da solicitação
    description TEXT,                             -- Descrição detalhada da RFP
    created_by INT NOT NULL,                      -- Usuário que criou a RFP
    status VARCHAR(50) DEFAULT 'pending',         -- Status da RFP (pending, approved, rejected)
    created_at TIMESTAMP DEFAULT NOW(),           -- Data de criação
    updated_at TIMESTAMP DEFAULT NOW(),           -- Data da última atualização
    approved_at TIMESTAMP NULL,                   -- Data de aprovação (se houver)
    approved_by INT NULL,                         -- Usuário que aprovou a RFP
    approval_notes TEXT,                          -- Observações sobre a aprovação
    FOREIGN KEY (created_by) REFERENCES Users(id),
    FOREIGN KEY (approved_by) REFERENCES Users(id)
);

-- Índices para otimização de consultas por status e datas
CREATE INDEX idx_rfp_status ON RFP(status);
CREATE INDEX idx_rfp_created_at ON RFP(created_at);

CREATE TRIGGER trg_update_rfp_updated_at
BEFORE UPDATE ON RFP
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.2 Tabela Suppliers (Fornecedores)
CREATE TABLE Suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,          -- Nome do fornecedor
    contact_info TEXT,                   -- Informações de contato (pode ser JSON ou texto estruturado)
    website VARCHAR(255),                -- Website do fornecedor
    address TEXT,                        -- Endereço
    supplier_type VARCHAR(50),           -- Tipo (ex.: physical store, e-commerce)
    rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),  -- Avaliação do fornecedor
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_suppliers_updated_at
BEFORE UPDATE ON Suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.3 Tabela Products (Produtos/Itens da Compra)
CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                -- Nome do produto
    description TEXT,                          -- Descrição detalhada
    category_id INT NULL,                      -- Categoria do produto (referência a Finance_Category)
    quantity INT NOT NULL DEFAULT 1,           -- Quantidade do produto
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),  -- Preço unitário
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,  -- Cálculo automático do total
    supplier_id INT NULL,                      -- Fornecedor associado
    rfp_id INT NULL,                           -- Associação com a RFP
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES Finance_Category(id),
    FOREIGN KEY (supplier_id) REFERENCES Suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (rfp_id) REFERENCES RFP(id) ON DELETE SET NULL
);

-- Índice para facilitar consultas por RFP
CREATE INDEX idx_products_rfp ON Products(rfp_id);

CREATE TRIGGER trg_update_products_updated_at
BEFORE UPDATE ON Products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

----------------------------------------------
-- 11. Triggers e Funções de Integração no Módulo Financeiro
----------------------------------------------

------------------------------------------------------------
-- Trigger: Gerar Parcelas automaticamente após inserir uma entrada
--
-- Cria as parcelas (Finance_Installments) com base no número de parcelas definido
-- em Finance_Entries, calculando a data de vencimento conforme a frequência.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_installments()
RETURNS TRIGGER AS $$
DECLARE
    l_days_interval INT;
    current_installment INT := 1;
    installment_due_date DATE := NEW.start_date;
BEGIN
    IF NEW.finance_frequency_id IS NOT NULL THEN
        SELECT ff.days_interval
          INTO l_days_interval
          FROM Finance_Frequency ff
        WHERE ff.id = NEW.finance_frequency_id;
    END IF;

    IF NEW.installments_count >= 1 THEN
        WHILE current_installment <= NEW.installments_count LOOP
            INSERT INTO Finance_Installments (finance_entries_id, installment_number, due_date, amount)
            VALUES (NEW.id, current_installment, installment_due_date, NEW.amount / NEW.installments_count);
            
            IF l_days_interval IS NOT NULL THEN
                installment_due_date := installment_due_date + INTERVAL '1 day' * l_days_interval;
            END IF;
            current_installment := current_installment + 1;
        END LOOP;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(trigger_name, function_name, operation, input_data, error_message)
        VALUES ('trigger_after_finance_installments', 'generate_installments', 'INSERT', to_jsonb(NEW), 'Erro: ' || SQLERRM);
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_finance_installments
AFTER INSERT ON Finance_Entries
FOR EACH ROW EXECUTE FUNCTION generate_installments();

------------------------------------------------------------
-- Trigger: Criar Transação automaticamente ao inserir uma parcela
--
-- Insere um registro na tabela Transactions vinculado à parcela criada, replicando
-- dados da entrada financeira correspondente.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_transaction()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM Transactions
        WHERE finance_installments_id = NEW.id
    ) THEN
        INSERT INTO Transactions (user_id, finance_installments_id, amount, is_income)
        SELECT user_id, NEW.id, amount, is_income
        FROM Finance_Entries
        WHERE id = NEW.finance_entries_id;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(trigger_name, function_name, operation, input_data, error_message)
        VALUES ('trigger_after_transactions', 'create_transaction', 'INSERT', to_jsonb(NEW), 'Erro: ' || SQLERRM);
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_transactions
AFTER INSERT ON Finance_Installments
FOR EACH ROW EXECUTE FUNCTION create_transaction();

------------------------------------------------------------
-- Trigger: Atualizar o saldo (wallet) dos usuários após transação
--
-- Deduz o valor da transação da carteira de cada usuário, conforme os percentuais
-- definidos na associação Finance_Payer_Users. Agora, o saldo pode ficar negativo.
-- Além disso, cada alteração é registrada na tabela User_Wallet_History.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_user_wallet()
RETURNS TRIGGER AS $$
DECLARE
    user_id INT;
    user_share DECIMAL;
    current_wallet DECIMAL;
    deduction DECIMAL;
    new_balance DECIMAL;
BEGIN
    FOR user_id, user_share IN
        SELECT fpu.user_id, fpu.percentage
        FROM Finance_Payer_Users fpu
        JOIN Finance_Entries fe ON fe.finance_payer_id = fpu.finance_payer_id
        JOIN Finance_Installments fi ON fi.finance_entries_id = fe.id
        WHERE fi.id = NEW.finance_installments_id
    LOOP
        SELECT wallet INTO current_wallet FROM Users WHERE id = user_id;
        deduction := NEW.amount * (user_share / 100);
        new_balance := current_wallet - deduction;
        
        UPDATE Users
        SET wallet = new_balance
        WHERE id = user_id;
        
        -- Registrar a atualização do saldo
        INSERT INTO User_Wallet_History(user_id, change_amount, resulting_balance, change_date)
        VALUES (user_id, -deduction, new_balance, NOW());
    END LOOP;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(trigger_name, function_name, operation, input_data, error_message)
        VALUES ('trigger_after_user_wallet', 'update_user_wallet', 'UPDATE', to_jsonb(NEW), 'Erro: ' || SQLERRM);
        RAISE;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_user_wallet
AFTER INSERT ON Transactions
FOR EACH ROW EXECUTE FUNCTION update_user_wallet();

---------------------------------------------------------------------------
-- FIM DO ESQUEMA
---------------------------------------------------------------------------
