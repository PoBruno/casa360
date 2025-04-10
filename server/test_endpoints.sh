#!/bin/bash

# Configuração básica
BASE_URL="http://localhost:3000/api"
TOKEN=""

# Função para fazer login e obter token
echo "Fazendo login..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "senha123"}' | jq -r '.token')

# Auth endpoints
echo "Testando endpoints de autenticação..."
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "senha123", "full_name": "Test User"}'

curl -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN"

curl -X PUT $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Updated Name", "bio": "New bio"}'

curl -X PUT $BASE_URL/auth/settings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark", "language": "pt-BR"}'

curl -X PUT $BASE_URL/auth/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password": "senha123", "new_password": "novaSenha123"}'

# Houses endpoints
echo "Testando endpoints de casas..."
curl -X POST $BASE_URL/houses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"house_name": "Casa Teste", "description": "Descrição da casa", "address": "Rua Teste, 123"}'

curl -X GET $BASE_URL/houses \
  -H "Authorization: Bearer $TOKEN"

curl -X GET $BASE_URL/houses/1 \
  -H "Authorization: Bearer $TOKEN"

curl -X PUT $BASE_URL/houses/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"house_name": "Casa Atualizada", "description": "Nova descrição"}'

curl -X DELETE $BASE_URL/houses/1 \
  -H "Authorization: Bearer $TOKEN"

# House members endpoints
echo "Testando endpoints de membros da casa..."
curl -X POST $BASE_URL/houses/1/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "convidado@example.com", "role": "member"}'

curl -X POST $BASE_URL/houses/1/invite/accept \
  -H "Authorization: Bearer $TOKEN"

curl -X GET $BASE_URL/houses/1/members \
  -H "Authorization: Bearer $TOKEN"

curl -X PUT $BASE_URL/houses/1/members/1/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'

curl -X DELETE $BASE_URL/houses/1/members/1 \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/leave \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/transfer-ownership \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_owner_id": "2"}'

# Finance endpoints
echo "Testando endpoints financeiros..."
curl -X GET $BASE_URL/houses/1/finance/categories \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/finance/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alimentação", "description": "Gastos com alimentação"}'

curl -X GET $BASE_URL/houses/1/finance/entries \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/finance/entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Compras do mês", "amount": 100.50, "category_id": 1, "date": "2024-03-25"}'

curl -X GET $BASE_URL/houses/1/finance/currencies \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/finance/currencies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "BRL", "name": "Real Brasileiro", "symbol": "R$"}'

curl -X GET $BASE_URL/houses/1/finance/payers \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/finance/payers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "João", "email": "joao@example.com"}'

# Task endpoints
echo "Testando endpoints de tarefas..."
curl -X GET $BASE_URL/houses/1/tasks \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Limpar casa", "description": "Limpar todos os cômodos", "due_date": "2024-03-30"}'

curl -X GET $BASE_URL/houses/1/tasks/1 \
  -H "Authorization: Bearer $TOKEN"

curl -X PUT $BASE_URL/houses/1/tasks/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Limpar casa", "description": "Limpar todos os cômodos", "status": "completed"}'

curl -X DELETE $BASE_URL/houses/1/tasks/1 \
  -H "Authorization: Bearer $TOKEN"

# Document endpoints
echo "Testando endpoints de documentos..."
curl -X GET $BASE_URL/houses/1/documents \
  -H "Authorization: Bearer $TOKEN"

curl -X POST $BASE_URL/houses/1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Contrato", "description": "Contrato de aluguel", "type": "pdf"}'

curl -X GET $BASE_URL/houses/1/documents/1 \
  -H "Authorization: Bearer $TOKEN"

curl -X DELETE $BASE_URL/houses/1/documents/1 \
  -H "Authorization: Bearer $TOKEN"

echo "Testes concluídos!" 