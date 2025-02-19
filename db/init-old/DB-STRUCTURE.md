
## 1. Listagens (Cadastros)

**Usuários:**
```sql
SELECT * FROM users ORDER BY created_at;
```

**Contas:**
```sql
SELECT a.*, u.name AS owner, c.code AS currency_code
FROM accounts a
JOIN users u ON a.user_id = u.id
JOIN currencies c ON a.currency_id = c.id
ORDER BY a.created_at;
```

**Categorias:**
```sql
SELECT c.*, u.name AS owner,
       (SELECT name FROM categories WHERE id = c.parent_id) AS parent_category
FROM categories c
JOIN users u ON c.user_id = u.id
ORDER BY c.created_at;
```

**Recorrências:**
```sql
SELECT * FROM recurrences ORDER BY start_date;
```

**Solicitações de Compra:**
```sql
SELECT pr.*, u.name AS requester
FROM purchase_requests pr
JOIN users u ON pr.user_id = u.id
ORDER BY pr.request_date;
```

**Fornecedores:**
```sql
SELECT * FROM suppliers ORDER BY created_at;
```

**Cotações de Compra:**
```sql
SELECT pq.*, pr.title AS request_title, s.name AS supplier_name
FROM purchase_quotes pq
JOIN purchase_requests pr ON pq.purchase_request_id = pr.id
JOIN suppliers s ON pq.supplier_id = s.id
ORDER BY pq.created_at;
```

**Transações:**
```sql
SELECT t.*, u.name AS user, a.name AS account, cat.name AS category
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN accounts a ON t.account_id = a.id
JOIN categories cat ON t.category_id = cat.id
ORDER BY t.created_at;
```

**Anexos:**
```sql
SELECT att.*, u.name AS uploader
FROM attachments att
JOIN users u ON att.user_id = u.id
ORDER BY att.uploaded_at;
```

**Importações:**
```sql
SELECT i.*, u.name AS user, a.name AS account
FROM imports i
JOIN users u ON i.user_id = u.id
JOIN accounts a ON i.account_id = a.id
ORDER BY i.started_at;
```

**Histórico de Saldos:**
```sql
SELECT ab.*
FROM account_balances ab
ORDER BY ab.balance_date;
```

**Planos Orçamentários:**
```sql
SELECT bp.*, u.name AS user, cat.name AS category
FROM budget_plans bp
JOIN users u ON bp.user_id = u.id
JOIN categories cat ON bp.category_id = cat.id
ORDER BY bp.start_date;
```

**Relatórios Financeiros:**
```sql
SELECT fr.*, u.name AS user
FROM financial_reports fr
JOIN users u ON fr.user_id = u.id
ORDER BY fr.generated_at;
```

**Tarefas:**
```sql
SELECT t.*, u.name AS user, ts.name AS status
FROM tasks t
JOIN users u ON t.user_id = u.id
JOIN task_statuses ts ON t.status_id = ts.id
ORDER BY t.due_date;
```

**Status de Tarefas:**
```sql
SELECT * FROM task_statuses ORDER BY order_value;
```

**Eventos (Agenda):**
```sql
SELECT e.*, u.name AS user
FROM events e
JOIN users u ON e.user_id = u.id
ORDER BY e.start_time;
```

**Logs de Auditoria:**
```sql
SELECT * FROM audit_logs ORDER BY created_at;
```

---

## 2. Queries de Análise Financeira

### 2.1. Contas Atrasadas (Transações Pendentes com Data de Vencimento Passada)
```sql
SELECT t.id, t.description, t.amount, t.due_date, u.name AS user, a.name AS account
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN accounts a ON t.account_id = a.id
WHERE t.status = 'pending'
  AND t.due_date < CURRENT_DATE
ORDER BY t.due_date;
```

### 2.2. Receita vs. Despesa por Mês
```sql
SELECT date_trunc('month', due_date) AS month,
       SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
       SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
FROM transactions
WHERE due_date BETWEEN '2024-01-01' AND CURRENT_DATE
GROUP BY month
ORDER BY month;
```

### 2.3. Gasto por Categoria (Despesas)
```sql
SELECT cat.name AS category,
       SUM(t.amount) AS total_spent
FROM transactions t
JOIN categories cat ON t.category_id = cat.id
WHERE t.type = 'expense'
GROUP BY cat.name
ORDER BY total_spent DESC;
```

### 2.4. Análise por Tipo de Despesa (Ex.: Serviços vs. Casa)
> *Nesta query, fazemos uma classificação customizada baseada nos nomes das categorias.*
```sql
SELECT 
    CASE 
        WHEN cat.name IN ('Spotify', 'Netflix', 'Google One') THEN 'Serviços'
        WHEN cat.name IN ('Aluguel', 'Condomínio', 'Água', 'Luz', 'Internet', 'Mercado') THEN 'Casa'
        ELSE 'Outros'
    END AS expense_group,
    SUM(t.amount) AS total_amount
FROM transactions t
JOIN categories cat ON t.category_id = cat.id
WHERE t.type = 'expense'
GROUP BY expense_group;
```

### 2.5. Transações do Mês Atual
```sql
SELECT t.*, u.name AS user, cat.name AS category, a.name AS account
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN categories cat ON t.category_id = cat.id
JOIN accounts a ON t.account_id = a.id
WHERE date_trunc('month', t.due_date) = date_trunc('month', CURRENT_DATE)
ORDER BY t.due_date;
```

### 2.6. Análise de Fluxo de Caixa (Baseado em account_balances)
```sql
SELECT ab.balance_date,
       ab.opening_balance,
       ab.closing_balance,
       ab.total_income,
       ab.total_expenses,
       (ab.closing_balance - ab.opening_balance) AS net_change
FROM account_balances ab
ORDER BY ab.balance_date;
```

### 2.7. Relatório Detalhado de Transações com Anexos
```sql
SELECT t.id, t.due_date, t.payment_date, t.description, t.amount, t.status,
       cat.name AS category, u.name AS user,
       att.file_name, att.file_path
FROM transactions t
JOIN categories cat ON t.category_id = cat.id
JOIN users u ON t.user_id = u.id
LEFT JOIN attachments att ON t.id = att.transaction_id
ORDER BY t.due_date;
```

### 2.8. Análise Agregada por Usuário (Receitas e Despesas Totais)
```sql
SELECT u.name,
       COUNT(t.id) AS total_transactions,
       SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS total_income,
       SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS total_expenses
FROM transactions t
JOIN users u ON t.user_id = u.id
GROUP BY u.name
ORDER BY u.name;
```

### 2.9. Consulta Parametrizada: Transações em um Período (Filtro Dinâmico)
```sql
-- Substitua as datas conforme desejado
SELECT *
FROM transactions
WHERE due_date BETWEEN '2024-01-01' AND '2024-02-29'
ORDER BY due_date;
```
