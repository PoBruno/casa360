---------------------------------------------------------------------------
-- Esquema do Banco de Dados para Sistema Financeiro + Compras/RFPs
--
-- Este script implementa:
--   - Tabelas com colunas de auditoria (created_at e updated_at)
--   - Validações de integridade e de regras de negócio por meio de constraints e triggers
--   - Log de erros enriquecido para triggers, armazenando informações detalhadas sobre a operação
--   - Módulo de Compras/RFPs com tabelas para solicitações de compra, produtos e fornecedores
--   - Registro de cada atualização do saldo dos usuários em uma tabela específica (User_Wallet_History)
--   - Índices adicionais em campos frequentemente consultados (status, datas, etc.)
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
-- Armazena os dados dos usuários do sistema, com validação de email e outros campos
-- e auditoria. Note que a coluna wallet NÃO possui restrição para valores negativos.
----------------------------------------------
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                         -- Nome completo do usuário
    email VARCHAR(255) NOT NULL UNIQUE                  -- Email, com validação de formato via expressão regular
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    wallet DECIMAL(10,2) DEFAULT 0,                     -- Saldo do usuário (podendo ser negativo)
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
    is_fixed BOOLEAN DEFAULT FALSE,               -- Indica se a entrada é fixa
    is_recurring BOOLEAN DEFAULT FALSE,           -- Indica se a entrada é recorrente
    payment_day INT CHECK (payment_day BETWEEN 1 AND 31), -- Dia do pagamento
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
-- Cria as parcelas (Finance_Installments) com base em:
-- - Frequência (days_interval da tabela Finance_Frequency)
-- - Data inicial (start_date da Finance_Entries)
-- - Data atual (para calcular parcelas até o momento)
-- - Status de recorrência (is_recurring)
------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_installments()
RETURNS TRIGGER AS $$
DECLARE
    l_days_interval INT;
    current_installment INT := 1;
    installment_due_date DATE := NEW.start_date;
    current_date DATE := CURRENT_DATE;
    total_installments INT;
BEGIN
    -- Obter o intervalo de dias da frequência
    SELECT ff.days_interval
    INTO l_days_interval
    FROM Finance_Frequency ff
    WHERE ff.id = NEW.finance_frequency_id;

    IF l_days_interval IS NULL THEN
        l_days_interval := 30; -- Padrão mensal se não especificado
    END IF;

    -- Para entradas recorrentes, calcular número de parcelas até a data atual
    IF NEW.is_recurring THEN
        -- Calcula quantas parcelas cabem entre start_date e current_date
        -- Usa divisão inteira de dias para calcular número de parcelas
        total_installments := (current_date - NEW.start_date) / l_days_interval + 1;
        
        -- Garante pelo menos uma parcela
        IF total_installments < 1 THEN
            total_installments := 1;
        END IF;
    ELSE
        -- Para não recorrentes, usa o número de parcelas definido
        total_installments := NEW.installments_count;
    END IF;

    -- Gera as parcelas
    WHILE current_installment <= total_installments LOOP
        -- Verifica se a parcela já existe para evitar duplicidade
        IF NOT EXISTS (
            SELECT 1 
            FROM Finance_Installments 
            WHERE finance_entries_id = NEW.id 
            AND installment_number = current_installment
        ) THEN
            -- Calcula status baseado na data de vencimento
            INSERT INTO Finance_Installments (
                finance_entries_id,
                installment_number,
                due_date,
                amount,
                status
            )
            VALUES (
                NEW.id,
                current_installment,
                installment_due_date,
                NEW.amount,
                CASE 
                    WHEN installment_due_date < current_date THEN 'overdue'
                    ELSE 'pending'
                END
            );
        END IF;

        -- Incrementa a data de vencimento para próxima parcela
        installment_due_date := installment_due_date + (l_days_interval || ' days')::INTERVAL;
        current_installment := current_installment + 1;
    END LOOP;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(
            trigger_name, 
            function_name, 
            operation, 
            input_data, 
            error_message
        )
        VALUES (
            'trigger_after_finance_installments', 
            'generate_installments', 
            'INSERT', 
            to_jsonb(NEW), 
            'Erro: ' || SQLERRM
        );
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Modifica o trigger para executar também em UPDATE
DROP TRIGGER IF EXISTS trigger_after_finance_installments ON Finance_Entries;
CREATE TRIGGER trigger_after_finance_installments
AFTER INSERT OR UPDATE ON Finance_Entries
FOR EACH ROW EXECUTE FUNCTION generate_installments();

------------------------------------------------------------
-- Trigger: Criar Transação automaticamente ao inserir uma parcela
--
-- Insere um registro na tabela Transactions vinculado à parcela criada, replicando
-- dados da entrada financeira correspondente.
------------------------------------------------------------
-- Remove o trigger anterior
DROP TRIGGER IF EXISTS trigger_after_transactions ON Finance_Installments;

-- Modifica a função create_transaction para considerar apenas parcelas pagas
CREATE OR REPLACE FUNCTION create_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Só cria transação quando a parcela é marcada como paga
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        INSERT INTO Transactions (
            user_id, 
            finance_installments_id, 
            amount, 
            is_income,
            status,
            transaction_date,
            description
        )
        SELECT
            fe.user_id,
            NEW.id,
            NEW.amount,
            fe.is_income,
            'completed',  -- Status completed pois a transação já está efetivada
            NOW(),       -- Data atual como data da transação
            fe.description
        FROM Finance_Entries fe
        WHERE fe.id = NEW.finance_entries_id;

        -- Após criar a transação, atualiza o saldo dos usuários
        PERFORM update_user_wallet(NEW.id);
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(
            trigger_name, 
            function_name, 
            operation, 
            input_data, 
            error_message
        )
        VALUES (
            'trigger_after_installment_paid', 
            'create_transaction', 
            'UPDATE', 
            to_jsonb(NEW), 
            'Erro: ' || SQLERRM
        );
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Modifica o trigger para executar apenas em UPDATE
CREATE TRIGGER trigger_after_installment_paid
AFTER UPDATE ON Finance_Installments
FOR EACH ROW
EXECUTE FUNCTION create_transaction();

------------------------------------------------------------
-- Trigger: Atualizar o saldo (wallet) dos usuários após transação
--
-- Deduz o valor da transação da carteira de cada usuário, conforme os percentuais
-- definidos na associação Finance_Payer_Users. Agora, o saldo pode ficar negativo.
-- Além disso, cada alteração é registrada na tabela User_Wallet_History.
------------------------------------------------------------
-- Modifica a função update_user_wallet para receber o ID da parcela
CREATE OR REPLACE FUNCTION update_user_wallet(installment_id INT)
RETURNS VOID AS $$
DECLARE
    user_id INT;
    user_share DECIMAL;
    current_wallet DECIMAL;
    amount_change DECIMAL;
    new_balance DECIMAL;
    is_income BOOLEAN;
    installment_amount DECIMAL;
BEGIN
    -- Buscar dados da parcela e entrada financeira
    SELECT 
        fi.amount,
        fe.is_income
    INTO 
        installment_amount,
        is_income
    FROM Finance_Installments fi
    JOIN Finance_Entries fe ON fe.id = fi.finance_entries_id
    WHERE fi.id = installment_id;

    -- Processa cada usuário envolvido no pagamento
    FOR user_id, user_share IN
        SELECT fpu.user_id, fpu.percentage
        FROM Finance_Payer_Users fpu
        JOIN Finance_Entries fe ON fe.finance_payer_id = fpu.finance_payer_id
        JOIN Finance_Installments fi ON fi.finance_entries_id = fe.id
        WHERE fi.id = installment_id
    LOOP
        SELECT wallet INTO current_wallet 
        FROM Users 
        WHERE id = user_id;

        -- Calcula o valor proporcional à participação do usuário
        amount_change := installment_amount * (user_share / 100);
        
        -- Se for entrada (is_income = true), soma; se for saída (is_income = false), subtrai
        IF is_income THEN
            new_balance := current_wallet + amount_change;
            amount_change := amount_change; -- Mantém positivo
        ELSE
            new_balance := current_wallet - amount_change;
            amount_change := -amount_change; -- Torna negativo para histórico
        END IF;
        
        -- Atualiza o saldo do usuário
        UPDATE Users
        SET wallet = new_balance
        WHERE id = user_id;
        
        -- Registra no histórico
        INSERT INTO User_Wallet_History(
            user_id, 
            change_amount, 
            resulting_balance, 
            change_date
        )
        VALUES (
            user_id, 
            amount_change, 
            new_balance, 
            NOW()
        );
    END LOOP;

    -- Validação final
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nenhuma configuração de pagador encontrada para a parcela %', installment_id;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(
            trigger_name, 
            function_name, 
            operation, 
            input_data, 
            error_message
        )
        VALUES (
            'update_user_wallet', 
            'update_user_wallet', 
            'UPDATE', 
            jsonb_build_object('installment_id', installment_id), 
            'Erro: ' || SQLERRM
        );
        RAISE;
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------
-- Trigger: Atualizar status de parcelas vencidas
------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_overdue_installments()
RETURNS TRIGGER AS $$
BEGIN
    -- Desabilita triggers temporariamente
    PERFORM set_config('session_replication_role', 'replica', true);
    
    -- Atualiza apenas parcelas de entradas não recorrentes
    UPDATE Finance_Installments fi
    SET status = 'overdue'
    FROM Finance_Entries fe
    WHERE fi.finance_entries_id = fe.id
      AND fe.is_recurring = false
      AND fi.due_date < CURRENT_DATE
      AND fi.status = 'pending';
    
    -- Reabilita triggers
    PERFORM set_config('session_replication_role', 'origin', true);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_overdue_installments
AFTER INSERT OR UPDATE ON Finance_Installments
FOR EACH STATEMENT EXECUTE FUNCTION update_overdue_installments();

------------------------------------------------------------
-- Trigger: Gerar próxima parcela de despesa recorrente
------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_next_recurring_installment()
RETURNS TRIGGER AS $$
DECLARE
    next_due_date DATE;
    l_days_interval INT;
BEGIN
    IF NEW.status = 'paid' THEN
        -- Buscar entrada financeira e frequência
        SELECT ff.days_interval 
        INTO l_days_interval
        FROM Finance_Entries fe
        JOIN Finance_Frequency ff ON ff.id = fe.finance_frequency_id
        WHERE fe.id = NEW.finance_entries_id;

        IF FOUND AND (SELECT is_recurring FROM Finance_Entries WHERE id = NEW.finance_entries_id) THEN
            next_due_date := NEW.due_date + (l_days_interval || ' days')::INTERVAL;
            
            -- Inserir próxima parcela
            INSERT INTO Finance_Installments (
                finance_entries_id,
                installment_number,
                due_date,
                amount,
                status
            )
            VALUES (
                NEW.finance_entries_id,
                NEW.installment_number + 1,
                next_due_date,
                NEW.amount,
                'pending'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_next_recurring_installment
AFTER UPDATE ON Finance_Installments
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'paid')
EXECUTE FUNCTION generate_next_recurring_installment();

------------------------------------------------------------
-- Trigger: Converter RFP em Finance_Entries
------------------------------------------------------------
CREATE OR REPLACE FUNCTION convert_rfp_to_finance_entry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO Finance_Entries (
            user_id,
            finance_cc_id,
            finance_category_id,
            finance_payer_id,
            finance_currency_id,
            finance_frequency_id,
            is_income,
            amount,
            start_date,
            description,
            installments_count
        )
        SELECT 
            NEW.created_by,
            1, -- CC padrão
            p.category_id,
            1, -- Payer padrão
            1, -- Moeda padrão
            1, -- Frequência padrão
            FALSE, -- É uma despesa
            p.total_price,
            CURRENT_DATE,
            NEW.title,
            1 -- Parcela única por padrão
        FROM Products p
        WHERE p.rfp_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_convert_rfp_to_finance_entry
AFTER UPDATE ON RFP
FOR EACH ROW
EXECUTE FUNCTION convert_rfp_to_finance_entry();






------------------------------------------------------------
-- Views úteis para relatórios
------------------------------------------------------------

-- 1. Visão de Resumo Financeiro (receitas, despesas e saldo)
CREATE OR REPLACE VIEW vw_financial_summary AS
SELECT
    (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = TRUE) AS "Receitas",
    (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = FALSE) AS "Despesas",
    (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = TRUE)
    - (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = FALSE) AS "Saldo Líquido";

-- 2. Visões de Parcelas (pendentes)
CREATE OR REPLACE VIEW vw_installments_pending AS
SELECT
    fi.id AS "ID",
    --fi.finance_entries_id AS "ID da Entrada Financeira",
    fe.description AS "Descrição",
    fi.due_date AS "Vencimento",
    'Pendente' AS "Status",
    CASE 
        WHEN fe.is_income THEN 'Entrada'
        ELSE 'Saída'
    END AS "Movimentação",
    owner.name AS "Responsável",
    (
        SELECT array_agg(u.name)
        FROM Finance_Payer_Users fpu
        JOIN Users u ON u.id = fpu.user_id
        WHERE fpu.finance_payer_id = fe.finance_payer_id
    ) AS "Pagamento"
FROM Finance_Installments fi
JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
JOIN Users owner ON owner.id = fe.user_id
WHERE fi.status IN ('overdue', 'pending');

-- 2. Visões de Parcelas (somente atuais)
CREATE OR REPLACE VIEW vw_installments_actual_current AS
SELECT
    fi.id AS "ID",
    fe.description AS "Descrição",
    fi.due_date AS "Vencimento",
    CASE 
        WHEN fi.status = 'overdue' THEN 'Pendente'
        WHEN fi.status = 'paid' THEN 'Pago'
        ELSE fi.status  -- Mantém o status original para outros casos
    END AS "Status",
    CASE 
        WHEN fe.is_income THEN 'Entrada'
        ELSE 'Saída'
    END AS "Movimentação",
    owner.name AS "Responsável",
    (
        SELECT array_agg(u.name)
        FROM Finance_Payer_Users fpu
        JOIN Users u ON u.id = fpu.user_id
        WHERE fpu.finance_payer_id = fe.finance_payer_id
    ) AS "Pagamento"
FROM Finance_Installments fi
JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
JOIN Users owner ON owner.id = fe.user_id
WHERE date_trunc('month', fi.due_date) = date_trunc('month', CURRENT_DATE);

-- 2. Visões de Parcelas (somente vencidas)
CREATE OR REPLACE VIEW vw_installments_overdue AS
SELECT
    fi.id AS "ID da Parcela",
    fe.description AS "Descrição",
    fi.due_date AS "Vencimento",
    CASE 
        WHEN fi.status = 'overdue' THEN 'Pendente'
        WHEN fi.status = 'paid' THEN 'Pago'
        ELSE fi.status  -- Mantém o status original para outros casos
    END AS "Status",
    CASE 
        WHEN fe.is_income THEN 'Entrada'
        ELSE 'Saída'
    END AS "Movimentação",
    owner.name AS "Responsável",
    (
        SELECT array_agg(u.name)
        FROM Finance_Payer_Users fpu
        JOIN Users u ON u.id = fpu.user_id
        WHERE fpu.finance_payer_id = fe.finance_payer_id
    ) AS "Pagamento"
FROM Finance_Installments fi
JOIN Finance_Entries fe ON fi.finance_entries_id = fe.id
JOIN Users owner ON owner.id = fe.user_id
WHERE fi.due_date < CURRENT_DATE
    AND fi.status IN ('pending', 'overdue');

-- 3. Visão de Movimentações por Mês (agrupadas por receita x despesa)
CREATE OR REPLACE VIEW vw_monthly_movements AS
SELECT
    to_char(fe.start_date, 'YYYY-MM') AS "Mês e Ano",
    CASE 
        WHEN fe.is_income THEN 'Entrada'
        ELSE 'Saída'
    END AS "Movimentação",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE -fe.amount END) AS "Fluxo Mensal Líquido",
    SUM(fe.amount) AS "Montante Total"
FROM Finance_Entries fe
GROUP BY 1, fe.is_income
ORDER BY 1;

-- 4. Visão de Saldo por Usuário
CREATE OR REPLACE VIEW vw_user_wallet_summaries AS
SELECT
    u.id AS "ID",
    u.name AS "Nome",
    u.wallet AS "Carteira Atual",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE user_id = u.id AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE user_id = u.id AND is_income = FALSE
    ),0) AS "Despesas"
FROM Users u;

-- 5. Visão de Fluxo de Caixa Diário
CREATE OR REPLACE VIEW vw_daily_cash_flow AS
SELECT
    fe.start_date AS "Data",
    COUNT(*) AS "Total de Transações",
    COUNT(CASE WHEN fe.is_income THEN 1 END) AS "Número de Receitas",
    COUNT(CASE WHEN NOT fe.is_income THEN 1 END) AS "Número de Despesas",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS "Receitas Diárias",
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS "Despesas Diárias",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE -fe.amount END) AS "Fluxo Diário Líquido",
    AVG(fe.amount) AS "Valor Médio por Transação"
FROM Finance_Entries fe
GROUP BY fe.start_date
ORDER BY fe.start_date;

-- 5. Visão de Fluxo de Caixa Mensal
CREATE OR REPLACE VIEW vw_monthly_cash_flow AS
WITH months AS (
    -- Gera uma série de meses dos últimos 12 meses
    SELECT 
        to_char(date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * s), 'YYYY-MM') AS month_year
    FROM generate_series(0, 11) AS s
),
monthly_data AS (
    -- Agrupa os dados de Transactions por mês
    SELECT
        to_char(t.transaction_date, 'YYYY-MM') AS month_year,
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN t.is_income THEN 1 END) AS total_incomes,
        COUNT(CASE WHEN NOT t.is_income THEN 1 END) AS total_expenses,
        SUM(CASE WHEN t.is_income THEN t.amount ELSE -t.amount END) AS net_cash_flow,
        AVG(t.amount) AS avg_transaction_value
    FROM Transactions t
    GROUP BY 1
)
SELECT
    m.month_year AS "Mês e Ano",
    COALESCE(md.total_transactions, 0) AS "Total de Transações",
    COALESCE(md.total_incomes, 0) AS "Número de Receitas",
    COALESCE(md.total_expenses, 0) AS "Número de Despesas",
    COALESCE(md.net_cash_flow, 0) AS "Fluxo Mensal Líquido",
    COALESCE(md.avg_transaction_value, 0) AS "Valor Médio por Transação"
FROM months m
LEFT JOIN monthly_data md ON m.month_year = md.month_year
ORDER BY m.month_year;



-- 6. Visão de DRE Simplificado (Receitas, Despesas e Resultado Bruto)
CREATE OR REPLACE VIEW vw_dre_simplified AS
SELECT
    to_char(fe.start_date, 'YYYY-MM') AS "Período",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS "Receita Total",
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS "Custos Totais",
    (
        SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END)
        - SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END)
    ) AS "Resultado Bruto"
FROM Finance_Entries fe
GROUP BY 1
ORDER BY 1;

-- 7. Visão de DRE Detalhado (por categoria e subcategoria)
CREATE OR REPLACE VIEW vw_dre_detailed AS
SELECT
    to_char(fe.start_date, 'YYYY-MM') AS "Período",
    fc.name AS "Categoria",
    COALESCE(pc.name, 'Nenhuma') AS "Categoria Pai",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS "Receita da Categoria",
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS "Custo da Categoria",
    (
        SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END)
        - SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END)
    ) AS "Resultado da Categoria"
FROM Finance_Entries fe
JOIN Finance_Category fc ON fc.id = fe.finance_category_id
LEFT JOIN Finance_Category pc ON pc.id = fc.parent_category_id
GROUP BY 1, fc.name, pc.name
ORDER BY 1, "Categoria Pai", "Categoria";

-- 8. Visão de Saldo por Categoria
CREATE OR REPLACE VIEW vw_category_Entry_balances AS
SELECT
    fc.id AS "ID da Categoria",
    fc.name AS "Nome da Categoria",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_category_id = fc.id AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_category_id = fc.id AND is_income = FALSE
    ),0) AS "Despesas"
FROM Finance_Category fc;

-- 9. Visão de Saldo por Centro de Custo
CREATE OR REPLACE VIEW vw_cc_Entry_balances AS
SELECT
    fcc.id AS "ID do Centro de Custo",
    fcc.name AS "Nome do Centro de Custo",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_cc_id = fcc.id AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_cc_id = fcc.id AND is_income = FALSE
    ),0) AS "Despesas"
FROM Finance_CC fcc;

-- 10. Visão de Saldo por Moeda
CREATE OR REPLACE VIEW vw_currency_Entry_balances AS
SELECT
    fc.id AS "ID da Moeda",
    fc.name AS "Nome da Moeda",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_currency_id = fc.id AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_currency_id = fc.id AND is_income = FALSE
    ),0) AS "Despesas"
FROM Finance_Currency fc;

-- 11. Visão de Saldo por Pagador
CREATE OR REPLACE VIEW vw_payer_Entry_balances AS
SELECT
    fp.id AS "ID",
    fp.name AS "Nome",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_payer_id = fp.id AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_payer_id = fp.id AND is_income = FALSE
    ),0) AS "Despesas"
FROM Finance_Payer fp;

-- 12. Visão de Saldo por Fornecedor
CREATE OR REPLACE VIEW vw_supplier_Entry_balances AS
SELECT
    s.id AS "ID",
    s.name AS "Nome",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
        WHERE p.supplier_id = s.id
    ),0) AS "Despesas"
FROM Suppliers s;

-- 13. Visão de Saldo por Produto
CREATE OR REPLACE VIEW vw_product_Entry_balances AS
SELECT
    p.id AS "ID",
    p.name AS "Nome",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
    ),0) AS "Despesas"
FROM Products p;

-- 14. Visão de Saldo por RFP
CREATE OR REPLACE VIEW vw_rfp_Entry_balances AS
SELECT
    r.id AS "ID",
    r.title AS "Título da RFP",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
        WHERE p.rfp_id = r.id
    ),0) AS "Despesas"
FROM RFP r;

-- 18. Visão de Saldo por Centro de Custo e Moeda
CREATE OR REPLACE VIEW vw_cc_currency_Entry_balances AS
SELECT
    fcc.id AS "ID",
    fcc.name AS "Centro de Custo",
    fc.id AS "ID da Moeda",
    fc.name AS "Moeda",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_cc_id = fcc.id
            AND finance_currency_id = fc.id
            AND is_income = TRUE
    ),0) AS "Receitas",
    COALESCE((
        SELECT SUM(amount) FROM Finance_Entries
        WHERE finance_cc_id = fcc.id
            AND finance_currency_id = fc.id
            AND is_income = FALSE
    ),0) AS "Despesas"
FROM Finance_CC fcc
CROSS JOIN Finance_Currency fc;

---------------------------------------------------------------------------
-- FIM DO ESQUEMA
---------------------------------------------------------------------------

