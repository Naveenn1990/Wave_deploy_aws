#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Base URL
BASE_URL="http://localhost:3000/api"

echo -e "${GREEN}Testing Admin Service APIs${NC}\n"

# 1. Create Category
echo -e "${GREEN}1. Creating Service Category...${NC}"
CATEGORY_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/service-category" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Home Services" \
  -F "description=All home related services" \
  -F "image=@test/images/category.jpg")

echo $CATEGORY_RESPONSE
CATEGORY_ID=$(echo $CATEGORY_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$CATEGORY_ID" ]; then
  echo -e "${RED}Failed to create category${NC}"
  exit 1
fi

echo -e "\nCategory ID: $CATEGORY_ID\n"

# 2. Create Service
echo -e "${GREEN}2. Creating Service...${NC}"
SERVICE_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/service" \
  -H "Content-Type: multipart/form-data" \
  -F "name=House Cleaning" \
  -F "description=Professional house cleaning service" \
  -F "category=$CATEGORY_ID" \
  -F "basePrice=1500" \
  -F "duration=120" \
  -F "image=@test/images/service.jpg")

echo $SERVICE_RESPONSE
SERVICE_ID=$(echo $SERVICE_RESPONSE | grep -o '"_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
  echo -e "${RED}Failed to create service${NC}"
  exit 1
fi

echo -e "\nService ID: $SERVICE_ID\n"

# 3. Create Sub-Service
echo -e "${GREEN}3. Creating Sub-Service...${NC}"
SUB_SERVICE_RESPONSE=$(curl -s -X POST "${BASE_URL}/admin/service/$SERVICE_ID/sub-service" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Deep Cleaning" \
  -F "description=Thorough deep cleaning service" \
  -F "basePrice=2500" \
  -F "duration=240" \
  -F "image=@test/images/subservice.jpg")

echo $SUB_SERVICE_RESPONSE

# 4. Get All Categories
echo -e "\n${GREEN}4. Getting All Categories...${NC}"
curl -s -X GET "${BASE_URL}/admin/service-categories" | json_pp

# 5. Get All Services
echo -e "\n${GREEN}5. Getting All Services...${NC}"
curl -s -X GET "${BASE_URL}/admin/services" | json_pp

# 6. Get Services by Category
echo -e "\n${GREEN}6. Getting Services by Category...${NC}"
curl -s -X GET "${BASE_URL}/admin/category/$CATEGORY_ID/services" | json_pp
