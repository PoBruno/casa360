#!/bin/bash
# Casa360 - Fluxo completo de uso via API
#BASE_URL="http://20.206.149.83:3000/api"

#!/bin/bash
# filepath: test-api.sh

# Variables
API_URL="http://localhost:3000/api"
TOKEN=""
HOUSE_ID=""
USER_ID=""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

section() {
    echo -e "\n${BLUE}===== $1 =====${NC}"
}

subsection() {
    echo -e "${YELLOW}--- $1 ---${NC}"
}

success() {
    echo -e "${GREEN}$1${NC}"
}

# Auth endpoints
test_auth() {
    section "Testing Auth Endpoints"
    
    # Register a new user
    subsection "Registering new user"
    REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","email":"brunoshy@gmail.com","password":"123","full_name":"Test User"}')
    
    echo $REGISTER_RESPONSE | jq '.'
    
    # Login
    subsection "Logging in"
    LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"brunoshy@gmail.com","password":"123"}')
    
    echo $LOGIN_RESPONSE | jq '.'
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
    USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
    
    success "Obtained token: ${TOKEN:0:15}..."
    success "User ID: $USER_ID"
    
    # Get profile
    subsection "Getting profile"
    curl -s -X GET "${API_URL}/auth/profile" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update profile
    subsection "Updating profile"
    curl -s -X PUT "${API_URL}/auth/profile" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"full_name":"Updated Test User","bio":"This is a test bio"}' | jq '.'
    
    # Update settings
    subsection "Updating settings"
    curl -s -X PUT "${API_URL}/auth/settings" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"theme":"dark","language":"en","notification_preferences":{"email":true,"push":false}}' | jq '.'
}

# House endpoints
test_houses() {
    section "Testing House Endpoints"
    
    # Create house
    subsection "Creating house"
    CREATE_HOUSE_RESPONSE=$(curl -s -X POST "${API_URL}/houses" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"house_name":"Test House","description":"A house for testing","address":"123 Test St"}')
    
    echo $CREATE_HOUSE_RESPONSE | jq '.'
    HOUSE_ID=$(echo $CREATE_HOUSE_RESPONSE | jq -r '.house.id')
    
    success "Created house with ID: $HOUSE_ID"
    
    # Get houses
    subsection "Getting user houses"
    curl -s -X GET "${API_URL}/houses" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get house by ID
    subsection "Getting house by ID"
    curl -s -X GET "${API_URL}/houses/${HOUSE_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update house
    subsection "Updating house"
    curl -s -X PUT "${API_URL}/houses/${HOUSE_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"house_name":"Updated Test House","description":"Updated description"}' | jq '.'
    
    # Get house members
    subsection "Getting house members"
    curl -s -X GET "${API_URL}/houses/${HOUSE_ID}/members" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Invite user to house
    subsection "Inviting user to house"
    curl -s -X POST "${API_URL}/houses/${HOUSE_ID}/invite" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"email":"invited@example.com","role":"member"}' | jq '.'
}

# Dashboard endpoints
test_dashboard() {
    section "Testing Dashboard Endpoints"
    
    # Get dashboard data
    subsection "Getting dashboard data"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/dashboard" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
}

# Cost centers endpoints
test_cost_centers() {
    section "Testing Cost Centers Endpoints"
    
    # Create cost center
    subsection "Creating cost center"
    CREATE_CC_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/cost-centers" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Home","description":"Home expenses"}')
    
    echo $CREATE_CC_RESPONSE | jq '.'
    CC_ID=$(echo $CREATE_CC_RESPONSE | jq -r '.id')
    
    success "Created cost center with ID: $CC_ID"
    
    # Create second cost center for testing
    subsection "Creating second cost center"
    CREATE_CC2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/cost-centers" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Work","description":"Work expenses"}')
    
    echo $CREATE_CC2_RESPONSE | jq '.'
    CC2_ID=$(echo $CREATE_CC2_RESPONSE | jq -r '.id')
    
    # Get cost centers
    subsection "Getting cost centers"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/cost-centers" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get cost center by ID
    subsection "Getting cost center by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/cost-centers/${CC_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update cost center
    subsection "Updating cost center"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/cost-centers/${CC_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Updated Home","description":"Updated home expenses"}' | jq '.'
}

# Categories endpoints
test_categories() {
    section "Testing Categories Endpoints"
    
    # Create category in first cost center
    subsection "Creating category"
    CREATE_CATEGORY_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/categories" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"cost_center_id\":${CC_ID},\"name\":\"Utilities\",\"description\":\"Utility bills\"}")
    
    echo $CREATE_CATEGORY_RESPONSE | jq '.'
    CATEGORY_ID=$(echo $CREATE_CATEGORY_RESPONSE | jq -r '.id')
    
    success "Created category with ID: $CATEGORY_ID"
    
    # Create second category
    subsection "Creating second category"
    CREATE_CATEGORY2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/categories" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"cost_center_id\":${CC_ID},\"name\":\"Groceries\",\"description\":\"Food and groceries\"}")
    
    echo $CREATE_CATEGORY2_RESPONSE | jq '.'
    CATEGORY2_ID=$(echo $CREATE_CATEGORY2_RESPONSE | jq -r '.id')
    
    # Create category in second cost center
    subsection "Creating category in second cost center"
    CREATE_CATEGORY3_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/categories" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"cost_center_id\":${CC2_ID},\"name\":\"Salary\",\"description\":\"Income from salary\"}")
    
    echo $CREATE_CATEGORY3_RESPONSE | jq '.'
    CATEGORY3_ID=$(echo $CREATE_CATEGORY3_RESPONSE | jq -r '.id')
    
    # Get categories
    subsection "Getting categories"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/categories" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get categories filtered by cost center
    subsection "Getting categories filtered by cost center"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/categories?cost_center_id=${CC_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get category by ID
    subsection "Getting category by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/categories/${CATEGORY_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update category
    subsection "Updating category"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/categories/${CATEGORY_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Updated Utilities","description":"Updated utility bills"}' | jq '.'
}

# Currency endpoints
test_currencies() {
    section "Testing Currency Endpoints"
    
    # Create currency
    subsection "Creating currency"
    CREATE_CURRENCY_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/currencies" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"code":"USD","symbol":"$","exchange_rate":1.0}')
    
    echo $CREATE_CURRENCY_RESPONSE | jq '.'
    CURRENCY_ID=$(echo $CREATE_CURRENCY_RESPONSE | jq -r '.id')
    
    success "Created currency with ID: $CURRENCY_ID"
    
    # Create second currency
    subsection "Creating second currency"
    CREATE_CURRENCY2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/currencies" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"code":"EUR","symbol":"€","exchange_rate":1.2}')
    
    echo $CREATE_CURRENCY2_RESPONSE | jq '.'
    CURRENCY2_ID=$(echo $CREATE_CURRENCY2_RESPONSE | jq -r '.id')
    
    # Get currencies
    subsection "Getting currencies"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/currencies" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get currency by ID
    subsection "Getting currency by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/currencies/${CURRENCY_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update currency
    subsection "Updating currency"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/currencies/${CURRENCY_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"symbol":"USD $","exchange_rate":1.05}' | jq '.'
}

# Frequency endpoints
test_frequencies() {
    section "Testing Frequency Endpoints"
    
    # Create frequency
    subsection "Creating frequency"
    CREATE_FREQ_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/frequencies" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Monthly","description":"Once per month","scheduler_cron":"0 0 1 * *"}')
    
    echo $CREATE_FREQ_RESPONSE | jq '.'
    FREQ_ID=$(echo $CREATE_FREQ_RESPONSE | jq -r '.id')
    
    success "Created frequency with ID: $FREQ_ID"
    
    # Create second frequency
    subsection "Creating second frequency"
    CREATE_FREQ2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/frequencies" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Weekly","description":"Once per week","scheduler_cron":"0 0 * * 1"}')
    
    echo $CREATE_FREQ2_RESPONSE | jq '.'
    FREQ2_ID=$(echo $CREATE_FREQ2_RESPONSE | jq -r '.id')
    
    # Get frequencies
    subsection "Getting frequencies"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/frequencies" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get frequency by ID
    subsection "Getting frequency by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/frequencies/${FREQ_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update frequency
    subsection "Updating frequency"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/frequencies/${FREQ_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"description":"Updated monthly frequency","scheduler_cron":"0 0 1 * *"}' | jq '.'
}

# Payers endpoints
test_payers() {
    section "Testing Payers Endpoints"
    
    # Create payer
    subsection "Creating payer"
    CREATE_PAYER_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/payers" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"John","description":"John Smith"}')
    
    echo $CREATE_PAYER_RESPONSE | jq '.'
    PAYER_ID=$(echo $CREATE_PAYER_RESPONSE | jq -r '.id')
    
    success "Created payer with ID: $PAYER_ID"
    
    # Create second payer
    subsection "Creating second payer"
    CREATE_PAYER2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/payers" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"Mary","description":"Mary Johnson"}')
    
    echo $CREATE_PAYER2_RESPONSE | jq '.'
    PAYER2_ID=$(echo $CREATE_PAYER2_RESPONSE | jq -r '.id')
    
    # Get payers
    subsection "Getting payers"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/payers" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get payer by ID
    subsection "Getting payer by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/payers/${PAYER_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update payer
    subsection "Updating payer"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/payers/${PAYER_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"John Smith","description":"Updated description"}' | jq '.'
}

# Payments endpoints
test_payments() {
    section "Testing Payment Endpoints"
    
    # Create payment for single payer (John)
    subsection "Creating payment for single payer"
    CREATE_PAYMENT_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/payments" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"payer_id\":${PAYER_ID},\"percentage\":100}")
    
    echo $CREATE_PAYMENT_RESPONSE | jq '.'
    PAYMENT_ID=$(echo $CREATE_PAYMENT_RESPONSE | jq -r '.id')
    
    success "Created payment with ID: $PAYMENT_ID"
    
    # Create payment with multiple payers (shared payment)
    subsection "Creating payment with multiple payers"
    CREATE_PAYMENT2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/payments" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"payer_id\":${PAYER_ID},\"percentage\":50,\"details\":[{\"payer_id\":${PAYER_ID},\"percentage\":50},{\"payer_id\":${PAYER2_ID},\"percentage\":50}]}")
    
    echo $CREATE_PAYMENT2_RESPONSE | jq '.'
    PAYMENT2_ID=$(echo $CREATE_PAYMENT2_RESPONSE | jq -r '.id')
    
    # Get payments
    subsection "Getting payments"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/payments" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get payment by ID
    subsection "Getting payment by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/payments/${PAYMENT_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update payment
    subsection "Updating payment"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/payments/${PAYMENT_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"percentage\":90}" | jq '.'
}

# Documents endpoints
test_documents() {
    section "Testing Documents Endpoints"
    
    # Create a test file to upload
    echo "Creating test document file..."
    echo "This is a test document" > test-document.txt
    
    # Upload document
    subsection "Uploading document"
    CREATE_DOC_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/documents" \
        -H "Authorization: Bearer $TOKEN" \
        -F "document=@test-document.txt")
    
    echo $CREATE_DOC_RESPONSE | jq '.'
    DOC_ID=$(echo $CREATE_DOC_RESPONSE | jq -r '.document.id')
    
    success "Uploaded document with ID: $DOC_ID"
    
    # Get documents
    subsection "Getting documents"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/documents" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get document by ID
    subsection "Getting document by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/documents/${DOC_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Clean up test file
    rm test-document.txt
}

# Finance entries endpoints
test_finance_entries() {
    section "Testing Finance Entries Endpoints"
    
    # Today's date in YYYY-MM-DD format
    TODAY=$(date +%Y-%m-%d)
    NEXT_MONTH=$(date -d "+1 month" +%Y-%m-%d)
    
    # Create finance entry (expense)
    subsection "Creating finance entry (expense)"
    CREATE_FE_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/finance-entries" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\":\"${USER_ID}\",\"category_id\":${CATEGORY_ID},\"currency_id\":${CURRENCY_ID},\"amount\":100.00,\"frequency_id\":${FREQ_ID},\"start_date\":\"${TODAY}\",\"end_date\":\"${NEXT_MONTH}\",\"description\":\"Monthly utility bill\",\"type\":true,\"payment_id\":${PAYMENT_ID}}")
    
    echo $CREATE_FE_RESPONSE | jq '.'
    FE_ID=$(echo $CREATE_FE_RESPONSE | jq -r '.id')
    
    success "Created finance entry with ID: $FE_ID"
    
    # Create finance entry (income)
    subsection "Creating finance entry (income)"
    CREATE_FE2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/finance-entries" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\":\"${USER_ID}\",\"category_id\":${CATEGORY3_ID},\"currency_id\":${CURRENCY_ID},\"amount\":2000.00,\"frequency_id\":${FREQ_ID},\"start_date\":\"${TODAY}\",\"end_date\":\"${NEXT_MONTH}\",\"description\":\"Monthly salary\",\"type\":false,\"payment_id\":${PAYMENT_ID}}")
    
    echo $CREATE_FE2_RESPONSE | jq '.'
    FE2_ID=$(echo $CREATE_FE2_RESPONSE | jq -r '.id')
    
    # Get finance entries
    subsection "Getting finance entries"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/finance-entries" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get finance entries with filters
    subsection "Getting finance entries with filters"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/finance-entries?type=true&category_id=${CATEGORY_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get finance entry by ID
    subsection "Getting finance entry by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/finance-entries/${FE_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update finance entry
    subsection "Updating finance entry"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/finance-entries/${FE_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"amount":120.00,"description":"Updated utility bill"}' | jq '.'
}

# Task entries endpoints
test_task_entries() {
    section "Testing Task Entries Endpoints"
    
    # Today's date in YYYY-MM-DD format
    TODAY=$(date +%Y-%m-%d)
    NEXT_MONTH=$(date -d "+1 month" +%Y-%m-%d)
    
    # Create task entry
    subsection "Creating task entry"
    CREATE_TE_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/task-entries" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\":\"${USER_ID}\",\"category_id\":${CATEGORY_ID},\"currency_id\":${CURRENCY_ID},\"amount\":0,\"frequency_id\":${FREQ2_ID},\"start_date\":\"${TODAY}\",\"end_date\":\"${NEXT_MONTH}\",\"description\":\"Weekly cleaning\"}")
    
    echo $CREATE_TE_RESPONSE | jq '.'
    TE_ID=$(echo $CREATE_TE_RESPONSE | jq -r '.id')
    
    success "Created task entry with ID: $TE_ID"
    
    # Create another task entry
    subsection "Creating second task entry"
    CREATE_TE2_RESPONSE=$(curl -s -X POST "${API_URL}/house/${HOUSE_ID}/task-entries" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\":\"${USER_ID}\",\"category_id\":${CATEGORY2_ID},\"currency_id\":${CURRENCY_ID},\"amount\":0,\"frequency_id\":${FREQ2_ID},\"start_date\":\"${TODAY}\",\"end_date\":\"${NEXT_MONTH}\",\"description\":\"Weekly grocery shopping\"}")
    
    echo $CREATE_TE2_RESPONSE | jq '.'
    TE2_ID=$(echo $CREATE_TE2_RESPONSE | jq -r '.id')
    
    # Get task entries
    subsection "Getting task entries"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/task-entries" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get task entries with filters
    subsection "Getting task entries with filters"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/task-entries?category_id=${CATEGORY_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Get task entry by ID
    subsection "Getting task entry by ID"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/task-entries/${TE_ID}" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    # Update task entry
    subsection "Updating task entry"
    curl -s -X PUT "${API_URL}/house/${HOUSE_ID}/task-entries/${TE_ID}" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"description":"Updated weekly cleaning"}' | jq '.'
}

# Tasks endpoints
test_tasks() {
    section "Testing Tasks Endpoints"
    
    # Get tasks
    subsection "Getting tasks"
    TASKS_RESPONSE=$(curl -s -X GET "${API_URL}/house/${HOUSE_ID}/tasks" \
        -H "Authorization: Bearer $TOKEN")
    
    echo $TASKS_RESPONSE | jq '.'
    
    # Extract a task ID if available
    TASK_ID=$(echo $TASKS_RESPONSE | jq -r '.tasks[0].id')
    
    # If we have a task ID, get it specifically
    if [ "$TASK_ID" != "null" ] && [ -n "$TASK_ID" ]; then
        subsection "Getting task by ID"
        curl -s -X GET "${API_URL}/house/${HOUSE_ID}/tasks/${TASK_ID}" \
            -H "Authorization: Bearer $TOKEN" | jq '.'
        
        success "Retrieved task with ID: $TASK_ID"
    else
        echo "No tasks found to retrieve individually"
    fi
    
    # Get tasks with filters
    subsection "Getting tasks with filters"
    curl -s -X GET "${API_URL}/house/${HOUSE_ID}/tasks?status=false&entry_type=Task_Entries" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
}

# Main function
main() {
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        echo "Error: jq is required but not installed. Please install jq."
        exit 1
    }
    
    # Run all tests in sequence
    test_auth
    test_houses
    test_dashboard
    test_cost_centers
    test_categories
    test_currencies
    test_frequencies
    test_payers
    test_payments
    test_documents
    test_finance_entries
    test_task_entries
    test_tasks
    
    section "Testing Complete"
    success "House ID: $HOUSE_ID"
    success "User ID: $USER_ID"
}

# Run the tests
main


# Manual testes

curl -s -X GET $BASE_URL/house/$HOUSE_ID/payment-details -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/transactions -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/wallet -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/users -H "Authorization: Bearer $TOKEN" | json_pp


curl -s -X GET $BASE_URL/house/$HOUSE_ID/cost-centers -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/payments -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/frequencies -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/payers -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/task-entries -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/finance-entries -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/currencies -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/tasks -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/categories -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/house/$HOUSE_ID/documents -H "Authorization: Bearer $TOKEN" | json_pp

curl -s -X GET $BASE_URL/house/$HOUSE_ID/dashboard -H "Authorization: Bearer $TOKEN" | json_pp
curl -s -X GET $BASE_URL/houses/$HOUSE_ID -H "Authorization: Bearer $TOKEN" | json_pp



