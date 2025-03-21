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
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
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