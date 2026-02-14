#!/bin/bash

# Deployment Script for DesiCrew Audit Compliance Manager on Ubuntu with Nginx

# Configuration
APP_DIR="/var/www/desicrew-compliance"
NGINX_CONFIG_SOURCE="nginx/ubuntu-site-config"
SITE_NAME="desicrew-compliance"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment for $SITE_NAME...${NC}"

# Ensure script is run with sudo if needed for apt/nginx commands, 
# but we might want to run build as current user. 
# Better to run as regular user with sudo privileges for specific commands.

# 1. Update system and install dependencies
echo -e "${GREEN}Updating system packages...${NC}"
sudo apt update

echo -e "${GREEN}Installing Nginx...${NC}"
sudo apt install -y nginx

echo -e "${GREEN}Checking for Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed: $(node -v)"
fi

# 2. Build the application
echo -e "${GREEN}Installing project dependencies...${NC}"
# Use --legacy-peer-deps if needed, but standard install should work
npm install

echo -e "${GREEN}Building the application...${NC}"
# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}WARNING: .env file not found!${NC}"
    echo "Creating a placeholder .env file. Please edit it with your actual GEMINI_API_KEY."
    echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
fi

# Build
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}ERROR: Build failed. 'dist' directory not found.${NC}"
    exit 1
fi

# 3. Configure Nginx
echo -e "${GREEN}Configuring Nginx...${NC}"

# Check if config file exists in current directory
if [ -f "$NGINX_CONFIG_SOURCE" ]; then
    # Copy config to sites-available
    echo "Copying Nginx configuration..."
    sudo cp "$NGINX_CONFIG_SOURCE" "/etc/nginx/sites-available/$SITE_NAME"
    
    # Enable the site (create symlink)
    if [ ! -L "/etc/nginx/sites-enabled/$SITE_NAME" ]; then
        echo "Enabling site..."
        sudo ln -s "/etc/nginx/sites-available/$SITE_NAME" "/etc/nginx/sites-enabled/"
    else
        echo "Site already enabled."
    fi

    # Disable default Nginx site if it exists
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        echo "Disabling default Nginx site..."
        sudo rm "/etc/nginx/sites-enabled/default"
    fi

    # Test configuration
    echo "Testing Nginx configuration..."
    if sudo nginx -t; then
        echo -e "${GREEN}Nginx configuration is valid. Reloading...${NC}"
        sudo systemctl reload nginx
    else
        echo -e "${RED}ERROR: Nginx configuration test failed!${NC}"
        # Keep deployments safe: don't exit, but warn.
        exit 1
    fi
else
    echo -e "${RED}ERROR: Nginx configuration file '$NGINX_CONFIG_SOURCE' not found!${NC}"
    exit 1
fi

# 4. Set Permissions
# Verify where we are. If we are in /var/www/desicrew-compliance, these paths work.
LOCAL_DIR=$(pwd)
if [[ "$LOCAL_DIR" != *"/var/www/"* ]]; then
     echo -e "${RED}WARNING: You seem to be running this script from $LOCAL_DIR.${NC}"
     echo "The Nginx config points to /var/www/desicrew-compliance/dist."
     echo "If you are not deploying to that path, please update the Nginx config."
fi

echo -e "${GREEN}Setting permissions for web server...${NC}"
# Ensure Nginx can read the files
sudo chown -R www-data:www-data dist
sudo chmod -R 755 dist

echo -e "${GREEN}Deployment complete!${NC}"
echo "You can access your site at http://<your-server-ip>"
