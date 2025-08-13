#!/bin/bash

# Database Backup Script for Learning Research Platform
# This script creates backups of the PostgreSQL database and uploads them to cloud storage

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups/database"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="learning_platform_${DATE}.dump"

# Load environment variables
if [ -f .env.server ]; then
    export $(cat .env.server | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup at $(date)"

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Set password for pg_dump
export PGPASSWORD=$DB_PASS

# Create database backup
echo "Creating database backup: $BACKUP_FILE"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created successfully
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "ERROR: Backup file was not created!"
    exit 1
fi

# Upload to cloud storage (AWS S3)
if [ ! -z "$AWS_S3_FILES_BUCKET" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$AWS_S3_FILES_BUCKET/backups/database/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    if [ $? -eq 0 ]; then
        echo "Backup uploaded to S3 successfully"
    else
        echo "WARNING: Failed to upload backup to S3"
    fi
fi

# Create backup metadata
cat > "$BACKUP_DIR/${BACKUP_FILE}.meta" << EOF
{
    "filename": "$BACKUP_FILE",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "size": "$(stat -f%z "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_DIR/$BACKUP_FILE")",
    "format": "custom",
    "compression": "9",
    "backup_type": "full"
}
EOF

# Clean up old backups (keep only last N days)
echo "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "learning_platform_*.dump" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "learning_platform_*.meta" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups if configured
if [ ! -z "$AWS_S3_FILES_BUCKET" ]; then
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    aws s3 ls "s3://$AWS_S3_FILES_BUCKET/backups/database/" | \
        awk '$1 < "'$CUTOFF_DATE'" {print $4}' | \
        xargs -I {} aws s3 rm "s3://$AWS_S3_FILES_BUCKET/backups/database/{}"
fi

# Log backup completion
echo "Database backup completed successfully at $(date)"
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $BACKUP_SIZE"

# Send notification (optional)
if [ ! -z "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Database backup completed: $BACKUP_FILE ($BACKUP_SIZE)\"}"
fi

# Unset password
unset PGPASSWORD

echo "Backup script completed successfully"