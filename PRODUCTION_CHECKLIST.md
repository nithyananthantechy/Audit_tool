# Production Readiness Checklist

## 1. Build & Optimization ✓

### Frontend Build (Vite + React)
- [x] Minification enabled (terser)
- [x] Code splitting configured (vendor, charts, icons chunks)
- [x] Sourcemaps disabled for production
- [ ] Run `npm run build` to generate optimized build

### To Build:
```bash
# Build frontend
npm run build

# This creates /dist folder with optimized files
```

## 2. Environment Setup

### Create production environment file:
```bash
# Copy template and configure
cp .env.production .env
# Edit .env with actual values
```

### Required Environment Variables:
```
NODE_ENV=production
PORT=3001
VITE_API_BASE_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password (use App Password, not login password)
SESSION_SECRET=generate-strong-random-string
GEMINI_API_KEY=your-key
```

### To Generate Secure Secrets:
```bash
# Generate random session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Backend Readiness ✓

### Security Features Added:
- [x] Rate limiting (100 requests/15 min per IP)
- [x] Security headers (CSP, X-Frame-Options, X-XSS-Protection)
- [x] CORS configured for production domain

### Update CORS for Production:
In `server/server.js` line ~25, replace:
```javascript
origin: IS_PRODUCTION ? ['https://your-domain.com', 'http://your-domain.com'] : true,
```

## 4. Database

### SQLite Production Notes:
- Database file: `server/audit.db`
- Already using file-based SQLite (no changes needed)
- For high traffic, consider PostgreSQL migration

### Backup Strategy:
```bash
# Backup command
cp server/audit.db server/audit.db.backup.$(date +%Y%m%d)
```

## 5. Deployment Options

### Option A: Vercel (Recommended for simplicity)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: DigitalOcean/AWS (Full Control)
- Use the existing Dockerfile
- Build React app first, then serve with Nginx

### Option C: Traditional Server (Ubuntu)
```bash
# 1. Build the app
npm run build

# 2. Copy dist to server
scp -r dist user@your-server:/var/www/your-app/

# 3. Use nginx config from nginx/ubuntu-site-config
```

## 6. Security Checklist

- [ ] Update CORS origin to your actual domain
- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS (via nginx or cloud provider)
- [ ] Use App Password for Gmail SMTP
- [ ] Rotate all default passwords:
  - `admin@desicrew.in` / `password123`
  - `gowriamutha@desicrew.in` / `Desicrew@2026`
  - `test@desicrew.in` / `123`

## 7. Monitoring & Analytics

### Error Tracking (Sentry):
```bash
npm install @sentry/react
```

### Basic Logging:
- Server logs are output to console
- For production, use PM2 for process management:
```bash
npm install -g pm2
pm2 start server/server.js
pm2 logs
```

## 8. Pre-Launch Final Checklist

- [ ] Run `npm run build` successfully
- [ ] Set all environment variables
- [ ] Change default passwords
- [ ] Update CORS with production domain
- [ ] Test all API endpoints
- [ ] Verify HTTPS is working
- [ ] Set up database backup
- [ ] Configure domain DNS
- [ ] Test from multiple browsers

## Quick Deploy (Vercel):

```bash
# Install Vercel
npm i -g vercel

# Build first
npm run build

# Deploy (follow prompts)
vercel --prod
```

After Vercel deployment, update the API URL in your frontend code or environment.
