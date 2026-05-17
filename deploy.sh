#!/bin/bash
# ============================================
# KelasAI Deployment Script
# Untuk deploy ke VPS (Ubuntu/Debian)
# ============================================

set -e

echo "🚀 KelasAI Deployment Script"
echo "=============================="

# Check if running on the server
if [ ! -f "package.json" ]; then
    echo "❌ Run this script from the project root directory"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Install dependencies if needed
echo ""
echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

bun install

# Step 2: Generate Prisma client
echo ""
echo -e "${YELLOW}🗄️ Step 2: Generating Prisma client...${NC}"
npx prisma generate

# Step 3: Push database schema (safe, won't delete data)
echo ""
echo -e "${YELLOW}📊 Step 3: Setting up database...${NC}"
npx prisma db push

# Step 4: Build the application
echo ""
echo -e "${YELLOW}🔨 Step 4: Building application...${NC}"
bun run build

# Step 5: Create upload directory
echo ""
echo -e "${YELLOW}📁 Step 5: Creating upload directory...${NC}"
mkdir -p upload

# Step 6: Setup environment
echo ""
echo -e "${YELLOW}⚙️ Step 6: Checking environment...${NC}"
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXTAUTH_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✅ .env file created with random secret${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 7: Create systemd service
echo ""
echo -e "${YELLOW}🔄 Step 7: Setting up systemd service...${NC}"
PROJECT_DIR=$(pwd)
SERVICE_FILE="/etc/systemd/system/kelasai.service"

if [ ! -f "$SERVICE_FILE" ] || [ "$1" == "--install-service" ]; then
    sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=KelasAI - AI Tutor Platform
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=DATABASE_URL=file:$PROJECT_DIR/db/custom.db
EnvironmentFile=$PROJECT_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable kelasai
    echo -e "${GREEN}✅ Systemd service created and enabled${NC}"
else
    echo -e "${GREEN}✅ Systemd service already exists${NC}"
fi

# Step 8: Start or restart the service
echo ""
echo -e "${YELLOW}🚀 Step 8: Starting application...${NC}"
if [ -f "$SERVICE_FILE" ]; then
    sudo systemctl restart kelasai
    echo -e "${GREEN}✅ Service restarted${NC}"
    echo ""
    echo "Useful commands:"
    echo "  sudo systemctl status kelasai   - Check status"
    echo "  sudo systemctl restart kelasai  - Restart"
    echo "  sudo journalctl -u kelasai -f   - View logs"
else
    echo "Starting in background..."
    nohup node .next/standalone/server.js > server.log 2>&1 &
    echo $! > .pid
    echo -e "${GREEN}✅ Application started (PID: $(cat .pid))${NC}"
    echo "To stop: kill \$(cat .pid)"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "🌐 Your KelasAI platform is running at: http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Setup a reverse proxy (Caddy/Nginx) for domain access"
echo "  2. Update NEXTAUTH_URL in .env to your domain"
echo "  3. Open firewall port 80/443"
echo ""
