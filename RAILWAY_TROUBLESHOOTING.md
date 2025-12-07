# Railway Service Offline - Troubleshooting Guide

## 🔍 Quick Diagnosis Steps

### Step 1: Check Railway Logs
1. Go to Railway Dashboard → Your **MentalBackend** service
2. Click on **Logs** tab
3. Look for error messages (red text)
4. Common errors you might see:
   - `Error: Cannot find module '...'` → Missing dependency
   - `Error: connect ECONNREFUSED` → Database connection issue
   - `Port already in use` → Port configuration issue
   - `Environment variable missing` → Missing env vars

### Step 2: Check Service Status
1. In Railway Dashboard → Your service
2. Check if status shows:
   - ✅ **Active** = Service is running
   - ⚠️ **Deploying** = Currently deploying
   - ❌ **Offline** = Service crashed or failed to start

### Step 3: Check Recent Deployments
1. Go to **Deployments** tab
2. Check the latest deployment status:
   - ✅ Green checkmark = Successful
   - ❌ Red X = Failed (click to see error)

---

## 🛠️ Common Issues & Fixes

### Issue 1: Missing Environment Variables

**Symptoms:**
- Service shows as offline
- Logs show: `SUPABASE_URL is not defined` or similar

**Fix:**
1. Go to Railway Dashboard → Your service → **Variables** tab
2. Add these **required** variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_secure_random_string
NODE_ENV=production
PORT=4000
```

3. Click **Deploy** or trigger a new deployment

---

### Issue 2: Application Crashes on Startup

**Symptoms:**
- Service goes offline immediately after starting
- Logs show application errors

**Common Causes:**

#### A. Missing Dependencies
**Fix:**
- Railway should auto-install from `package.json`
- If not, check that `package.json` is in the root directory
- Verify all dependencies are listed in `package.json`

#### B. Database Connection Error
**Fix:**
1. Verify Supabase credentials are correct
2. Check Supabase project is active (not paused)
3. Test connection locally first

#### C. Port Binding Issue
**Fix:**
- Railway sets `PORT` automatically
- Your code should use: `process.env.PORT || 4000`
- ✅ Your `server.js` already does this correctly

---

### Issue 3: Build Failures

**Symptoms:**
- Deployment shows as failed
- Build logs show errors

**Fix:**
1. Check build logs in Railway
2. Common issues:
   - Syntax errors in code
   - Missing files
   - TypeScript errors (if using TS)

---

### Issue 4: Health Check Failures

**Symptoms:**
- Service shows offline even though it's running
- Health endpoint not responding

**Fix:**
1. Your health endpoint is at `/health`
2. Test it: `https://your-railway-url.up.railway.app/health`
3. If it doesn't respond, check:
   - Is the server actually starting?
   - Are there any startup errors in logs?

---

## 🔧 Quick Fixes to Try

### Fix 1: Restart the Service
1. Railway Dashboard → Your service
2. Click **Settings** → **Restart Service**

### Fix 2: Redeploy
1. Railway Dashboard → Your service
2. Click **Deployments** → **Redeploy**

### Fix 3: Check Environment Variables
1. Railway Dashboard → Your service → **Variables**
2. Verify all required variables are set:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ `JWT_SECRET`
   - ✅ `NODE_ENV=production`

### Fix 4: Check Logs for Specific Errors
1. Railway Dashboard → Your service → **Logs**
2. Look for the **last error** before service went offline
3. Common patterns:
   - `Error: Cannot find module` → Missing dependency
   - `ECONNREFUSED` → Database connection issue
   - `EADDRINUSE` → Port already in use
   - `Missing environment variable` → Add missing env var

---

## 📋 Verification Checklist

Before reporting an issue, verify:

- [ ] All environment variables are set in Railway
- [ ] Supabase project is active (not paused)
- [ ] `package.json` has correct start script: `"start": "node server.js"`
- [ ] `server.js` uses `process.env.PORT || 4000`
- [ ] No syntax errors in code
- [ ] All dependencies are in `package.json`
- [ ] Health endpoint works: `/health`

---

## 🚨 Emergency Fix: Manual Deployment

If automatic deployment isn't working:

1. **Check Railway Logs** for the exact error
2. **Fix the error** locally first
3. **Test locally**: `npm start`
4. **Commit and push** to your GitHub repo
5. **Railway will auto-deploy** from GitHub

---

## 📞 Still Having Issues?

1. **Copy the exact error** from Railway logs
2. **Check**:
   - What was the last successful deployment?
   - What changed since then?
   - Are all environment variables set?
3. **Common last resort fixes**:
   - Delete and recreate the Railway service
   - Check Railway status page for outages
   - Verify your Railway plan isn't expired

---

## ✅ Expected Working State

When everything is working:
- Service status: **Active** ✅
- Health endpoint: `https://your-url.up.railway.app/health` returns:
  ```json
  {
    "status": "OK",
    "message": "Server is running",
    "timestamp": "..."
  }
  ```
- Logs show: `Server is running on port 4000`

---

## 🔍 Debug Commands (Local Testing)

Test your app locally before deploying:

```bash
# Install dependencies
npm install

# Set environment variables (create .env file)
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
JWT_SECRET=your_secret
PORT=4000
NODE_ENV=production

# Start server
npm start

# Test health endpoint
curl http://localhost:4000/health
```

If it works locally but not on Railway, the issue is likely:
- Missing environment variables
- Railway-specific configuration
- Build/deployment process

