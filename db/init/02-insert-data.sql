---------------------------------------------------------------------------
-- 02-insert-data.sql
--
-- Este script insere dados simulados para o ERP Doméstico, abrangendo:
--   • Cadastro de 2 usuários (Bruno e Tacy)
--   • Moeda (Real Brasileiro)
--   • Frequência mensal
--   • Centros de custo: "Contas de Casa" (para despesas compartilhadas) e "Salário" (para receitas individuais)
--   • Categorias de despesas (Electricity, Water, Internet, Groceries, Rent) e de receita (Salary)
--   • Pagadores e suas distribuições:
--         - "Casa" (50% Bruno, 50% Tacy) para as despesas compartilhadas
--         - "Bruno Salary" (100% Bruno) e "Tacy Salary" (100% Tacy) para os salários
--   • Cadastro de fornecedores e de uma RFP com produto (compra de geladeira)
--   • Entradas financeiras referentes a contas de janeiro/2025 (algumas com parcelamento)
--   • Salários individuais de janeiro/2025
--   • Atualização manual de um dos lançamentos para simular parcela não paga
---------------------------------------------------------------------------
  
---------------------------
-- 1. Usuários
---------------------------
INSERT INTO Users (name, email, wallet, password_hash)
VALUES 
  ('Bruno Silva', 'bruno@example.com', 0, 'hash_bruno'),
  ('Tacy Oliveira', 'tacy@example.com', 0, 'hash_tacy');

---------------------------
-- 2. Moeda (Finance_Currency)
---------------------------
INSERT INTO Finance_Currency (name, symbol, exchange_rate)
VALUES ('Real Brasileiro', 'R$', 1.0);

---------------------------
-- 3. Frequência Financeira (Finance_Frequency)
---------------------------
INSERT INTO Finance_Frequency (name, days_interval)
VALUES ('Mensal', 30);

---------------------------
-- 4. Centros de Custo (Finance_CC)
---------------------------
INSERT INTO Finance_CC (name, description)
VALUES 
  ('Contas de Casa', 'Despesas compartilhadas da casa'),
  ('Salário', 'Receitas de salário individuais');

---------------------------
-- 5. Categorias (Finance_Category)
---------------------------
-- Categorias para despesas de casa
INSERT INTO Finance_Category (name, description)
VALUES 
  ('Electricity', 'Conta de energia elétrica'),
  ('Water', 'Conta de água'),
  ('Internet', 'Conta de internet'),
  ('Groceries', 'Compras de supermercado'),
  ('Rent', 'Aluguel da residência');

-- Categoria para receitas (salário)
INSERT INTO Finance_Category (name, description)
VALUES ('Salary', 'Salário mensal');

---------------------------
-- 6. Pagadores e Distribuição (Finance_Payer e Finance_Payer_Users)
---------------------------
-- Pagador para despesas compartilhadas (Casa)
INSERT INTO Finance_Payer (name)
VALUES ('Casa');

INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
VALUES 
  (
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    50
  ),
  (
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    50
  );

-- Pagador para o salário do Bruno
INSERT INTO Finance_Payer (name)
VALUES ('Bruno Salary');

INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
VALUES 
  (
    (SELECT id FROM Finance_Payer WHERE name = 'Bruno Salary'),
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    100
  );

-- Pagador para o salário da Tacy
INSERT INTO Finance_Payer (name)
VALUES ('Tacy Salary');

INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
VALUES 
  (
    (SELECT id FROM Finance_Payer WHERE name = 'Tacy Salary'),
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    100
  );

---------------------------
-- 7. Fornecedores e Módulo Compras (RFP e Products)
---------------------------
-- Fornecedores
INSERT INTO Suppliers (name, contact_info, website, address, supplier_type, rating)
VALUES 
  (
    'Supermarket XYZ',
    '{"phone": "1111-2222", "email": "contato@superxyz.com"}',
    'http://www.superxyz.com',
    'Rua das Flores, 123',
    'physical store',
    4.5
  ),
  (
    'Loja de Eletrodomésticos ABC',
    '{"phone": "3333-4444", "email": "vendas@lojaabc.com"}',
    'http://www.lojaabc.com',
    'Av. dos Eletros, 456',
    'physical store',
    4.0
  );

-- RFP: Solicitação para compra de geladeira
INSERT INTO RFP (title, description, created_by, status, approved_at, approved_by, approval_notes)
VALUES 
  (
    'Compra de Geladeira',
    'Solicitação para compra de uma nova geladeira para a cozinha.',
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    'approved',
    '2025-01-10 10:00:00',
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    'Aprovada para melhorar a eficiência energética.'
  );

-- Produto associado à RFP (Geladeira)
INSERT INTO Products (name, description, quantity, unit_price, supplier_id, rfp_id)
VALUES 
  (
    'Geladeira Super Freezer 3000',
    'Geladeira com tecnologia de refrigeração avançada.',
    1,
    2500.00,
    (SELECT id FROM Suppliers WHERE name = 'Loja de Eletrodomésticos ABC'),
    (SELECT id FROM RFP WHERE title = 'Compra de Geladeira')
  );

---------------------------
-- 8. Entradas Financeiras (Finance_Entries)
-- As entradas abaixo representam contas de janeiro de 2025. 
-- Os lançamentos de despesas (is_income = false) utilizam o pagador "Casa" e frequência mensal.
-- Os lançamentos de salário (is_income = true) são individuais (frequency = NULL).
---------------------------
-- Contas de Casa:
-- a) Conta de energia elétrica (Electricity) – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Contas de Casa'),
    (SELECT id FROM Finance_Category WHERE name = 'Electricity'),
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
    false,
    200.00,
    '2025-01-05',
    'Conta de energia elétrica de janeiro',
    1
  );

-- b) Conta de água (Water) – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Contas de Casa'),
    (SELECT id FROM Finance_Category WHERE name = 'Water'),
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
    false,
    100.00,
    '2025-01-05',
    'Conta de água de janeiro',
    1
  );

-- c) Conta de internet (Internet) – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Contas de Casa'),
    (SELECT id FROM Finance_Category WHERE name = 'Internet'),
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
    false,
    150.00,
    '2025-01-05',
    'Conta de internet de janeiro',
    1
  );

-- d) Compras de supermercado (Groceries) – 2 parcelas
-- Simula que a 1ª parcela esteja paga e a 2ª pendente
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Contas de Casa'),
    (SELECT id FROM Finance_Category WHERE name = 'Groceries'),
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
    false,
    600.00,
    '2025-01-05',
    'Compras do supermercado de janeiro',
    2
  );

-- e) Aluguel (Rent) – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Contas de Casa'),
    (SELECT id FROM Finance_Category WHERE name = 'Rent'),
    (SELECT id FROM Finance_Payer WHERE name = 'Casa'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
    false,
    1200.00,
    '2025-01-05',
    'Aluguel de janeiro',
    1
  );

---------------------------
-- Entradas de Receita (Salário)
---------------------------
-- f) Salário do Bruno – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'bruno@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Salário'),
    (SELECT id FROM Finance_Category WHERE name = 'Salary'),
    (SELECT id FROM Finance_Payer WHERE name = 'Bruno Salary'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    NULL,
    true,
    5000.00,
    '2025-01-01',
    'Salário de janeiro',
    1
  );

-- g) Salário da Tacy – 1 parcela
INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, finance_currency_id, finance_frequency_id, is_income, amount, start_date, description, installments_count)
VALUES 
  (
    (SELECT id FROM Users WHERE email = 'tacy@example.com'),
    (SELECT id FROM Finance_CC WHERE name = 'Salário'),
    (SELECT id FROM Finance_Category WHERE name = 'Salary'),
    (SELECT id FROM Finance_Payer WHERE name = 'Tacy Salary'),
    (SELECT id FROM Finance_Currency WHERE name = 'Real Brasileiro'),
    NULL,
    true,
    4500.00,
    '2025-01-01',
    'Salário de janeiro',
    1
  );

---------------------------
-- 9. Ajuste de Status para Simular Parcelas Não Pagas
---------------------------
-- Para a entrada de "Compras do supermercado de janeiro" (Groceries) de 2 parcelas,
-- vamos atualizar a 2ª parcela para status 'pending', simulando que não foi paga.
UPDATE Finance_Installments
SET status = 'pending'
WHERE finance_entries_id = (
    SELECT id FROM Finance_Entries
    WHERE description = 'Compras do supermercado de janeiro'
)
  AND installment_number = 2;

-- Atualiza também o Transaction correspondente à 2ª parcela para 'pending'
UPDATE Transactions
SET status = 'pending'
WHERE finance_installments_id = (
    SELECT id FROM Finance_Installments
    WHERE finance_entries_id = (
        SELECT id FROM Finance_Entries
        WHERE description = 'Compras do supermercado de janeiro'
    )
      AND installment_number = 2
);

-- Para os demais lançamentos de janeiro, definimos os transactions como 'completed'
UPDATE Transactions
SET status = 'completed'
WHERE transaction_date >= '2025-01-01'
  AND transaction_date < '2025-02-01'
  AND id NOT IN (
      SELECT id FROM Transactions
      WHERE finance_installments_id = (
          SELECT id FROM Finance_Installments
          WHERE finance_entries_id = (
              SELECT id FROM Finance_Entries
              WHERE description = 'Compras do supermercado de janeiro'
          )
            AND installment_number = 2
      )
  );

---------------------------------------------------------------------------
-- FIM DO SCRIPT 02-insert-data.sql
---------------------------------------------------------------------------
