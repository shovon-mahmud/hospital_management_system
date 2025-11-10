# Deployment Guide: Vercel (Frontend) + Render (Backend)

## Overview
- **Frontend**: Deployed on Vercel
- **Backend**: Deployed on Render
- **Database**: MongoDB Atlas

## Step 1: Deploy Backend to Render

### 1.1 Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `shovon-mahmud/hospital_management_system`
4. Configure the service:

**Basic Settings:**
- **Name**: `airelus-hms-backend` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Instance Type:**
- Free tier or Starter (depending on your needs)

### 1.2 Add Environment Variables in Render
Go to **Environment** tab and add these variables:

```bash
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://adminx:passx@airelus.bedruup.mongodb.net/hms?retryWrites=true&w=majority&appName=Airelus
JWT_ACCESS_SECRET=c1e5c5ad97824b038c5ee77e3bde84994c57bb7c7ccab6c890f8a798f07c9a188d48d73125b697376de7db50ef974a94ffa9b691b332ba65d7cf159e2aee7353
JWT_REFRESH_SECRET=07bd0a93cccb123cfa8ab9de9906dac81a077ee68be30a2ea01d447e799887b8dd14865bd2926d50303b52606939b08addcbc7faa81367f8ac0c049cc1826ec5
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shovon340x2@gmail.com
SMTP_PASS=kaur mlxz znck jzqz
SMTP_FROM="Airelus Hospital Ltd <shovon340x2@gmail.com>"
LOGIN_NOTIFY=false
LOGIN_GREETING=true
AUTH_DEBUG=false
APP_NAME=Airelus Hospital Ltd
```

**IMPORTANT**: You'll add `FRONTEND_URL` and `CORS_ORIGINS` after deploying frontend (Step 2)

### 1.3 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Note your backend URL: `https://hospital-management-system-server-x4wl.onrender.com`

### 1.4 Test Backend
Visit these URLs to verify:
- `https://hospital-management-system-server-x4wl.onrender.com/` → Should show: `{"success":true,"message":"Server is running!"}`
- `https://hospital-management-system-server-x4wl.onrender.com/api/health` → Should show: `{"success":true,"message":"OK"}`

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Update Frontend Environment Variable
1. In your local project, edit `client/.env.production`
2. Replace with your actual Render backend URL:
   ```bash
   VITE_API_URL=https://hospital-management-system-server-x4wl.onrender.com/api
   ```

### 2.2 Commit and Push
```bash
git add client/.env.production
git commit -m "feat: add production API URL for Vercel"
git push origin main
```

### 2.3 Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `shovon-mahmud/hospital_management_system`
4. Configure the project:

**Framework Preset:** Vite
**Root Directory:** `client`
**Build Command:** `npm run build` (or leave default)
**Output Directory:** `dist` (or leave default)

**Environment Variables:**
Add this in Vercel:
- **Name**: `VITE_API_URL`
- **Value**: `https://hospital-management-system-server-x4wl.onrender.com/api`

5. Click **"Deploy"**
6. Wait for deployment (2-3 minutes)
7. Note your frontend URL: `https://your-project.vercel.app`

---

## Step 3: Update Backend CORS for Vercel

### 3.1 Add Vercel URL to Render Environment Variables
Go back to Render Dashboard → Your Web Service → Environment:

**Add/Update these variables:**
```bash
FRONTEND_URL=https://your-project.vercel.app
CORS_ORIGINS=https://your-project.vercel.app,http://localhost:5173
```

**Replace** `your-project.vercel.app` with your actual Vercel deployment URL.

### 3.2 Redeploy Backend
After updating environment variables, Render will automatically redeploy. Wait 2-3 minutes.

---

## Step 4: Verify Full Stack Connection

### 4.1 Test Frontend
1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Try to login with test credentials:
   - Admin: `admin@hms.bd` / `Admin@123`
   - Doctor: `dr.nami@hms.bd` / `Pass@123`
   - Patient: `chitoge@example.bd` / `Pass@123`

### 4.2 Check Browser Console
- Open Developer Tools (F12)
- Go to Console tab
- Look for API calls to your Render backend
- Should see successful responses (200 status)

### 4.3 Common Issues

**CORS Error:**
```
Access to XMLHttpRequest at 'https://hospital-management-system-server-x4wl.onrender.com/api/...' 
from origin 'https://your-project.vercel.app' has been blocked by CORS policy
```
**Fix:** Verify `CORS_ORIGINS` in Render includes your exact Vercel URL (no trailing slash)

**API Connection Failed:**
```
Network Error / ERR_CONNECTION_REFUSED
```
**Fix:** 
1. Check backend is running: Visit `https://hospital-management-system-server-x4wl.onrender.com/`
2. Verify `VITE_API_URL` in Vercel environment variables
3. Redeploy frontend on Vercel after changing env vars

**Render Service Sleeping (Free Tier):**
Render free tier spins down after 15 minutes of inactivity. First request takes 30-60 seconds.
**Fix:** Upgrade to paid tier or accept cold start delay.

---

## Step 5: Custom Domain (Optional)

### 5.1 Frontend Custom Domain (Vercel)
1. Go to Vercel → Your Project → Settings → Domains
2. Add your domain (e.g., `app.airelus.com`)
3. Follow DNS configuration instructions
4. Update `CORS_ORIGINS` in Render to include your custom domain

### 5.2 Backend Custom Domain (Render)
1. Go to Render → Your Service → Settings → Custom Domain
2. Add your domain (e.g., `api.airelus.com`)
3. Follow DNS configuration instructions
4. Update `VITE_API_URL` in Vercel to use your custom domain

---

## Quick Reference

### URLs to Update

**After Backend Deploy:**
- Copy: `https://airelus-hms-backend.onrender.com`
- Update in: `client/.env.production` → `VITE_API_URL`

**After Frontend Deploy:**
- Copy: `https://your-project.vercel.app`
- Update in: Render Environment Variables → `FRONTEND_URL` and `CORS_ORIGINS`

### Redeploy Triggers

**Frontend (Vercel):**
- Automatic on `git push` to main branch
- Manual: Vercel Dashboard → Deployments → ⋮ → Redeploy

**Backend (Render):**
- Automatic on `git push` to main branch
- Automatic on environment variable changes
- Manual: Render Dashboard → Manual Deploy → Deploy latest commit

---

## Health Check Endpoints

Add these to Render **Health Check Path** setting:
- Path: `/` 
- Expected Response: `{"success":true,"message":"Server is running!"}`

Or:
- Path: `/api/health`
- Expected Response: `{"success":true,"message":"OK"}`

---

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Backend environment variables configured
- [ ] Backend health check passes
- [ ] Frontend `.env.production` updated with backend URL
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable `VITE_API_URL` set in Vercel
- [ ] Backend CORS updated with Vercel URL
- [ ] Login tested on production frontend
- [ ] API calls working (check browser console)
- [ ] No CORS errors
- [ ] MongoDB connection working
- [ ] Email sending tested (if needed)

---

## Support

**Render Issues:**
- Check Logs: Render Dashboard → Your Service → Logs
- [Render Docs](https://render.com/docs)

**Vercel Issues:**
- Check Build Logs: Vercel Dashboard → Deployments → Click deployment
- [Vercel Docs](https://vercel.com/docs)

**MongoDB Issues:**
- Check Atlas: [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
- Verify IP whitelist includes `0.0.0.0/0` (allow all) for Render

---

**Last Updated:** November 11, 2025  
**Repository:** github.com/shovon-mahmud/hospital_management_system
