-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela de log de erros
CREATE TABLE Trigger_Error_Log (
    id SERIAL PRIMARY KEY,
    trigger_name VARCHAR(100),
    function_name VARCHAR(100),
    operation VARCHAR(50),
    input_data JSONB,
    error_message TEXT NOT NULL,
    error_time TIMESTAMP DEFAULT NOW()
);


CREATE OR REPLACE FUNCTION set_house_name_to_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.house_name IS NULL THEN
        NEW.house_name := NEW.id::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE house_metadata (
    id SERIAL PRIMARY KEY,
    house_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_house_metadata_updated_at
    BEFORE UPDATE ON house_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
        CHECK (email ~*'^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    wallet DECIMAL(10,2) DEFAULT 0,
    account_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON Users(email);

CREATE TRIGGER trg_update_users_updated_at
    BEFORE UPDATE ON Users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE User_Wallet_History (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    resulting_balance DECIMAL(10,2) NOT NULL,
    change_date TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE Finance_Frequency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,              
    days_interval INT NOT NULL DEFAULT 30, 
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_frequency_updated_at
    BEFORE UPDATE ON Finance_Frequency
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Finance_CC (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,  
    description TEXT,            
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_cc_updated_at
    BEFORE UPDATE ON Finance_CC
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Finance_Category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,       
    parent_category_id INT NULL,        
    description TEXT,                   
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
CONSTRAINT chk_no_self_parent CHECK (parent_category_id IS NULL OR parent_category_id <> id),
    FOREIGN KEY (parent_category_id)
        REFERENCES Finance_Category(id) ON DELETE CASCADE
    
);

CREATE TRIGGER trg_update_finance_category_updated_at
    BEFORE UPDATE ON Finance_Category
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Finance_Payer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,   
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_payer_updated_at
BEFORE UPDATE ON Finance_Payer
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Finance_Payer_Users (
    finance_payer_id INT NOT NULL,                  
    user_id INT NOT NULL,                           
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),  
    PRIMARY KEY (finance_payer_id, user_id),
FOREIGN KEY (finance_payer_id) REFERENCES Finance_Payer(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);


CREATE OR REPLACE FUNCTION check_finance_payer_users_sum()
RETURNS TRIGGER AS '
DECLARE
    total NUMERIC;
    current_payer_id INT;
BEGIN
    IF (TG_OP = ''DELETE'') THEN
        current_payer_id := OLD.finance_payer_id;
    ELSE
        current_payer_id := NEW.finance_payer_id;
    END IF;

    SELECT COALESCE(SUM(percentage), 0)
        INTO total
        FROM Finance_Payer_Users
        WHERE finance_payer_id = current_payer_id;

    IF total <> 100 THEN
        RAISE EXCEPTION ''A soma dos percentuais para finance_payer_id % deve ser 100. Atualmente: %'', current_payer_id, total;
    END IF;
    RETURN NULL;
END;
'
LANGUAGE plpgsql;


CREATE TRIGGER trg_check_finance_payer_users_sum
    AFTER INSERT OR UPDATE OR DELETE ON Finance_Payer_Users
    FOR EACH ROW EXECUTE FUNCTION check_finance_payer_users_sum();

CREATE TABLE Finance_Currency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,                 
    symbol VARCHAR(10) NOT NULL,               
    exchange_rate DECIMAL(10,4) NOT NULL CHECK (exchange_rate > 0),
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER update_finance_currency_updated_at
    BEFORE UPDATE ON finance_currency
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Finance_Entries (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                         
    finance_cc_id INT NOT NULL,                   
    finance_category_id INT NOT NULL,             
    finance_payer_id INT NOT NULL,                
    finance_currency_id INT NOT NULL,             
    finance_frequency_id INT NULL,
    is_income BOOLEAN NOT NULL,                   
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),  
    start_date DATE NOT NULL,                     
    end_date DATE NULL,                           
    description TEXT,                             
    installments_count INT DEFAULT 1 CHECK (installments_count > 0),  
    is_fixed BOOLEAN DEFAULT FALSE,               
    is_recurring BOOLEAN DEFAULT FALSE,           
    payment_day INT CHECK (payment_day BETWEEN 1 AND 31),
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

CREATE TABLE Finance_Installments (
    id SERIAL PRIMARY KEY,
    finance_entries_id INT NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status BOOLEAN DEFAULT 0,
    category VARCHAR(50),
    priority INT,
    assignee VARCHAR(100),
    comments TEXT,
    tags TEXT[],
    history JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    task BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (finance_entries_id) REFERENCES Finance_Entries(id) ON DELETE CASCADE,
    CONSTRAINT uq_installment UNIQUE (finance_entries_id, installment_number)
);

CREATE TABLE Kanban_Buckets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position INT NOT NULL,
    filter JSONB DEFAULT NULL,
    config JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER trg_update_finance_installments_updated_at
    BEFORE UPDATE ON Finance_Installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,                           
    finance_installments_id INT NOT NULL,            
    transaction_date TIMESTAMP DEFAULT NOW(),        
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    is_income BOOLEAN NOT NULL,                      
    description TEXT,                                
    status VARCHAR(50) DEFAULT 'pending',            
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (finance_installments_id) REFERENCES Finance_Installments(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_date ON Transactions(transaction_date);

CREATE INDEX idx_transactions_status ON Transactions(status);

CREATE INDEX idx_transactions_user ON Transactions(user_id);

CREATE TRIGGER trg_update_transactions_updated_at
BEFORE UPDATE ON Transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE RFP (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                  
    description TEXT,
    created_by INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',         
    created_at TIMESTAMP DEFAULT NOW(),           
    updated_at TIMESTAMP DEFAULT NOW(),           
    approved_at TIMESTAMP NULL,                   
    approved_by INT NULL,                         
    approval_notes TEXT,
    FOREIGN KEY (created_by) REFERENCES Users(id),
    FOREIGN KEY (approved_by) REFERENCES Users(id)
);

CREATE INDEX idx_rfp_status ON RFP(status);

CREATE INDEX idx_rfp_created_at ON RFP(created_at);

CREATE TRIGGER trg_update_rfp_updated_at
BEFORE UPDATE ON RFP
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE Suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,          
    contact_info TEXT,                   
    website VARCHAR(255),                
    address TEXT,                        
    supplier_type VARCHAR(50),
rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),  
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TRIGGER trg_update_suppliers_updated_at
BEFORE UPDATE ON Suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE Products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,                
    description TEXT,                          
    category_id INT NULL,
quantity INT NOT NULL DEFAULT 1,           
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity *unit_price) STORED,  
    supplier_id INT NULL,                      
    rfp_id INT NULL,                           
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES Finance_Category(id),
FOREIGN KEY (supplier_id) REFERENCES Suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (rfp_id) REFERENCES RFP(id) ON DELETE SET NULL
);
CREATE INDEX idx_products_rfp ON Products(rfp_id);

CREATE TRIGGER trg_update_products_updated_at
BEFORE UPDATE ON Products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_installments()
RETURNS TRIGGER AS '
DECLARE
    l_days_interval INT;
    current_installment INT := 1;
    installment_due_date DATE := NEW.start_date;
    current_date DATE := CURRENT_DATE;
    total_installments INT;
BEGIN
    -- Obtendo o intervalo de dias da tabela Finance_Frequency
    SELECT ff.days_interval
    INTO l_days_interval
    FROM Finance_Frequency ff
    WHERE ff.id = NEW.finance_frequency_id;

    -- Se l_days_interval for nulo, atribui 30 dias
    IF l_days_interval IS NULL THEN
        l_days_interval := 30; 
    END IF;

    -- Se for recorrente, calcula o número de parcelas
    IF NEW.is_recurring THEN
        total_installments := (current_date - NEW.start_date) / l_days_interval + 1;
        IF total_installments < 1 THEN
            total_installments := 1;
        END IF;
    ELSE
        total_installments := NEW.installments_count;
    END IF;

    -- Criação das parcelas
    WHILE current_installment <= total_installments LOOP
        -- Verifica se a parcela já foi criada
        IF NOT EXISTS (
            SELECT 1
            FROM Finance_Installments 
            WHERE finance_entries_id = NEW.id 
            AND installment_number = current_installment
        ) THEN
            -- Insere a nova parcela
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
                    WHEN installment_due_date < current_date THEN ''overdue''
                    ELSE ''pending''
                END
            );
        END IF;

        -- Atualiza a data de vencimento para a próxima parcela
        installment_due_date := installment_due_date + (l_days_interval * INTERVAL ''1 day'');
        current_installment := current_installment + 1;
    END LOOP;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Registra erro no log
        INSERT INTO Trigger_Error_Log(
            trigger_name, 
            function_name, 
            operation, 
            input_data, 
            error_message
        )
        VALUES (
            ''trigger_after_finance_installments'',
            ''generate_installments'', 
            ''INSERT'', 
            to_jsonb(NEW), 
            ''Erro: '' || SQLERRM
        );
        RAISE;
END;
'
LANGUAGE plpgsql;


CREATE TRIGGER trigger_after_finance_installments
    AFTER INSERT OR UPDATE ON Finance_Entries
    FOR EACH ROW EXECUTE FUNCTION generate_installments();

CREATE OR REPLACE FUNCTION create_transaction()
RETURNS TRIGGER AS '
BEGIN
    -- Verifica se o status foi alterado para "paid"
    IF NEW.status = ''paid'' AND (OLD.status IS NULL OR OLD.status != ''paid'') THEN
        -- Insere a transação na tabela Transactions
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
            ''completed'', 
            NOW(),
            fe.description
        FROM Finance_Entries fe
        WHERE fe.id = NEW.finance_entries_id;
        
        -- Chama a função para atualizar o saldo da carteira do usuário
        PERFORM update_user_wallet(NEW.id);
    END IF;
    
    -- Retorna o novo valor da linha após a operação
    RETURN NEW;
EXCEPTION
    -- Trata exceções e registra no log
    WHEN OTHERS THEN
        INSERT INTO Trigger_Error_Log(
            trigger_name, 
            function_name, 
            operation, 
            input_data, 
            error_message
        )
        VALUES (
            ''trigger_after_installment_paid'', 
            ''create_transaction'', 
            ''UPDATE'', 
            to_jsonb(NEW), 
            ''Erro: '' || SQLERRM
        );
        RAISE;
END;
'
LANGUAGE plpgsql;


CREATE TRIGGER trigger_after_installment_paid
AFTER UPDATE ON Finance_Installments
FOR EACH ROW
EXECUTE FUNCTION create_transaction();

CREATE OR REPLACE FUNCTION update_user_wallet(installment_id INT)
RETURNS VOID AS '
DECLARE
user_id INT;
    user_share DECIMAL;
    current_wallet DECIMAL;
    amount_change DECIMAL;
    new_balance DECIMAL;
    is_income BOOLEAN;
    installment_amount DECIMAL;
BEGIN
    
    SELECT 
        fi.amount,
        fe.is_income
    INTO 
        installment_amount,
        is_income
    FROM Finance_Installments fi
    JOIN Finance_Entries fe ON fe.id = fi.finance_entries_id
    WHERE fi.id = installment_id;

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
        
        amount_change := installment_amount *(user_share /100);
        
        IF is_income THEN
new_balance := current_wallet + amount_change;
            amount_change := amount_change; 
        ELSE
            new_balance := current_wallet -amount_change;
            amount_change := -amount_change; 
        END IF;
        
        
        UPDATE Users
        SET wallet = new_balance
        WHERE id = user_id;
        
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

    IF NOT FOUND THEN
        RAISE EXCEPTION ''Nenhuma configuração de pagador encontrada para a parcela %'', installment_id;
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
            ''update_user_wallet'', 
            ''update_user_wallet'', 
            ''UPDATE'', 
            jsonb_build_object(''installment_id'', installment_id), 
            ''Erro: '' || SQLERRM
        );
        RAISE;
END;
'
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overdue_installments()
RETURNS TRIGGER AS '
BEGIN
    PERFORM set_config(''session_replication_role'', ''replica'', true);
    
    UPDATE Finance_Installments fi
    SET status = ''overdue''
    FROM Finance_Entries fe
    WHERE fi.finance_entries_id = fe.id
        AND fe.is_recurring = false
        AND fi.due_date < CURRENT_DATE
        AND fi.status = ''pending'';
    
    PERFORM set_config(''session_replication_role'', ''origin'', true);
    RETURN NULL;
END;
'
LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_overdue_installments
    AFTER INSERT OR UPDATE ON Finance_Installments
    FOR EACH STATEMENT EXECUTE FUNCTION update_overdue_installments();

CREATE OR REPLACE FUNCTION generate_next_recurring_installment()
RETURNS TRIGGER AS '
DECLARE
    next_due_date DATE;
    l_days_interval INT;
BEGIN
    IF NEW.status = ''paid'' THEN
        
        SELECT ff.days_interval 
        INTO l_days_interval
        FROM Finance_Entries fe
JOIN Finance_Frequency ff ON ff.id = fe.finance_frequency_id
        WHERE fe.id = NEW.finance_entries_id;

        IF FOUND AND (SELECT is_recurring FROM Finance_Entries WHERE id = NEW.finance_entries_id) THEN
            next_due_date := NEW.due_date + (l_days_interval || '' days'')::INTERVAL;
            
            
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
                ''pending''
            );
        END IF;
    END IF;
    RETURN NEW;
END;
'
LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_next_recurring_installment
AFTER UPDATE ON Finance_Installments
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'paid')
EXECUTE FUNCTION generate_next_recurring_installment();

CREATE OR REPLACE FUNCTION convert_rfp_to_finance_entry()
RETURNS TRIGGER AS '
BEGIN
    IF NEW.status = ''approved'' AND OLD.status != ''approved'' THEN
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
            1, 
            p.category_id,
            1, 
            1, 
            1, 
            FALSE, 
            p.total_price,
            CURRENT_DATE,
            NEW.title,
            1 
        FROM Products p
        WHERE p.rfp_id = NEW.id;
    END IF;
    RETURN NEW;
END;
'
LANGUAGE plpgsql;

CREATE TRIGGER trigger_convert_rfp_to_finance_entry
    AFTER UPDATE ON RFP
    FOR EACH ROW
    EXECUTE FUNCTION convert_rfp_to_finance_entry();

CREATE OR REPLACE VIEW vw_financial_summary AS
SELECT
    (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = TRUE) AS "Receitas",
    (SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = FALSE) AS "Despesas",
(SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = TRUE)
    -(SELECT COALESCE(SUM(amount), 0) FROM Finance_Entries WHERE is_income = FALSE) AS "Saldo Líquido";

CREATE OR REPLACE VIEW vw_installments_pending AS
SELECT
    fi.id AS "ID",
    
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

CREATE OR REPLACE VIEW vw_installments_actual_current AS
SELECT
    fi.id AS "ID",
    fe.description AS "Descrição",
    fi.due_date AS "Vencimento",
    CASE 
        WHEN fi.status = 'overdue' THEN 'Pendente'
        WHEN fi.status = 'paid' THEN 'Pago'
        ELSE fi.status  
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

CREATE OR REPLACE VIEW vw_installments_overdue AS
SELECT
    fi.id AS "ID da Parcela",
    fe.description AS "Descrição",
    fi.due_date AS "Vencimento",
CASE 
        WHEN fi.status = 'overdue' THEN 'Pendente'
        WHEN fi.status = 'paid' THEN 'Pago'
        ELSE fi.status  
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

CREATE OR REPLACE VIEW vw_monthly_cash_flow AS
WITH months AS (
    SELECT 
        to_char(date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * s), 'YYYY-MM') AS month_year
    FROM generate_series(0, 11) AS s
),
monthly_data AS (
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

CREATE OR REPLACE VIEW vw_dre_simplified AS
SELECT
    to_char(fe.start_date, 'YYYY-MM') AS "Período",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS "Receita Total",
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS "Custos Totais",
    (
        SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END)
        -SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END)
    ) AS "Resultado Bruto"
FROM Finance_Entries fe
GROUP BY 1
ORDER BY 1;

CREATE OR REPLACE VIEW vw_dre_detailed AS
SELECT
    to_char(fe.start_date, 'YYYY-MM') AS "Período",
    fc.name AS "Categoria",
    COALESCE(pc.name, 'Nenhuma') AS "Categoria Pai",
    SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END) AS "Receita da Categoria",
    SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END) AS "Custo da Categoria",
    (
        SUM(CASE WHEN fe.is_income THEN fe.amount ELSE 0 END)
        -SUM(CASE WHEN NOT fe.is_income THEN fe.amount ELSE 0 END)
) AS "Resultado da Categoria"
FROM Finance_Entries fe
JOIN Finance_Category fc ON fc.id = fe.finance_category_id
LEFT JOIN Finance_Category pc ON pc.id = fc.parent_category_id
GROUP BY 1, fc.name, pc.name
ORDER BY 1, "Categoria Pai", "Categoria";

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

CREATE OR REPLACE VIEW vw_supplier_Entry_balances AS
SELECT
    s.id AS "ID",
    s.name AS "Nome",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
        WHERE p.supplier_id = s.id
    ),0) AS "Despesas"
FROM Suppliers s;

CREATE OR REPLACE VIEW vw_product_Entry_balances AS
SELECT
    p.id AS "ID",
    p.name AS "Nome",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
    ),0) AS "Despesas"
FROM Products p;

CREATE OR REPLACE VIEW vw_rfp_Entry_balances AS
SELECT
    r.id AS "ID",
    r.title AS "Título da RFP",
    COALESCE((
        SELECT SUM(p.total_price) FROM Products p
        WHERE p.rfp_id = r.id
    ),0) AS "Despesas"
FROM RFP r;

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

