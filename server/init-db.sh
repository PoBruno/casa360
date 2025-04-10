#!/bin/sh
set -e

echo "Starting initialization script..."

# Wait for both databases to be ready
echo "Waiting for data-user database..."
until pg_isready -h data-user -U user -d data-user; do
  echo "Data-user database is not ready - waiting..."
  sleep 2
done

echo "Waiting for data-casa database..."
until pg_isready -h data-casa -U user -d data-casa; do
  echo "Data-casa database is not ready - waiting..."
  sleep 2
done

echo "Both databases are ready!"

# Check if house_template exists in data-casa
TEMPLATE_EXISTS=$(PGPASSWORD=password psql -h data-casa -U user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'house_template'")

if [ -z "$TEMPLATE_EXISTS" ]; then
  echo "Creating house_template database..."
  PGPASSWORD=password psql -h data-casa -U user -d postgres -c "CREATE DATABASE house_template;"
  
  # Execute the template SQL file
  PGPASSWORD=password psql -h data-casa -U user -d house_template -f /usr/src/app/db/data-casa/00-casa-template.sql
  
  echo "house_template database initialized successfully"
else
  echo "house_template database already exists"
fi

# Add health endpoint to express app
if [ -f /usr/src/app/dist/app.js ]; then
  if ! grep -q "/health" /usr/src/app/dist/app.js; then
    sed -i '/app.use(error_1.default);/i app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));' /usr/src/app/dist/app.js
  fi
fi

# Start the application
echo "Starting Node.js application..."
if [ -f /usr/src/app/dist/app.js ]; then
  exec node /usr/src/app/dist/app.js
else
  exec node /usr/src/app/dist/index.js
fi