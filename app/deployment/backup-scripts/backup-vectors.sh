#!/bin/bash

# Vector Database Backup Script for Learning Research Platform
# This script creates backups of the Qdrant vector database

set -e  # Exit on any error

# Configuration
BACKUP_DIR="/backups/vectors"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_NAME="vectors_${DATE}"

# Load environment variables
if [ -f .env.server ]; then
    export $(cat .env.server | grep -v '^#' | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting vector database backup at $(date)"

# Check if Qdrant is configured
if [ -z "$QDRANT_URL" ]; then
    echo "ERROR: QDRANT_URL not configured"
    exit 1
fi

# Set up API key header if configured
if [ ! -z "$QDRANT_API_KEY" ]; then
    AUTH_HEADER="api-key: $QDRANT_API_KEY"
else
    AUTH_HEADER=""
fi

# Get collection name (default to learning_platform_vectors)
COLLECTION_NAME=${QDRANT_COLLECTION_NAME:-"learning_platform_vectors"}

echo "Creating snapshot for collection: $COLLECTION_NAME"

# Create snapshot
SNAPSHOT_RESPONSE=$(curl -s -X POST "$QDRANT_URL/collections/$COLLECTION_NAME/snapshots" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{}')

# Extract snapshot name from response
SNAPSHOT_ID=$(echo $SNAPSHOT_RESPONSE | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SNAPSHOT_ID" ]; then
    echo "ERROR: Failed to create snapshot"
    echo "Response: $SNAPSHOT_RESPONSE"
    exit 1
fi

echo "Snapshot created with ID: $SNAPSHOT_ID"

# Wait a moment for snapshot to be ready
sleep 5

# Download snapshot
echo "Downloading snapshot..."
curl -X GET "$QDRANT_URL/collections/$COLLECTION_NAME/snapshots/$SNAPSHOT_ID" \
    -H "$AUTH_HEADER" \
    -o "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot"

# Verify download
if [ -f "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot" | cut -f1)
    echo "Snapshot downloaded successfully: ${SNAPSHOT_NAME}.snapshot ($BACKUP_SIZE)"
else
    echo "ERROR: Snapshot file was not downloaded!"
    exit 1
fi

# Upload to cloud storage (AWS S3)
if [ ! -z "$AWS_S3_FILES_BUCKET" ]; then
    echo "Uploading snapshot to S3..."
    aws s3 cp "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot" "s3://$AWS_S3_FILES_BUCKET/backups/vectors/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    
    if [ $? -eq 0 ]; then
        echo "Snapshot uploaded to S3 successfully"
    else
        echo "WARNING: Failed to upload snapshot to S3"
    fi
fi

# Create backup metadata
cat > "$BACKUP_DIR/${SNAPSHOT_NAME}.meta" << EOF
{
    "filename": "${SNAPSHOT_NAME}.snapshot",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "collection": "$COLLECTION_NAME",
    "qdrant_url": "$QDRANT_URL",
    "snapshot_id": "$SNAPSHOT_ID",
    "size": "$(stat -f%z "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot" 2>/dev/null || stat -c%s "$BACKUP_DIR/${SNAPSHOT_NAME}.snapshot")",
    "backup_type": "snapshot"
}
EOF

# Get collection info for metadata
COLLECTION_INFO=$(curl -s -X GET "$QDRANT_URL/collections/$COLLECTION_NAME" \
    -H "$AUTH_HEADER")

echo "Collection info: $COLLECTION_INFO" >> "$BACKUP_DIR/${SNAPSHOT_NAME}.meta"

# Clean up old snapshots locally
echo "Cleaning up old local snapshots (keeping last $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "vectors_*.snapshot" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "vectors_*.meta" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old S3 snapshots if configured
if [ ! -z "$AWS_S3_FILES_BUCKET" ]; then
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
    aws s3 ls "s3://$AWS_S3_FILES_BUCKET/backups/vectors/" | \
        awk '$1 < "'$CUTOFF_DATE'" {print $4}' | \
        xargs -I {} aws s3 rm "s3://$AWS_S3_FILES_BUCKET/backups/vectors/{}"
fi

# Clean up remote snapshot (optional, to save space on Qdrant)
if [ "$CLEANUP_REMOTE_SNAPSHOTS" = "true" ]; then
    echo "Cleaning up remote snapshot: $SNAPSHOT_ID"
    curl -X DELETE "$QDRANT_URL/collections/$COLLECTION_NAME/snapshots/$SNAPSHOT_ID" \
        -H "$AUTH_HEADER"
fi

# Log backup completion
echo "Vector database backup completed successfully at $(date)"
echo "Snapshot file: ${SNAPSHOT_NAME}.snapshot"
echo "Snapshot size: $BACKUP_SIZE"

# Send notification (optional)
if [ ! -z "$BACKUP_NOTIFICATION_WEBHOOK" ]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Vector database backup completed: ${SNAPSHOT_NAME}.snapshot ($BACKUP_SIZE)\"}"
fi

echo "Vector backup script completed successfully"