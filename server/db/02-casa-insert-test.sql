

----------------------------------------------
-- 0. Limpar as tabelas para evitar duplicação
----------------------------------------------
--DO $$
--BEGIN
--  TRUNCATE TABLE Transactions, Finance_Installments, Finance_Entries,
--      Finance_Payer_Users, Finance_Payer, Finance_Currency,
--      Finance_Category, Finance_CC, Finance_Frequency, Users
--    RESTART IDENTITY CASCADE;
--END $$;
----------------------------------------------


-- 1. Inserir Usuários
INSERT INTO Users (name, email)
VALUES
    ('Bruno', 'bruno@email.com'),
    ('Tacy', 'tacy@email.com');


-- 2. Inserir Frequências
INSERT INTO Finance_Frequency (name, days_interval)
VALUES
  ('Mensal', 30),
  ('Quinzenal', 15),
  ('Anual', 365);


-- 3. Inserir Centros de Custo
INSERT INTO Finance_CC (name, description)
VALUES
  ('Moradia', 'Despesas relacionadas à habitação'),
  ('Pets', 'Despesas com animais de estimação'),
  ('Saúde', 'Despesas médicas e bem-estar'),
  ('Transporte', 'Despesas com locomoção'),
  ('Alimentação', 'Despesas com alimentação'),
  ('Educação', 'Despesas com formação'),
  ('Investimentos', 'Aplicações financeiras'),
  ('Lazer', 'Despesas com entretenimento'),
  ('Receita', 'Entradas financeiras');


-- 4. Inserir Categorias com hierarquia
DO $$
DECLARE
  v_moradia_id INT;
  v_pets_id INT;
  v_saude_id INT;
  v_transporte_id INT;
  v_alimentacao_id INT;
  v_educacao_id INT;
  v_investimentos_id INT;
  v_lazer_id INT;
  v_receita_id INT;
BEGIN
  -- Categorias principais  
  INSERT INTO Finance_Category (name, description)
    VALUES ('Moradia', 'Categoria principal')
    RETURNING id INTO v_moradia_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Pets', 'Categoria principal')
    RETURNING id INTO v_pets_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Saúde', 'Categoria principal')
    RETURNING id INTO v_saude_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Transporte', 'Categoria principal')
    RETURNING id INTO v_transporte_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Alimentação', 'Categoria principal')
    RETURNING id INTO v_alimentacao_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Educação', 'Categoria principal')
    RETURNING id INTO v_educacao_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Investimentos', 'Categoria principal')
    RETURNING id INTO v_investimentos_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Lazer', 'Categoria principal')
    RETURNING id INTO v_lazer_id;
  INSERT INTO Finance_Category (name, description)
    VALUES ('Receita', 'Categoria principal')
    RETURNING id INTO v_receita_id;

  -- Subcategorias conforme mapeamento:
  INSERT INTO Finance_Category (name, parent_category_id) VALUES
    ('Água e Esgoto', v_moradia_id),
    ('Alimentação', v_pets_id),
    ('Atividades', v_saude_id),
    ('Deslocamento', v_transporte_id),
    ('Compras Mensais', v_alimentacao_id),
    ('Cursos', v_educacao_id),
    ('Energia Elétrica', v_moradia_id),
    ('Impostos e Taxas', v_moradia_id),
    ('Internet e TV', v_moradia_id),
    ('Moradia', v_moradia_id),
    ('Passagem', v_transporte_id),
    ('Poupança', v_investimentos_id),
    ('Renda Fixa', v_receita_id),
    ('Renda Freelance', v_receita_id),
    ('Streaming', v_lazer_id),
    ('Plano de Saúde', v_saude_id),
    ('Trabalho', v_receita_id),
    ('Atividades Físicas', v_saude_id),
    ('Seguro Saúde', v_saude_id),
    ('Combustível', v_transporte_id);
END $$;


-- 5. Inserir Pagadores e relação (Finance_Payer + Finance_Payer_Users)
--TRUNCATE TABLE Finance_Payer_Users CASCADE;
--TRUNCATE TABLE Finance_Payer CASCADE;

-- Inserir pagadores simples
INSERT INTO Finance_Payer (name) VALUES 
  ('Bruno'),
  ('Tacy'),
  ('Casal');

-- Inserir as relações
WITH user_ids AS (
  SELECT id, name FROM Users WHERE name IN ('Bruno', 'Tacy')
),
payer_ids AS (
  SELECT id, name FROM Finance_Payer WHERE name IN ('Bruno', 'Tacy', 'Casal')
)
INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
SELECT 
  p.id,
  u.id,
  CASE 
    WHEN p.name = u.name THEN 100
    WHEN p.name = 'Casal' THEN 50
  END
FROM payer_ids p
CROSS JOIN user_ids u
WHERE p.name = u.name OR p.name = 'Casal';


-- 6. Inserir Moeda
INSERT INTO Finance_Currency (name, symbol, exchange_rate) VALUES 
  ('Real', 'R$', 1.0000),
  ('Dólar', 'US$', 5.0000),
  ('Euro', '€', 6.0000);


-- 7. Inserir Entradas Financeiras
INSERT INTO Finance_Entries (
  user_id, finance_cc_id, finance_category_id, finance_payer_id,
  finance_currency_id, finance_frequency_id, is_income, amount,
  start_date, payment_day, description, installments_count, is_recurring
)
VALUES (
  (SELECT id FROM Users WHERE name = 'Bruno'),
  (SELECT id FROM Finance_CC WHERE name = 'Alimentação'),
  (SELECT id FROM Finance_Category WHERE name = 'Compras Mensais'),
  (SELECT id FROM Finance_Payer WHERE name LIKE 'Casal%' LIMIT 1),
  (SELECT id FROM Finance_Currency WHERE name = 'Real'),
  (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
  FALSE,
  650.00,
  '2024-10-15',
  15,
  'Supermercado',
  1,
  TRUE
);


-- Row 2: Renda Fixa (Salário Bruno - Receita)
INSERT INTO Finance_Entries (
  user_id, finance_cc_id, finance_category_id, finance_payer_id,
  finance_currency_id, finance_frequency_id, is_income, amount,
  start_date, payment_day, description, installments_count, is_recurring
)
VALUES (
  (SELECT id FROM Users WHERE name = 'Bruno'),
  (SELECT id FROM Finance_CC WHERE name = 'Receita'),
  (SELECT id FROM Finance_Category WHERE name = 'Renda Fixa'),
  (SELECT id FROM Finance_Payer WHERE name = 'Bruno' LIMIT 1),
  (SELECT id FROM Finance_Currency WHERE name = 'Real'),
  (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
  TRUE,
  3400.00,
  '2024-10-01',
  1,
  'Salário Bruno',
  1,
  TRUE
);


-- Row 3: Renda Fixa (Salário Tacy - Receita)
INSERT INTO Finance_Entries (
  user_id, finance_cc_id, finance_category_id, finance_payer_id,
  finance_currency_id, finance_frequency_id, is_income,
  amount, start_date, payment_day, description, installments_count, is_recurring
)
VALUES (
  (SELECT id FROM Users WHERE name = 'Tacy'),
  (SELECT id FROM Finance_CC WHERE name = 'Receita'),
  (SELECT id FROM Finance_Category WHERE name = 'Renda Fixa'),
  (SELECT id FROM Finance_Payer WHERE name = 'Tacy' LIMIT 1),
  (SELECT id FROM Finance_Currency WHERE name = 'Real'),
  (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
  TRUE,
  3400.00,
  '2024-10-01',
  1,
  'Salário Tacy',
  1,
  TRUE
);


-- Row 4: Aluguel (Despesa)
INSERT INTO Finance_Entries (
  user_id, finance_cc_id, finance_category_id, finance_payer_id,
  finance_currency_id, finance_frequency_id, is_income, amount,
  start_date, payment_day, description, installments_count, is_recurring
)
VALUES (
  (SELECT id FROM Users WHERE name = 'Tacy'),
  (SELECT id FROM Finance_CC WHERE name = 'Moradia'),
  (SELECT id FROM Finance_Category WHERE id = 19),
  (SELECT id FROM Finance_Payer WHERE name LIKE 'Casal%' LIMIT 1),
  (SELECT id FROM Finance_Currency WHERE name = 'Real'),
  (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
  FALSE,
  2000.00,
  '2024-10-01',
  1,
  'Aluguel',
  1,
  TRUE
);

-- Row 5: Condominio (Despesa)
INSERT INTO Finance_Entries (
  user_id, finance_cc_id, finance_category_id, finance_payer_id,
  finance_currency_id, finance_frequency_id, is_income, amount,
  start_date, payment_day, description, installments_count, is_recurring
)
VALUES (
  (SELECT id FROM Users WHERE name = 'Tacy'),
  (SELECT id FROM Finance_CC WHERE name = 'Moradia'),
  (SELECT id FROM Finance_Category WHERE id = 19),
  (SELECT id FROM Finance_Payer WHERE name LIKE 'Casal%' LIMIT 1),
  (SELECT id FROM Finance_Currency WHERE name = 'Real'),
  (SELECT id FROM Finance_Frequency WHERE name = 'Mensal'),
  FALSE,
  270.00,
  '2024-10-01',
  1,
  'Condomínio',
  1,
  TRUE
);
