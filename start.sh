#!/bin/bash

# AI Patent Research & Filing - Start Script
# This script sets up and starts the full application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║     AI Patent Research & Filing Platform         ║"
echo "║     Intelligent IP Management System             ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Creating default...${NC}"
  cat > .env << 'ENVEOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patent_research
DB_USER=postgres
DB_PASSWORD=postgres
BACKEND_PORT=3001
FRONTEND_PORT=3000
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
JWT_SECRET=patent-research-jwt-secret-2024
ENVEOF
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Default .env created${NC}"
fi

# Function to clean up ports
cleanup_ports() {
  echo -e "\n${YELLOW}🔧 Cleaning up used ports...${NC}"

  BACKEND_PORT=${BACKEND_PORT:-3001}
  FRONTEND_PORT=${FRONTEND_PORT:-3000}

  for PORT in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
      echo -e "${YELLOW}  Killing process on port $PORT (PID: $PID)${NC}"
      kill -9 $PID 2>/dev/null || true
      sleep 1
    fi
  done

  echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Function to check PostgreSQL
check_postgres() {
  echo -e "\n${YELLOW}🔍 Checking PostgreSQL...${NC}"

  if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL not found! Please install it.${NC}"
    exit 1
  fi

  # Check if PostgreSQL is running
  if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &> /dev/null; then
    echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || {
      echo -e "${RED}✗ Could not start PostgreSQL. Please start it manually.${NC}"
      exit 1
    }
    sleep 2
  fi

  echo -e "${GREEN}✓ PostgreSQL is running${NC}"
}

# Function to setup database
setup_database() {
  echo -e "\n${YELLOW}🗄️  Setting up database...${NC}"

  DB_NAME=${DB_NAME:-patent_research}
  DB_USER=${DB_USER:-postgres}

  # Create database if it doesn't exist
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || {
    echo -e "${YELLOW}  Creating database '$DB_NAME'...${NC}"
    createdb -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER $DB_NAME 2>/dev/null || {
      psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
    }
  }

  echo -e "${GREEN}✓ Database ready${NC}"
}

# Function to install dependencies
install_deps() {
  echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"

  echo -e "${CYAN}  Installing server dependencies...${NC}"
  cd "$SCRIPT_DIR/server"
  npm install --silent 2>/dev/null
  echo -e "${GREEN}  ✓ Server dependencies installed${NC}"

  echo -e "${CYAN}  Installing client dependencies...${NC}"
  cd "$SCRIPT_DIR/client"
  npm install --silent 2>/dev/null
  echo -e "${GREEN}  ✓ Client dependencies installed${NC}"

  cd "$SCRIPT_DIR"
}

# Function to seed database
seed_database() {
  echo -e "\n${YELLOW}🌱 Seeding database with sample data...${NC}"
  cd "$SCRIPT_DIR/server"
  node src/seeds/seed.js
  cd "$SCRIPT_DIR"
}

# Function to start services
start_services() {
  echo -e "\n${YELLOW}🚀 Starting services with hot reload...${NC}"

  BACKEND_PORT=${BACKEND_PORT:-3001}
  FRONTEND_PORT=${FRONTEND_PORT:-3000}

  # Start backend with nodemon (hot reload)
  echo -e "${CYAN}  Starting backend on port $BACKEND_PORT (with hot reload)...${NC}"
  cd "$SCRIPT_DIR/server"
  npx nodemon --watch src src/index.js &
  BACKEND_PID=$!
  cd "$SCRIPT_DIR"

  # Start frontend with Vite (hot reload built-in)
  echo -e "${CYAN}  Starting frontend on port $FRONTEND_PORT (with HMR)...${NC}"
  cd "$SCRIPT_DIR/client"
  npx vite --port $FRONTEND_PORT --host &
  FRONTEND_PID=$!
  cd "$SCRIPT_DIR"

  sleep 3

  echo -e "\n${GREEN}════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  🎉 Application is running!${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  Frontend:  http://localhost:$FRONTEND_PORT${NC}"
  echo -e "${CYAN}  Backend:   http://localhost:$BACKEND_PORT${NC}"
  echo -e "${CYAN}  API Health: http://localhost:$BACKEND_PORT/api/health${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}  Login: admin@patentai.com / password123${NC}"
  echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
  echo -e "\n${YELLOW}  Press Ctrl+C to stop all services${NC}\n"

  # Trap SIGINT to clean up
  trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

  # Wait for background processes
  wait
}

# Main execution
cleanup_ports
check_postgres
setup_database
install_deps
seed_database
start_services
