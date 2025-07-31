#!/bin/bash

# Database setup script for Render PostgreSQL
# This script will create all necessary tables for the Verified Inference system

echo "Setting up Verified Inference database..."
echo "Please enter your Render PostgreSQL connection details:"
echo ""
echo "You can find these in your Render dashboard under your database service"
echo ""

read -p "Database Host (e.g., dpg-xxx.virginia-postgres.render.com): " DB_HOST
read -p "Database Name: " DB_NAME
read -p "Database User: " DB_USER
read -s -p "Database Password: " DB_PASSWORD
echo ""

# Export password for psql
export PGPASSWORD=$DB_PASSWORD

echo ""
echo "Running database setup..."

# Run the complete setup
echo "Creating tables..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f backend/database/complete_setup.sql

if [ $? -eq 0 ]; then
    echo "✓ Tables created successfully"
else
    echo "✗ Error creating tables"
    exit 1
fi

# Run the migration
echo "Adding coherence metrics..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f backend/database/migration_add_coherence_metrics.sql

if [ $? -eq 0 ]; then
    echo "✓ Migration completed successfully"
else
    echo "✗ Error running migration"
    exit 1
fi

echo ""
echo "Database setup complete!"
echo ""
echo "You can now use the Verified Inference system."

# Clear the password
unset PGPASSWORD