# Casa360 API Documentation

# Casa360 API Documentation

## Overview

Esta documentação descreve a API REST do sistema Casa360, que gerencia dados de residências, usuários, finanças e tarefas compartilhadas.

## Base URL

```
http://localhost:3000/api
```

## Authentication

O sistema usa autenticação JWT (JSON Web Token). Após o login, inclua o token recebido nos headers das requisições.

```
Authorization: Bearer {token}
```

---

## API Endpoints

### Authentication

#### Register User

```
POST /auth/register
```

**Request Body:**
```json
{
  "username": "usuario",
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "full_name": "Nome Completo"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "usuario",
    "email": "usuario@exemplo.com",
    "created_at": "2025-03-21T12:00:00Z"
  }
}
```

#### Login

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "usuario",
    "email": "usuario@exemplo.com",
    "houses": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "house_name": "Minha Casa",
        "role": "owner"
      }
    ]
  }
}
```

#### Get User Profile

```
GET /auth/profile
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "usuario",
    "email": "usuario@exemplo.com",
    "full_name": "Nome Completo",
    "avatar_url": null,
    "bio": null,
    "account_status": "active",
    "email_verified": false,
    "created_at": "2025-03-21T12:00:00Z"
  },
  "settings": {
    "theme": "light",
    "language": "pt-BR",
    "notification_preferences": {"email": true, "push": true},
    "default_house_id": "550e8400-e29b-41d4-a716-446655440001"
  },
  "houses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "house_name": "Minha Casa",
      "description": "Apartamento",
      "cover_image_url": null,
      "role": "owner"
    }
  ]
}
```

#### Update Profile

```
PUT /auth/profile
```

**Request Body:**
```json
{
  "full_name": "Nome Atualizado",
  "bio": "Minha biografia",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

#### Update Settings

```
PUT /auth/settings
```

**Request Body:**
```json
{
  "theme": "dark",
  "language": "en-US",
  "notification_preferences": {"email": true, "push": false},
  "default_house_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

#### Change Password

```
PUT /auth/change-password
```

**Request Body:**
```json
{
  "current_password": "senha123",
  "new_password": "novaSenha456"
}
```

---

### Houses

#### Create House

```
POST /houses
```

**Request Body:**
```json
{
  "house_name": "Minha Casa Nova",
  "description": "Descrição da casa",
  "address": "Rua Exemplo, 123"
}
```

**Response:**
```json
{
  "message": "House created successfully",
  "house": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "house_name": "Minha Casa Nova",
    "description": "Descrição da casa",
    "address": "Rua Exemplo, 123",
    "created_at": "2025-03-21T12:00:00Z"
  }
}
```

#### Get User Houses

```
GET /houses
```

**Response:**
```json
{
  "count": 1,
  "houses": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "house_name": "Minha Casa Nova",
      "description": "Descrição da casa",
      "address": "Rua Exemplo, 123",
      "cover_image_url": null,
      "created_at": "2025-03-21T12:00:00Z",
      "role": "owner",
      "permissions": {
        "read": true,
        "write": true,
        "delete": true,
        "admin": true
      }
    }
  ]
}
```

#### Get House By ID

```
GET /houses/{house_id}
```

**Response:**
```json
{
  "house": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "house_name": "Minha Casa Nova",
    "description": "Descrição da casa",
    "address": "Rua Exemplo, 123",
    "cover_image_url": null,
    "created_at": "2025-03-21T12:00:00Z",
    "updated_at": "2025-03-21T12:00:00Z",
    "role": "owner"
  },
  "members": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "usuario",
      "full_name": "Nome Completo",
      "avatar_url": null,
      "role": "owner",
      "joined_at": "2025-03-21T12:00:00Z"
    }
  ]
}
```

#### Update House

```
PUT /houses/{house_id}
```

**Request Body:**
```json
{
  "house_name": "Nome Atualizado",
  "description": "Nova descrição",
  "address": "Novo endereço",
  "cover_image_url": "https://example.com/house.jpg"
}
```

#### Delete House

```
DELETE /houses/{house_id}
```

#### Invite User to House

```
POST /houses/{house_id}/invite
```

**Request Body:**
```json
{
  "email": "convidado@exemplo.com",
  "role": "member"
}
```

#### Accept Invitation

```
POST /houses/invitations/{token}/accept
```

#### Get House Members

```
GET /houses/{house_id}/members
```

#### Update Member Role

```
PUT /houses/{house_id}/members/{member_id}
```

**Request Body:**
```json
{
  "role": "visitor"
}
```

#### Remove Member

```
DELETE /houses/{house_id}/members/{member_id}
```

#### Leave House

```
POST /houses/{house_id}/leave
```

#### Transfer Ownership

```
POST /houses/{house_id}/transfer-ownership
```

**Request Body:**
```json
{
  "new_owner_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

---

### House Data

#### Dashboard

```
GET /house/{house_id}/dashboard
```

**Response:**
```json
{
  "financialSummary": {
    "income": 5000.00,
    "expenses": 3500.00,
    "balance": 1500.00,
    "overdueTasks": 2,
    "upcomingTasks": 5
  },
  "upcomingTasks": [
    {
      "id": 1,
      "entry_type": "Finance_Entries",
      "entry_id": 10,
      "due_date": "2025-03-25T00:00:00Z",
      "amount": 500.00,
      "description": "Aluguel",
      "status": false,
      "is_expense": true,
      "category_name": "Moradia",
      "cost_center_name": "Despesas Fixas",
      "currency_symbol": "R$"
    }
  ],
  "recentTransactions": [
    {
      "id": 1,
      "transaction_date": "2025-03-20T10:30:00Z",
      "amount": 350.00,
      "description": "Compras supermercado",
      "is_expense": true,
      "category_name": "Alimentação",
      "cost_center_name": "Despesas Variáveis",
      "currency_symbol": "R$"
    }
  ],
  "walletBalances": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "usuario",
      "balance": 1200.50,
      "updated_at": "2025-03-21T10:00:00Z"
    }
  ]
}
```

#### Categories

```
GET /house/{house_id}/categories
GET /house/{house_id}/categories/{id}
POST /house/{house_id}/categories
PUT /house/{house_id}/categories/{id}
DELETE /house/{house_id}/categories/{id}
```

**Create/Update Request Body:**
```json
{
  "cost_center_id": 1,
  "name": "Alimentação",
  "description": "Gastos com alimentos"
}
```

#### Cost Centers

```
GET /house/{house_id}/cost-centers
GET /house/{house_id}/cost-centers/{id}
POST /house/{house_id}/cost-centers
PUT /house/{house_id}/cost-centers/{id}
DELETE /house/{house_id}/cost-centers/{id}
```

**Create/Update Request Body:**
```json
{
  "name": "Despesas Fixas",
  "description": "Despesas mensais fixas"
}
```

#### Currencies

```
GET /house/{house_id}/currencies
GET /house/{house_id}/currencies/{id}
POST /house/{house_id}/currencies
PUT /house/{house_id}/currencies/{id}
DELETE /house/{house_id}/currencies/{id}
```

**Create/Update Request Body:**
```json
{
  "code": "BRL",
  "symbol": "R$",
  "exchange_rate": 1.0000
}
```

#### Documents

```
GET /house/{house_id}/documents
GET /house/{house_id}/documents/{id}
POST /house/{house_id}/documents
DELETE /house/{house_id}/documents/{id}
```

**Upload Request:**
```
Content-Type: multipart/form-data
document: [FILE]
```

#### Frequencies

```
GET /house/{house_id}/frequencies
GET /house/{house_id}/frequencies/{id}
POST /house/{house_id}/frequencies
PUT /house/{house_id}/frequencies/{id}
DELETE /house/{house_id}/frequencies/{id}
```

**Create/Update Request Body:**
```json
{
  "name": "Mensal",
  "description": "Recorrência mensal",
  "scheduler_cron": "0 0 1 * *"
}
```

#### Payers

```
GET /house/{house_id}/payers
GET /house/{house_id}/payers/{id}
POST /house/{house_id}/payers
PUT /house/{house_id}/payers/{id}
DELETE /house/{house_id}/payers/{id}
```

**Create/Update Request Body:**
```json
{
  "name": "João",
  "description": "Morador"
}
```

#### Payments

```
GET /house/{house_id}/payments
GET /house/{house_id}/payments/{id}
POST /house/{house_id}/payments
PUT /house/{house_id}/payments/{id}
DELETE /house/{house_id}/payments/{id}
```

**Create/Update Request Body:**
```json
{
  "payer_id": 1,
  "percentage": 100.00,
  "details": [
    {
      "payer_id": 1,
      "percentage": 50.00
    },
    {
      "payer_id": 2,
      "percentage": 50.00
    }
  ]
}
```

#### Finance Entries

```
GET /house/{house_id}/finance-entries
GET /house/{house_id}/finance-entries/{id}
POST /house/{house_id}/finance-entries
PUT /house/{house_id}/finance-entries/{id}
DELETE /house/{house_id}/finance-entries/{id}
```

**Create/Update Request Body:**
```json
{
  "user_id": 1,
  "category_id": 1,
  "currency_id": 1,
  "amount": 500.00,
  "frequency_id": 1,
  "start_date": "2025-04-01",
  "end_date": "2025-12-31",
  "description": "Aluguel",
  "type": true,
  "payment_id": 1
}
```

#### Task Entries

```
GET /house/{house_id}/task-entries
GET /house/{house_id}/task-entries/{id}
POST /house/{house_id}/task-entries
PUT /house/{house_id}/task-entries/{id}
DELETE /house/{house_id}/task-entries/{id}
```

**Create/Update Request Body:**
```json
{
  "user_id": 1,
  "category_id": 1,
  "currency_id": 1,
  "amount": 0.00,
  "frequency_id": 1,
  "start_date": "2025-04-01",
  "end_date": "2025-12-31",
  "description": "Limpar casa"
}
```

#### Tasks

```
GET /house/{house_id}/tasks
GET /house/{house_id}/tasks/{id}
```

---


## Fluxo de Uso (Script Shell com cURL)

Salve o script abaixo em um arquivo (por exemplo, `casa360_flow.sh`) e execute-o:

```bash
#!/bin/bash
# Casa360 - Fluxo completo de uso via API

BASE_URL="http://localhost:3000/api"
TOKEN=""

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== CASA360 API FLOW TEST ===${NC}\n"

# 1. Registrar um novo usuário
echo -e "${GREEN}1. Registrando novo usuário...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }')
echo "$REGISTER_RESPONSE" | json_pp
echo -e "\n"

# 2. Login para obter token
echo -e "${GREEN}2. Realizando login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')
echo "$LOGIN_RESPONSE" | json_pp
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')
echo -e "\nToken: $TOKEN\n"

if [ -z "$TOKEN" ]; then
  echo -e "${RED}Falha ao obter token. Encerrando teste.${NC}"
  exit 1
fi

# 3. Criar uma casa
echo -e "${GREEN}3. Criando uma casa...${NC}"
HOUSE_RESPONSE=$(curl -s -X POST $BASE_URL/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "house_name": "Casa Teste",
    "description": "Casa para teste da API",
    "address": "Rua de Teste, 123"
  }')
echo "$HOUSE_RESPONSE" | json_pp
HOUSE_ID=$(echo $HOUSE_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
echo -e "\nHouse ID: $HOUSE_ID\n"

if [ -z "$HOUSE_ID" ]; then
  echo -e "${RED}Falha ao obter house_id. Encerrando teste.${NC}"
  exit 1
fi

# 4. Obter informações da casa
echo -e "${GREEN}4. Obtendo informações da casa...${NC}"
curl -s -X GET $BASE_URL/houses/$HOUSE_ID \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

# 5. Criar um centro de custo
echo -e "${GREEN}5. Criando centro de custo...${NC}"
CC_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/cost-centers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Despesas Fixas",
    "description": "Despesas mensais fixas"
  }')
echo "$CC_RESPONSE" | json_pp
CC_ID=$(echo $CC_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nCost Center ID: $CC_ID\n"

# 6. Criar uma categoria
echo -e "${GREEN}6. Criando categoria...${NC}"
CAT_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"cost_center_id\": $CC_ID,
    \"name\": \"Moradia\",
    \"description\": \"Despesas com moradia\"
  }")
echo "$CAT_RESPONSE" | json_pp
CAT_ID=$(echo $CAT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nCategory ID: $CAT_ID\n"

# 7. Criar moeda
echo -e "${GREEN}7. Criando moeda...${NC}"
CURR_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/currencies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "code": "BRL",
    "symbol": "R$",
    "exchange_rate": 1.0000
  }')
echo "$CURR_RESPONSE" | json_pp
CURR_ID=$(echo $CURR_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nCurrency ID: $CURR_ID\n"

# 8. Criar frequência
echo -e "${GREEN}8. Criando frequência...${NC}"
FREQ_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/frequencies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Mensal",
    "description": "Recorrência mensal",
    "scheduler_cron": "0 0 1 * *"
  }')
echo "$FREQ_RESPONSE" | json_pp
FREQ_ID=$(echo $FREQ_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nFrequency ID: $FREQ_ID\n"

# 9. Criar pagador
echo -e "${GREEN}9. Criando pagador...${NC}"
PAYER_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/payers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "TestUser",
    "description": "Usuário de teste"
  }')
echo "$PAYER_RESPONSE" | json_pp
PAYER_ID=$(echo $PAYER_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nPayer ID: $PAYER_ID\n"

# 10. Criar método de pagamento
echo -e "${GREEN}10. Criando método de pagamento...${NC}"
PAYMENT_RESPONSE=$(curl -s -X POST $BASE_URL/house/$HOUSE_ID/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"payer_id\": $PAYER_ID,
    \"percentage\": 100.00
  }")
echo "$PAYMENT_RESPONSE" | json_pp
PAYMENT_ID=$(echo $PAYMENT_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
echo -e "\nPayment ID: $PAYMENT_ID\n"

# 11. Criar lançamento financeiro
echo -e "${GREEN}11. Criando lançamento financeiro...${NC}"
USER_ID=$(curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" | grep -o '"id":"[^"]*' | head -1 | sed 's/"id":"//')

curl -s -X POST $BASE_URL/house/$HOUSE_ID/finance-entries \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"category_id\": $CAT_ID,
    \"currency_id\": $CURR_ID,
    \"amount\": 1500.00,
    \"frequency_id\": $FREQ_ID,
    \"start_date\": \"2025-04-01\",
    \"end_date\": \"2025-12-31\",
    \"description\": \"Aluguel\",
    \"type\": true,
    \"payment_id\": $PAYMENT_ID
  }" | json_pp
echo -e "\n"

# 12. Visualizar dashboard
echo -e "${GREEN}12. Visualizando dashboard...${NC}"
curl -s -X GET $BASE_URL/house/$HOUSE_ID/dashboard \
  -H "Authorization: Bearer $TOKEN" | json_pp
echo -e "\n"

echo -e "${YELLOW}=== TESTE CONCLUÍDO COM SUCESSO ===${NC}\n"
```

Certifique-se de dar permissão de execução ao arquivo antes de executá-lo:

```bash
chmod +x casa360_flow.sh
./casa360_flow.sh
```
