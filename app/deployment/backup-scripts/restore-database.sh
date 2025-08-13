#!/bin/bash

# Database Restore Script for Learning Research Platform
# This script restores the PostgreSQL database from a backup file

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups/database"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.dump 2>/dev/null || echo "No backup files found in $BACKUP_DIR"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    # Try looking in backup directory
    if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
    else
        echo "ERROR: Backup file not found: $BACKUP_FILE"
        exit 1
    fi
fi

# Load environment variables
if [ -f .env.server ]; then
    export $(cat .env.server | grep -v '^#' | xargs)
fi

echo "Starting database restore at $(date)"
echo "Backup file: $BACKUP_FILE"

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Set password for pg_restore
export PGPASSWORD=$DB_PASS

# Confirm restore operation
echo "WARNING: This will replace all data in database '$DB_NAME' on host '$DB_HOST'"
echo "Are you sure you want to continue? (yes/no)"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Create a pre-restore backup (safety measure)
SAFETY_BACKUP="safety_backup_$(date +%Y%m%d_%H%M%S).dump"
echo "Creating safety backup: $SAFETY_BACKUP"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/$SAFETY_BACKUP"

# Stop application services (if using systemd)
if command -v systemctl &> /dev/null; then
    echo "Stopping application services..."
    systemctl stop learning-platform || true
fi

# Terminate existing connections to the database
echo "Terminating existing database connections..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database (clean restore)
echo "Dropping and recreating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore database from backup
echo "Restoring database from backup..."
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$BACKUP_FILE"

# Verify restore
echo "Verifying restore..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT COUNT(*) FROM information_schema.tables 
    WHERE table_schema = 'public';" | xargs)

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "Restore successful: $TABLE_COUNT tables restored"
else
    echo "ERROR: Restore may have failed - no tables found"
    exit 1
fi

# Run database migrations to ensure schema is up to date
echo "Running database migrations..."
if [ -f "package.json" ]; then
    npm run db:migrate || echo "WARNING: Migration failed or not configured"
fi

# Update database statistics
echo "Updating database statistics..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "ANALYZE;"

# Restart application services
if command -v systemctl &> /dev/null; then
    echo "Starting application services..."
    systemctl start learning-platform || true
fi

# Log restore completion
echo "Database restore completed successfully at $(date)"
echo "Restored from: $BACKUP_FILE"
echo "Tables restored: $TABLE_COUNT"
echo "Safety backup created: $SAFETY_BACKUP"

# Send notification (optional)
if [ ! -z "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Database restore completed from: $(basename $BACKUP_FILE)\"}"
fi

# Unset password
unset PGPASSWORD

echo "Restore script completed successfully"
echo "Please verify application functionality before removing safety backup"