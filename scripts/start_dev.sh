#!/bin/bash
# Start development environment
echo "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d

echo -e "\nAccess your application at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8081"
echo "- Backend Docs: http://localhost:8081/docs"
