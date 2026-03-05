#!/bin/bash
# Set Cloud Run environment variables for backend

set -e

echo "🔧 Setting Cloud Run environment variables..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if required tools are installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Prompt for values
echo -e "${BLUE}Enter your environment variables:${NC}"
echo ""

# MongoDB URI
echo -e "${YELLOW}MongoDB Atlas URI:${NC}"
echo "Example: mongodb+srv://user:password@cluster.mongodb.net/talentradar"
read -p "MONGODB_URI: " MONGODB_URI

# JWT Secret (generate if empty)
echo ""
echo -e "${YELLOW}JWT Secret (leave empty to generate):${NC}"
read -s -p "JWT_SECRET: " JWT_SECRET
echo ""

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    echo -e "${GREEN}✓ Generated JWT_SECRET${NC}"
fi

# CORS Origin (will be updated automatically by workflow, but need initial value)
echo ""
echo -e "${YELLOW}CORS Origin (or press Enter for placeholder):${NC}"
echo "This will be auto-updated by the workflow after frontend deploys"
read -p "CORS_ORIGIN [https://placeholder.com]: " CORS_ORIGIN
CORS_ORIGIN=${CORS_ORIGIN:-https://placeholder.com}

# Cloudinary (optional)
echo ""
echo -e "${YELLOW}Cloudinary (optional - press Enter to skip):${NC}"
read -p "CLOUDINARY_CLOUD_NAME: " CLOUDINARY_CLOUD_NAME
read -p "CLOUDINARY_API_KEY: " CLOUDINARY_API_KEY
read -s -p "CLOUDINARY_API_SECRET: " CLOUDINARY_API_SECRET
echo ""

# Build env vars string
ENV_VARS="NODE_ENV=production,MONGODB_URI=${MONGODB_URI},JWT_SECRET=${JWT_SECRET},JWT_EXPIRES_IN=7d,CORS_ORIGIN=${CORS_ORIGIN}"

# Add Cloudinary if provided
if [ ! -z "$CLOUDINARY_CLOUD_NAME" ]; then
    ENV_VARS="${ENV_VARS},CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}"
fi

if [ ! -z "$CLOUDINARY_API_KEY" ]; then
    ENV_VARS="${ENV_VARS},CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}"
fi

if [ ! -z "$CLOUDINARY_API_SECRET" ]; then
    ENV_VARS="${ENV_VARS},CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}"
fi

# Confirm before applying
echo ""
echo -e "${BLUE}About to set environment variables on:${NC}"
echo "  Service: talentradar-backend"
echo "  Region: us-central1"
echo ""
echo "Variables to set:"
echo "  - PORT=5000"
echo "  - NODE_ENV=production"
echo "  - MONGODB_URI=***"
echo "  - JWT_SECRET=***"
echo "  - JWT_EXPIRES_IN=7d"
echo "  - CORS_ORIGIN=${CORS_ORIGIN}"
if [ ! -z "$CLOUDINARY_CLOUD_NAME" ]; then
    echo "  - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}"
    echo "  - CLOUDINARY_API_KEY=***"
    echo "  - CLOUDINARY_API_SECRET=***"
fi
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Apply environment variables
echo ""
echo -e "${BLUE}🚀 Updating Cloud Run service...${NC}"

gcloud run services update talentradar-backend \
  --region us-central1 \
  --set-env-vars="${ENV_VARS}"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Environment variables set successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Wait ~30 seconds for service to restart"
    echo "  2. Check health: curl \$(gcloud run services describe talentradar-backend --region us-central1 --format='value(status.url)')/health"
    echo "  3. Deploy frontend: GitHub Actions → Run workflow"
    echo ""
    echo "Note: CORS_ORIGIN will be automatically updated when frontend deploys"
else
    echo -e "${RED}❌ Failed to set environment variables${NC}"
    exit 1
fi
