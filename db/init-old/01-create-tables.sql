--------------------------------------------------------------------------------
-- Habilitar a extensão para geração de UUID
--------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- Drop de tabelas existentes (caso existam) e criação das principais
--------------------------------------------------------------------------------

-- Tabela de usuários
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  password_hash varchar(256) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Tabela de moedas
DROP TABLE IF EXISTS currencies CASCADE;
CREATE TABLE currencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code char(3) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  conversion_rate numeric NOT NULL
);

-- Tabela de contas
DROP TABLE IF EXISTS accounts CASCADE;
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  currency_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  type varchar(50),
  current_balance numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_accounts_currency FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

-- Tabela de categorias (genéricas)
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  parent_id uuid,
  name varchar(100) NOT NULL,
  type varchar(20) CHECK (type IN ('income','expense')) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
);

-- Tabela de recorrências
DROP TABLE IF EXISTS recurrences CASCADE;
CREATE TABLE recurrences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  frequency_type varchar(20) CHECK (frequency_type IN ('daily','weekly','monthly','yearly')) NOT NULL,
  interval integer NOT NULL,
  start_date date NOT NULL,
  end_date date,
  occurrences integer,
  rrule json,
  auto_generate boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_recurrences_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de solicitações de compra
DROP TABLE IF EXISTS purchase_requests CASCADE;
CREATE TABLE purchase_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title varchar(150) NOT NULL,
  description text,
  criteria json,
  request_date date NOT NULL DEFAULT current_date,
  status varchar(20) CHECK (status IN ('open','closed','canceled')) NOT NULL DEFAULT 'open',
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_purchase_requests_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de fornecedores
DROP TABLE IF EXISTS suppliers CASCADE;
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(150) NOT NULL,
  contact_info varchar(150),
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tabela de cotações de compra
DROP TABLE IF EXISTS purchase_quotes CASCADE;
CREATE TABLE purchase_quotes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_request_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  quoted_price numeric NOT NULL,
  details text,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_purchase_quotes_request FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id),
  CONSTRAINT fk_purchase_quotes_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Tabela de transações
DROP TABLE IF EXISTS transactions CASCADE;
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  category_id uuid NOT NULL,
  recurrence_id uuid,
  import_id uuid,
  type varchar(20) CHECK (type IN ('income','expense','transfer')) NOT NULL,
  amount numeric NOT NULL,
  due_date date NOT NULL,
  payment_date date,
  status varchar(20) CHECK (status IN ('pending','completed','canceled')) NOT NULL DEFAULT 'pending',
  description varchar(255),
  metadata json,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts(id),
  CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_transactions_recurrence FOREIGN KEY (recurrence_id) REFERENCES recurrences(id)
);

-- Tabela de anexos
DROP TABLE IF EXISTS attachments CASCADE;
CREATE TABLE attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid,
  purchase_request_id uuid,
  user_id uuid NOT NULL,
  file_name varchar(150) NOT NULL,
  file_path varchar(255) NOT NULL,
  mime_type varchar(50),
  file_size numeric,
  uploaded_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_attachments_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_attachments_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_attachments_purchase_request FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id)
);

-- Tabela de importações
DROP TABLE IF EXISTS imports CASCADE;
CREATE TABLE imports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  source_type varchar(20) CHECK (source_type IN ('bank','csv','manual')) NOT NULL,
  status varchar(20) CHECK (status IN ('pending','processing','completed','failed')) NOT NULL DEFAULT 'pending',
  raw_data json,
  mapping_config json,
  started_at timestamp,
  finished_at timestamp,
  CONSTRAINT fk_imports_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_imports_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Tabela de histórico de saldos
DROP TABLE IF EXISTS account_balances CASCADE;
CREATE TABLE account_balances (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id uuid NOT NULL,
  balance_date date NOT NULL,
  opening_balance numeric NOT NULL,
  closing_balance numeric NOT NULL,
  total_income numeric NOT NULL,
  total_expenses numeric NOT NULL,
  CONSTRAINT fk_account_balances_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Tabela de planos orçamentários
DROP TABLE IF EXISTS budget_plans CASCADE;
CREATE TABLE budget_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount numeric NOT NULL,
  period varchar(20) CHECK (period IN ('monthly','weekly','yearly')) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_budget_plans_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_budget_plans_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabela de relatórios financeiros
DROP TABLE IF EXISTS financial_reports CASCADE;
CREATE TABLE financial_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  report_type varchar(50) CHECK (report_type IN ('cash_flow','balance_sheet','rfp_analysis','custom')) NOT NULL,
  parameters json,
  data json,
  generated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_financial_reports_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de tarefas (Planner / Kanban)
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  transaction_id uuid,
  purchase_request_id uuid,
  recurrence_id uuid,
  status_id uuid NOT NULL,
  title varchar(150) NOT NULL,
  description text,
  priority integer,
  due_date date NOT NULL,
  completed_date date,
  position integer,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_tasks_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_tasks_purchase_request FOREIGN KEY (purchase_request_id) REFERENCES purchase_requests(id),
  CONSTRAINT fk_tasks_recurrence FOREIGN KEY (recurrence_id) REFERENCES recurrences(id)
);

-- Tabela de status de tarefas
DROP TABLE IF EXISTS task_statuses CASCADE;
CREATE TABLE task_statuses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(50) CHECK (name IN ('Backlog','Todo','In Progress','Done')) NOT NULL,
  order_value integer,
  is_default boolean NOT NULL DEFAULT false
);

-- Tabela de eventos (Agenda)
DROP TABLE IF EXISTS events CASCADE;
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title varchar(150) NOT NULL,
  description text,
  start_time timestamp NOT NULL,
  end_time timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabela de logs de auditoria
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  table_name varchar(100) NOT NULL,
  record_id uuid NOT NULL,
  action varchar(20) CHECK (action IN ('create','update','delete')) NOT NULL,
  old_value json,
  new_value json,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Alterar transactions para FK import_id
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_import FOREIGN KEY (import_id) REFERENCES imports(id);

--------------------------------------------------------------------------------
-- Tabelas adicionais solicitadas
--------------------------------------------------------------------------------

-- Tabela de Centro de Custo (cost centers)
DROP TABLE IF EXISTS cost_centers CASCADE;
CREATE TABLE cost_centers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  description text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tabela de Categoria adicional (caso queira diferenciar de 'categories' existente)
-- Se for a mesma funcionalidade, pode remover ou renomear. Exemplo de nova "sub_category".
DROP TABLE IF EXISTS sub_categories CASCADE;
CREATE TABLE sub_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_category_id uuid NOT NULL,
  name varchar(100) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_sub_categories_parent FOREIGN KEY (parent_category_id) REFERENCES categories(id)
);

-- Tabela de Frequência (para referência de tipos de frequência mais abrangentes)
DROP TABLE IF EXISTS frequencies CASCADE;
CREATE TABLE frequencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  label varchar(50) NOT NULL,  -- p.ex. "Diária", "Semanal", etc.
  interval_value integer NOT NULL, -- p.ex. 1, 7, 30, etc.
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tabela de condições de pagamento (exemplo para parcelamento, prazos, etc.)
DROP TABLE IF EXISTS payment_conditions CASCADE;
CREATE TABLE payment_conditions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  details json, -- pode armazenar esquemas do tipo {"entrada":30,"parcelas":10}
  created_at timestamp NOT NULL DEFAULT now()
);

-- Tabela para lidar com fluxo de caixa individual de cada usuário
DROP TABLE IF EXISTS user_cash_flows CASCADE;
CREATE TABLE user_cash_flows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  amount numeric NOT NULL,
  flow_date date NOT NULL DEFAULT current_date,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_cash_flows_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_cash_flows_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

-- Tabela para divisão de transações entre usuários (exemplo de splitting)
DROP TABLE IF EXISTS transaction_splits CASCADE;
CREATE TABLE transaction_splits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id uuid NOT NULL,
  user_id uuid NOT NULL,
  split_percentage numeric NOT NULL CHECK (split_percentage >= 0 AND split_percentage <= 100),
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT fk_transaction_splits_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  CONSTRAINT fk_transaction_splits_user FOREIGN KEY (user_id) REFERENCES users(id)
);

--------------------------------------------------------------------------------
-- Exemplos de Triggers (para atualizar ou inserir dados em fluxos de caixa)
--------------------------------------------------------------------------------

-- Trigger que, após inserir transação, verifica se há splits
-- e cria registros em user_cash_flows com base no split
CREATE OR REPLACE FUNCTION handle_transaction_splits() RETURNS TRIGGER AS $$
BEGIN
  -- Se existirem splits para essa transação, criar registro em user_cash_flows para cada split
  INSERT INTO user_cash_flows (user_id, transaction_id, amount, flow_date)
    SELECT
      ts.user_id,
      NEW.id,
      (NEW.amount * ts.split_percentage / 100.0),
      NEW.due_date
    FROM transaction_splits ts
    WHERE ts.transaction_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_transaction_splits ON transactions;
CREATE TRIGGER trg_handle_transaction_splits
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE PROCEDURE handle_transaction_splits();

-- Exemplo de trigger para atualizar o fluxo de caixa do usuário quando uma transação
-- sem splits é inserida (caso seja 'income' ou 'expense')
CREATE OR REPLACE FUNCTION handle_single_user_cash_flow() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.type = 'income' OR NEW.type = 'expense') THEN
    INSERT INTO user_cash_flows (user_id, transaction_id, amount, flow_date)
    VALUES (NEW.user_id, NEW.id, NEW.amount, NEW.due_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_single_user_cash_flow ON transactions;
CREATE TRIGGER trg_handle_single_user_cash_flow
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.type IN ('income','expense'))
EXECUTE PROCEDURE handle_single_user_cash_flow();

-- Exemplo de trigger para atualizar saldos da conta automaticamente
CREATE OR REPLACE FUNCTION update_account_balance() RETURNS TRIGGER AS $$
DECLARE
  old_balance numeric;
BEGIN
  SELECT current_balance INTO old_balance FROM accounts WHERE id = NEW.account_id;

  IF (NEW.type = 'income') THEN
    UPDATE accounts
       SET current_balance = old_balance + NEW.amount
     WHERE id = NEW.account_id;
  ELSIF (NEW.type = 'expense') THEN
    UPDATE accounts
       SET current_balance = old_balance - NEW.amount
     WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_account_balance ON transactions;
CREATE TRIGGER trg_update_account_balance
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE PROCEDURE update_account_balance();