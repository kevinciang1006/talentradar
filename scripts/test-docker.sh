#!/bin/bash
# Test Docker builds locally before pushing to CI

set -e

echo "🐳 Testing Turborepo Docker Builds..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test Backend
echo -e "${BLUE}📦 Building Backend...${NC}"
docker build \
  -f apps/server/Dockerfile \
  -t talentradar-backend-test \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backend build successful!${NC}"
  echo ""

  # Test running
  echo -e "${BLUE}🚀 Testing backend container...${NC}"
  docker run -d \
    --name talentradar-backend-test \
    -p 5000:5000 \
    -e MONGODB_URI="mongodb://localhost:27017/test" \
    -e JWT_SECRET="test-secret-key-for-docker-testing-only" \
    -e JWT_EXPIRES_IN="7d" \
    -e NODE_ENV="development" \
    -e CORS_ORIGIN="http://localhost:8080" \
    -e PORT="5000" \
    talentradar-backend-test

  # Wait for startup
  sleep 5

  # Check health
  if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend health check passed!${NC}"
  else
    echo -e "${RED}❌ Backend health check failed${NC}"
    docker logs talentradar-backend-test
  fi

  # Cleanup
  docker stop talentradar-backend-test > /dev/null 2>&1
  docker rm talentradar-backend-test > /dev/null 2>&1
else
  echo -e "${RED}❌ Backend build failed${NC}"
  exit 1
fi

echo ""
echo ""

# Test Frontend
echo -e "${BLUE}📦 Building Frontend...${NC}"
docker build \
  -f apps/client/Dockerfile \
  --build-arg VITE_API_URL="http://localhost:5000/api/v1" \
  -t talentradar-frontend-test \
  .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend build successful!${NC}"
  echo ""

  # Test running
  echo -e "${BLUE}🚀 Testing frontend container...${NC}"
  docker run -d \
    --name talentradar-frontend-test \
    -p 8080:8080 \
    talentradar-frontend-test

  # Wait for startup
  sleep 3

  # Check health
  if curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend health check passed!${NC}"
  else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    docker logs talentradar-frontend-test
  fi

  # Cleanup
  docker stop talentradar-frontend-test > /dev/null 2>&1
  docker rm talentradar-frontend-test > /dev/null 2>&1
else
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}🎉 All Docker builds passed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Commit changes: git add . && git commit -m 'feat: Add Turborepo Docker optimization'"
echo "  2. Push to GitHub: git push origin main"
echo "  3. Trigger deployment: GitHub Actions → Run workflow"
