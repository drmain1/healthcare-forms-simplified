#!/bin/bash

# Master Deployment Script - Deploy Everything
# This orchestrates both backend and frontend deployments

set -e

# Color codes
BLUE='\033[0;34m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   FULL STACK DEPLOYMENT${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Deploy backend first
echo -e "${BLUE}[1/2] Deploying Backend...${NC}"
./deploy-backend.sh $1

echo ""
echo -e "${BLUE}[2/2] Deploying Frontend...${NC}"
./deploy-frontend.sh $2

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Your application is now live!"
echo "Frontend: https://healthcare-forms-v2.web.app"
echo "Backend: Check output above for Cloud Run URL"