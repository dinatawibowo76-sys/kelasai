#!/bin/bash
# ============================================
# KelasAI Deployment Script
# Untuk deploy ke VPS (Ubuntu/Debian)
# ============================================
#
# Usage:
#   ./deploy.sh              # Auto-detect Docker, prefer Docker
#   ./deploy.sh --docker     # Force Docker deployment
#   ./deploy.sh --native     # Force native (systemd) deployment
#   ./deploy.sh --install-service  # Force reinstall systemd service
#
# ============================================

set -euo pipefail

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ---- Helpers ----
log_step()   { echo ""; echo -e "${YELLOW}$1${NC}"; }
log_ok()     { echo -e "${GREEN}✅ $1${NC}"; }
log_err()    { echo -e "${RED}❌ $1${NC}"; }
log_info()   { echo -e "${BLUE}ℹ️  $1${NC}"; }

die() {
    log_err "$1"
    exit 1
}

# ---- Pre-flight checks ----
[ -f "package.json" ] || die "Run this script from the project root directory"

# ---- Parse arguments ----
DEPLOY_MODE="auto"  # auto | docker | native
INSTALL_SERVICE=false

for arg in "$@"; do
    case "$arg" in
        --docker)  DEPLOY_MODE="docker" ;;
        --native)  DEPLOY_MODE="native" ;;
        --install-service) INSTALL_SERVICE=true ;;
        --help|-h)
            echo "Usage: $0 [--docker|--native] [--install-service]"
            echo ""
            echo "  --docker          Force Docker deployment"
            echo "  --native          Force native (systemd) deployment"
            echo "  --install-service Reinstall the systemd service"
            exit 0
            ;;
        *)
            die "Unknown argument: $arg (use --help for usage)"
            ;;
    esac
done

echo ""
echo "🚀 KelasAI Deployment Script"
echo "=============================="

# ---- Detect deployment method ----
HAS_DOCKER=false
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    HAS_DOCKER=true
fi

if [ "$DEPLOY_MODE" = "auto" ]; then
    if [ "$HAS_DOCKER" = true ]; then
        DEPLOY_MODE="docker"
        log_info "Docker detected — using Docker deployment"
    else
        DEPLOY_MODE="native"
        log_info "Docker not found — using native deployment"
    fi
fi

if [ "$DEPLOY_MODE" = "docker" ] && [ "$HAS_DOCKER" = false ]; then
    die "Docker deployment requested but Docker is not installed. Install it with: curl -fsSL https://get.docker.com | sh"
fi

# ==== Docker Deployment ====
if [ "$DEPLOY_MODE" = "docker" ]; then
    echo ""
    echo -e "${BLUE}🐳 Docker Deployment Mode${NC}"
    echo "----------------------------"

    # Step 1: Ensure .env file exists
    log_step "⚙️  Step 1: Checking environment..."
    if [ ! -f ".env" ]; then
        log_info "Creating .env from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            # Generate a proper secret
            SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-$(date +%s)")
            sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$SECRET/" .env
            log_ok ".env file created with random secret"
        else
            cat > .env << EOF
DATABASE_URL=file:/app/db/custom.db
NEXTAUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret")
NEXTAUTH_URL=http://localhost:3000
EOF
            log_ok ".env file created"
        fi
        echo ""
        log_info "⚠️  IMPORTANT: Review .env and update NEXTAUTH_URL to your domain!"
    else
        log_ok ".env file already exists"
    fi

    # Step 2: Pull latest code (if git repo)
    log_step "📦 Step 2: Checking for updates..."
    if git rev-parse --is-inside-work-tree &> /dev/null; then
        git pull --ff-only 2>/dev/null && log_ok "Git pull successful" || log_info "Could not pull — may be up to date or no remote"
    else
        log_info "Not a git repository, skipping pull"
    fi

    # Step 3: Build and start containers
    log_step "🔨 Step 3: Building & starting containers..."
    docker compose build --no-cache 2>&1 || die "Docker build failed"
    docker compose up -d 2>&1 || die "Docker compose up failed"
    log_ok "Containers are starting"

    # Step 4: Wait for health check
    log_step "🏥 Step 4: Waiting for health check..."
    RETRIES=0
    MAX_RETRIES=15
    while [ $RETRIES -lt $MAX_RETRIES ]; do
        STATUS=$(docker inspect --format='{{.State.Health.Status}}' kelasai-app 2>/dev/null || echo "unknown")
        if [ "$STATUS" = "healthy" ]; then
            log_ok "Application is healthy!"
            break
        fi
        RETRIES=$((RETRIES + 1))
        echo "  Waiting... ($RETRIES/$MAX_RETRIES) status: $STATUS"
        sleep 5
    done

    if [ $RETRIES -eq $MAX_RETRIES ]; then
        log_err "Application did not become healthy in time. Check logs:"
        echo "  docker compose logs app"
    fi

    # Done
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}✅ Docker deployment complete!${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo "🌐 Your KelasAI platform is running at: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  docker compose logs -f app    # Follow logs"
    echo "  docker compose restart app    # Restart app"
    echo "  docker compose down           # Stop all services"
    echo "  docker compose up -d --build  # Rebuild & restart"
    echo ""
    echo "Next steps:"
    echo "  1. Update NEXTAUTH_URL in .env to your domain"
    echo "  2. Edit Caddyfile.prod — replace YOUR_DOMAIN"
    echo "  3. Open firewall ports 80 & 443"
    echo ""

# ==== Native Deployment ====
else
    echo ""
    echo -e "${BLUE}🖥️  Native Deployment Mode${NC}"
    echo "----------------------------"

    # Step 1: Install dependencies if needed
    log_step "📦 Step 1: Installing dependencies..."
    if ! command -v bun &> /dev/null; then
        log_info "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash || die "Failed to install Bun"
        export PATH="$HOME/.bun/bin:$PATH"
    fi
    bun install || die "bun install failed"

    # Step 2: Generate Prisma client
    log_step "🗄️ Step 2: Generating Prisma client..."
    npx prisma generate || die "prisma generate failed"

    # Step 3: Push database schema (safe, won't delete data)
    log_step "📊 Step 3: Setting up database..."
    npx prisma db push || log_info "prisma db push had warnings — database may already be up to date"

    # Step 4: Build the application
    log_step "🔨 Step 4: Building application..."
    bun run build || die "Build failed"

    # Step 5: Create upload directory
    log_step "📁 Step 5: Creating upload directory..."
    mkdir -p upload

    # Step 6: Setup environment
    log_step "⚙️  Step 6: Checking environment..."
    if [ ! -f ".env" ]; then
        log_info "Creating .env file..."
        cat > .env << EOF
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret")
NEXTAUTH_URL=http://localhost:3000
EOF
        log_ok ".env file created with random secret"
    else
        log_ok ".env file already exists"
    fi

    # Step 7: Create systemd service
    log_step "🔄 Step 7: Setting up systemd service..."
    PROJECT_DIR=$(pwd)
    SERVICE_FILE="/etc/systemd/system/kelasai.service"

    if [ ! -f "$SERVICE_FILE" ] || [ "$INSTALL_SERVICE" = true ]; then
        sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=KelasAI - AI Tutor Platform
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$PROJECT_DIR
ExecStart=$(which node || echo /usr/bin/node) $PROJECT_DIR/.next/standalone/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
EnvironmentFile=-$PROJECT_DIR/.env

[Install]
WantedBy=multi-user.target
EOF

        sudo systemctl daemon-reload
        sudo systemctl enable kelasai
        log_ok "Systemd service created and enabled"
    else
        log_ok "Systemd service already exists (use --install-service to reinstall)"
    fi

    # Step 8: Start or restart the service
    log_step "🚀 Step 8: Starting application..."
    if [ -f "$SERVICE_FILE" ]; then
        sudo systemctl restart kelasai || die "Failed to restart service"
        log_ok "Service restarted"
        echo ""
        echo "Useful commands:"
        echo "  sudo systemctl status kelasai   - Check status"
        echo "  sudo systemctl restart kelasai  - Restart"
        echo "  sudo journalctl -u kelasai -f   - View logs"
    else
        log_info "Starting in background (no systemd)..."
        nohup node .next/standalone/server.js > server.log 2>&1 &
        echo $! > .pid
        log_ok "Application started (PID: $(cat .pid))"
        echo "To stop: kill \$(cat .pid)"
    fi

    # Done
    echo ""
    echo -e "${GREEN}======================================${NC}"
    echo -e "${GREEN}✅ Native deployment complete!${NC}"
    echo -e "${GREEN}======================================${NC}"
    echo ""
    echo "🌐 Your KelasAI platform is running at: http://localhost:3000"
    echo ""
    echo "Next steps:"
    echo "  1. Setup a reverse proxy (Caddy/Nginx) for domain access"
    echo "  2. Update NEXTAUTH_URL in .env to your domain"
    echo "  3. Open firewall ports 80 & 443"
    echo ""
fi
