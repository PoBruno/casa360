# Casa360 API Documentation

## Overview

Esta documentação descreve a API REST do sistema Casa360, que gerencia dados de residências, usuários, finanças e tarefas compartilhadas.

## Sumário

- [Base URL](#base-url)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
    - [Register User](#register-user)
    - [Login](#login)
    - [Get User Profile](#get-user-profile)
    - [Update Profile](#update-profile)
    - [Update Settings](#update-settings)
    - [Change Password](#change-password)
  - [Houses](#houses)
    - [Create House](#create-house)
    - [Get User Houses](#get-user-houses)
    - [Get House By ID](#get-house-by-id)
    - [Update House](#update-house)
    - [Delete House](#delete-house)
    - [Invite User to House](#invite-user-to-house)
    - [Accept Invitation](#accept-invitation)
    - [Get House Members](#get-house-members)
    - [Update Member Role](#update-member-role)
    - [Remove Member](#remove-member)
    - [Leave House](#leave-house)
    - [Transfer Ownership](#transfer-ownership)
  - [House Data](#house-data)
    - [Dashboard](#dashboard)
    - [Categories](#categories)
    - [Cost Centers](#cost-centers)
    - [Currencies](#currencies)
    - [Documents](#documents)
    - [Frequencies](#frequencies)
    - [Payers](#payers)
    - [Payments](#payments)
    - [Finance Entries](#finance-entries)
    - [Task Entries](#task-entries)
    - [Tasks](#tasks)


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

