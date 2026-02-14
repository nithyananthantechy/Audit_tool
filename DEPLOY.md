# Deploy to Ubuntu Server with Nginx (Automated)

This guide explains how to deploy the DesiCrew Audit Compliance Manager application on your Ubuntu server using the provided automation script.

## 1. Prerequisites (Ubuntu Server)

Connect to your Ubuntu server via SSH.

```bash
# Update package list
sudo apt update
sudo apt install git -y
```

## 2. Transfer Project Files & Run Install Script

You can deploy by cloning your repository directly to the web root.

```bash
# 1. Navigate to the web root or create directory
sudo mkdir -p /var/www/desicrew-compliance
sudo chown -R $USER:$USER /var/www/desicrew-compliance
cd /var/www/desicrew-compliance

# 2. Clone your repository (replace with your actual repo URL)
git clone <your-repo-url> .
# OR copy files via SCP/SFTP if not using git

# 3. Make the deployment script executable
chmod +x deploy.sh

# 4. Run the deployment script
./deploy.sh
```

The `deploy.sh` script handles:
- Installing Nginx and Node.js
- Installing dependencies (`npm install`)
- Building the application (`npm run build`)
- Configuring Nginx automatically
- Setting correct permissions

### 3. Backend Server Setup (Required for Data Sync)

The application now uses a lightweight Node.js backend to sync data between users.

1.  **Navigate to the server directory:**
    ```bash
    cd /var/www/desicrew-compliance/server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    For production, use `nohup` to keep it running in the background:
    ```bash
    nohup node server.js > server.log 2>&1 &
    ```

    *To stop the server later if needed: `pkill -f "node server.js"`*

## 4. Configure Environment Variables

The script will create a placeholder `.env` file if one doesn't exist. You must edit it to add your real API keys:

```bash
nano .env
```

Update your `GEMINI_API_KEY`:
```
GEMINI_API_KEY=your_actual_api_key_here
```
Then rebuild to apply changes:
```bash
npm run build
```

## 4. Verify Deployment

1.  Open your web browser and navigate to your server's IP address (`http://your-server-ip`).
2.  Login with `admin@desicrew.in` / `password123`.
3.  Check if the Dashboard loads correctly.

## Troubleshooting

-   **Check Nginx Status**:
    ```bash
    sudo systemctl status nginx
    ```
-   **Check Nginx Logs**:
    ```bash
    sudo tail -f /var/log/nginx/error.log
    ```
-   **Permissions**:
    Ensure the `dist` folder is readable by Nginx (the script handles this, but if you manually change files, you might need to re-run):
    ```bash
    sudo chown -R www-data:www-data /var/www/desicrew-compliance/dist
    ```
