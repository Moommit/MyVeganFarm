# 🌱 MyVeganFarm - Deployment Guide

Complete step-by-step guide to deploy your vegan recipe analyzer with animal farm tracking!

---

## 📦 What You're Deploying

- **Frontend (Vite/React)** → Vercel
- **Backend (Express/Node)** → Render
- **External APIs:**
  - TheMealDB (vegan recipes)
  - Hugging Face (AI recipe analysis)

---

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Install Git and GitHub Desktop (if not already)

Download and install:
- **Git:** https://git-scm.com/download/win
- **GitHub Desktop:** https://desktop.github.com/

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `MyVeganFarm`
3. Set to Public or Private (your choice)
4. Don't add README, .gitignore, or license (we already have them)
5. Click "Create repository"

### 1.3 Push Your Code to GitHub

**Using GitHub Desktop (Easiest):**

1. Open GitHub Desktop
2. File → Add Local Repository
3. Choose: `C:\Users\mohay\OneDrive\Desktop\MyVeganFarm`
4. Click "Add Repository"
5. It will say "This directory does not appear to be a Git repository"
6. Click "create a repository" in the warning message
7. Uncheck "Initialize with README" (we have files already)
8. Click "Create Repository"
9. In the left sidebar, you'll see all your files
10. Type commit message: "Initial commit - MyVeganFarm app"
11. Click "Commit to main"
12. Click "Publish repository"
13. Choose Public or Private
14. Click "Publish Repository"

**Or using Git Bash (if you prefer):**

```bash
cd C:\Users\mohay\OneDrive\Desktop\MyVeganFarm
git init
git add .
git commit -m "Initial commit - MyVeganFarm app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/MyVeganFarm.git
git push -u origin main
```

### 1.4 Deploy on Render

1. **Sign up/Login to Render:**
   - Go to https://render.com
   - Click "Get Started"
   - Sign up with GitHub (easiest - auto-connects repos)

2. **Create New Web Service:**
   - Click "New +" in top right
   - Select "Web Service"
   - Click "Connect account" if needed to authorize GitHub
   - Find and select your `MyVeganFarm` repository
   - Click "Connect"

3. **Configure Service Settings:**
   
   Fill in these exactly:
   
   - **Name:** `myvegan-farm-backend` (or anything you like)
   - **Region:** Choose closest to you (e.g., Frankfurt/EU or Oregon/US)
   - **Branch:** `main`
   - **Root Directory:** `savefarm`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
   - **Plan:** Free (or Starter if you want better uptime)

4. **Add Persistent Disk (CRITICAL!):**
   
   Before deploying:
   - Scroll down to "Advanced" section
   - Click "Add Disk"
   - **Name:** `data-storage`
   - **Mount Path:** `/opt/render/project/src/savefarm/server/data`
   - **Size:** 1 GB
   
   ⚠️ **This is important!** Without this, your user data will reset on every deploy.

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-5 minutes for the build
   - Watch the logs - you should see "Server running at http://localhost:XXXX"
   - Once it says "Live", copy your service URL

6. **Your Backend URL:**
   - It will be something like: `https://myvegan-farm-backend.onrender.com`
   - Test it by visiting: `https://myvegan-farm-backend.onrender.com/api/community/leaderboard`
   - You should see: `{"leaderboard":[]}`
   - ✅ Backend is live!

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Sign up for Vercel

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)

### 2.2 Import Project

1. Click "Add New..." → "Project"
2. Select your `MyVeganFarm` repository
3. Click "Import"

### 2.3 Configure Build Settings

Vercel usually auto-detects, but verify:

- **Framework Preset:** Vite
- **Root Directory:** `savefarm`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### 2.4 Add Environment Variables

⚠️ **CRITICAL STEP:**

Before deploying, add this environment variable:

- Click "Environment Variables"
- **Name:** `VITE_API_URL`
- **Value:** `https://myvegan-farm-backend.onrender.com` (your backend URL from Step 1)
- Click "Add"

Also add your Hugging Face token (if not already in `.env`):
- **Name:** `VITE_HF_TOKEN`
- **Value:** Your Hugging Face token
- Click "Add"

### 2.5 Deploy

1. Click "Deploy"
2. Wait 1-3 minutes
3. Vercel will show you the live URL
4. Click "Visit" to open your app

### 2.6 Test Your Deployed App

Visit your Vercel URL and test:
1. ✅ Register a new account
2. ✅ Analyze a vegan recipe
3. ✅ Save animals to your farm
4. ✅ View full farm page
5. ✅ Browse recipe library
6. ✅ Check community leaderboard
7. ✅ Log nutrition data

---

## 🔧 Troubleshooting

### Backend Issues

**"Application failed to respond":**
- Check Render logs for errors
- Verify `Start Command` is `node server/index.js`
- Verify `Root Directory` is `savefarm`

**Data resets on deploy:**
- Add the persistent disk (see Step 1.4)

**CORS errors:**
- Backend CORS is already configured to allow all origins
- Check browser console for specific error

### Frontend Issues

**"Failed to fetch" or API errors:**
- Verify `VITE_API_URL` environment variable is set in Vercel
- Check if backend URL is accessible (visit it directly)
- Redeploy frontend after adding env var

**404 on routes (e.g., `/farm`, `/community`):**
- Ensure `savefarm/vercel.json` exists (should already be there)
- Redeploy

**Hugging Face API errors:**
- Check `VITE_HF_TOKEN` is set in Vercel environment variables
- Get token from https://huggingface.co/settings/tokens

---

## 📱 Local Development (Optional)

If you want to continue developing locally:

### Backend
```bash
cd savefarm
node server/index.js
```

### Frontend
```bash
cd savefarm
npm run dev
```

Create `savefarm/.env`:
```
VITE_API_URL=http://localhost:3000
VITE_HF_TOKEN=your_token_here
```

---

## 🎉 You're Done!

Your app is now live and accessible worldwide! Share your Vercel URL with friends.

### Your URLs:
- **Frontend:** `https://your-app.vercel.app`
- **Backend:** `https://myvegan-farm-backend.onrender.com`

---

## 📊 What's Next?

Optional improvements:
1. **Custom Domain:** Add your own domain in Vercel settings
2. **Database Upgrade:** Migrate from JSON files to Supabase/PostgreSQL
3. **Analytics:** Add Vercel Analytics
4. **Monitoring:** Set up Render health checks

---

## 💾 Updating Your App

When you make changes:

**Using GitHub Desktop:**
1. Make code changes locally
2. Open GitHub Desktop
3. Review changes in left sidebar
4. Type commit message
5. Click "Commit to main"
6. Click "Push origin"
7. Render and Vercel will auto-deploy!

**Manual Deploy:**
- Render: Will auto-redeploy when you push to GitHub
- Vercel: Will auto-redeploy when you push to GitHub

---

## 📧 Need Help?

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Check Render logs if backend has issues
- Check Vercel logs if frontend has issues

Good luck! 🌱🚀
