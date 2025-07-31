# Deployment Troubleshooting Guide

## CORS Issues

### Problem: "Origin is not allowed by Access-Control-Allow-Origin"

This error occurs when the frontend URL is not in the backend's allowed CORS origins list.

### Solution:

1. **Go to Render Dashboard**
   - Navigate to your backend service (verified-inference-backend)
   - Click on "Environment" in the left sidebar

2. **Update CORS_ORIGIN**
   - Find the `CORS_ORIGIN` environment variable
   - Update it to include your Vercel frontend URL:
     ```
     https://verified-inference-frontend-1zk23jed7.vercel.app
     ```
   
   - For multiple origins (development + production), use comma separation:
     ```
     http://localhost:5173,https://verified-inference-frontend-1zk23jed7.vercel.app
     ```

3. **Save and Deploy**
   - Click "Save Changes"
   - The service will automatically redeploy

### Alternative: Dynamic CORS

If your frontend URL changes frequently, you can set a more permissive CORS policy:

1. Set `CORS_ORIGIN` to your domain pattern:
   ```
   https://*.vercel.app
   ```

2. Or for development, temporarily allow all origins (NOT recommended for production):
   ```
   *
   ```

## Database Connection Issues

### Problem: "relation 'users' does not exist"

The database tables haven't been created yet.

### Solution:

1. **Install PostgreSQL locally** (if not already installed):
   ```bash
   # macOS
   brew install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   ```

2. **Run the database setup**:
   ```bash
   # Copy the connection string from Render
   PGPASSWORD=YOUR_PASSWORD psql -h YOUR_HOST -U YOUR_USER YOUR_DATABASE < backend/database/complete_setup.sql
   
   # Then run the migration
   PGPASSWORD=YOUR_PASSWORD psql -h YOUR_HOST -U YOUR_USER YOUR_DATABASE < backend/database/migration_add_coherence_metrics.sql
   ```

### Alternative: Using a GUI

1. Download [TablePlus](https://tableplus.com/) or [pgAdmin](https://www.pgadmin.org/)
2. Create a new connection with your Render database credentials
3. Open and run the SQL files in order:
   - `backend/database/complete_setup.sql`
   - `backend/database/migration_add_coherence_metrics.sql`

## Missing vite.svg

This is a minor issue - the default Vite favicon is missing.

### Solution:

Either:
1. Remove the reference from `index.html`
2. Or add a favicon to `frontend/public/vite.svg`

## Environment Variables Checklist

### Backend (Render)
- [ ] `DATABASE_URL` - Provided by Render
- [ ] `CLAUDE_API_KEY` - Your Anthropic API key
- [ ] `JWT_SECRET` - A secure random string (min 32 characters)
- [ ] `CORS_ORIGIN` - Your frontend URL(s)
- [ ] `NODE_ENV` - Set to `production`

### Frontend (Vercel)
- [ ] `VITE_API_URL` - Your Render backend URL (e.g., `https://verified-inference-backend.onrender.com`)

## Common Issues

### 1. CORS Preflight Failing
- Ensure the backend is running and healthy
- Check that CORS_ORIGIN exactly matches your frontend URL (including https://)
- No trailing slashes in URLs

### 2. 502 Bad Gateway
- Backend is still starting up (Render free tier can take 30-60 seconds)
- Check Render logs for errors
- Ensure all environment variables are set

### 3. Authentication Failing
- Verify JWT_SECRET is the same between deployments
- Check that cookies are enabled for cross-origin requests
- Ensure HTTPS is used in production