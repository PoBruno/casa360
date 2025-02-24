# Casa360 API Documentation

## Authentication

All protected routes require a Bearer token in the Authorization header:
```bash
Authorization: Bearer <your-jwt-token>
```

## Response Formats

### Success Response
```json
{
  "data": <response_data>,
  "message": "Success message"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Available Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
```
**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```
POST /api/auth/login
```
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "string",
    "created_at": "timestamp"
  }
}
```

### Houses

#### Create House
```
POST /api/houses
```
**Request Body:**
```json
{
  "houseName": "string"
}
```
**Response:**
```json
{
  "houseId": "uuid"
}
```

#### Get User's Houses
```
GET /api/houses
```
**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "house_name": "string",
    "created_at": "timestamp"
  }
]
```

### Financial Endpoints

All financial endpoints are prefixed with `/api/house/{house_id}/`

#### 1. Finance Frequency

```
GET    /finance-frequency
GET    /finance-frequency/{id}
POST   /finance-frequency
PUT    /finance-frequency/{id}
DELETE /finance-frequency/{id}
```

**Request Body (POST/PUT):**
```json
{
  "name": "string",
  "days_interval": "number"
}
```

#### 2. Finance CC (Cost Centers)

```
GET    /finance-cc
GET    /finance-cc/{id}
POST   /finance-cc
PUT    /finance-cc/{id}
DELETE /finance-cc/{id}
```

**Request Body (POST/PUT):**
```json
{
  "name": "string",
  "description": "string"
}
```

#### 3. Finance Category

```
GET    /finance-category
GET    /finance-category/{id}
POST   /finance-category
PUT    /finance-category/{id}
DELETE /finance-category/{id}
```

**Request Body (POST/PUT):**
```json
{
  "name": "string",
  "parent_category_id": "number|null"
}
```

#### 4. Finance Payer

```
GET    /finance-payer
GET    /finance-payer/{id}
POST   /finance-payer
PUT    /finance-payer/{id}
DELETE /finance-payer/{id}
```

**Request Body (POST/PUT):**
```json
{
  "name": "string"
}
```

#### 5. Finance Payer Users

```
GET    /finance-payer-users
GET    /finance-payer-users/payer/{payer_id}
POST   /finance-payer-users
PUT    /finance-payer-users/{payer_id}/user/{user_id}
DELETE /finance-payer-users/{payer_id}/user/{user_id}
```

**Request Body (POST/PUT):**
```json
{
  "finance_payer_id": "number",
  "user_id": "string",
  "percentage": "number"
}
```

#### 6. Finance Currency

```
GET    /finance-currency
GET    /finance-currency/{id}
POST   /finance-currency
PUT    /finance-currency/{id}
DELETE /finance-currency/{id}
```

**Request Body (POST/PUT):**
```json
{
  "name": "string",
  "symbol": "string",
  "exchange_rate": "number"
}
```

#### 7. Finance Entries

```
GET    /finance-entries
GET    /finance-entries/{id}
POST   /finance-entries
PUT    /finance-entries/{id}
DELETE /finance-entries/{id}
```

**Request Body (POST/PUT):**
```json
{
  "user_id": "number",
  "finance_cc_id": "number",
  "finance_category_id": "number",
  "finance_payer_id": "number",
  "finance_currency_id": "number",
  "finance_frequency_id": "number|null",
  "is_income": "boolean",
  "amount": "number",
  "start_date": "date",
  "end_date": "date|null",
  "description": "string",
  "installments_count": "number",
  "is_fixed": "boolean",
  "is_recurring": "boolean",
  "payment_day": "number|null"
}
```

#### 8. Finance Installments

```
GET    /finance-installments
GET    /finance-installments/{id}
PUT    /finance-installments/{id}
PUT    /finance-installments/{id}/status
DELETE /finance-installments/{id}
```

**Request Body:**
```json
{
  "id": "number",
  "finance_entries_id": "number",
  "installment_number": "number",
  "due_date": "date",
  "amount": "number",
  "status": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### 9. Transactions

```
GET    /transactions
GET    /transactions/{id}
POST   /transactions
DEL   /transactions/{id}
```

**Request Body (POST):**
```json
{
  "user_id": "number",
  "finance_installments_id": "number",
  "amount": "number",
  "is_income": "boolean",
  "description": "string",
  "status": "string"
}
```

#### 9. Finance Users

```
GET    /finance-users
GET    /finance-users/{id}
POST   /finance-users
PUT    /finance-users/{id}
DEL    /finance-users/{id}
```

**Request Body (POST):**
```json
{
  "name": "User Name",
  "email": "user@email.com"
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Notes

1. All protected routes require authentication via Bearer token
2. All dates should be sent in ISO 8601 format
3. All monetary values should be sent as numbers with up to 2 decimal places
4. House access is restricted to users with appropriate permissions
5. Only owners can perform write operations on house data

## Rate Limiting

- Standard rate limit: 100 requests per minute
- Authentication endpoints: 10 requests per minute

## Data Validation

- All string fields have maximum lengths
- Monetary values must be positive
- Percentages must be between 0 and 100
- Dates must be valid and in the correct format

