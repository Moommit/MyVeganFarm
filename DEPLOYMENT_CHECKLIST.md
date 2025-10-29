# 🚀 Quick Deployment Checklist

Use this to track your deployment progress:

## ☐ Prerequisites
- [ ] Install Git: https://git-scm.com/download/win
- [ ] Install GitHub Desktop: https://desktop.github.com/
- [ ] Create GitHub account: https://github.com/signup

## ☐ Backend (Render)

### Push to GitHub:
- [ ] Open GitHub Desktop
- [ ] File → Add Local Repository → `C:\Users\mohay\OneDrive\Desktop\MyVeganFarm`
- [ ] Create repository in GitHub Desktop
- [ ] Commit message: "Initial commit"
- [ ] Click "Publish repository" → Choose public/private → Publish

### Deploy on Render:
- [ ] Sign up at https://render.com (use GitHub login)
- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repo
- [ ] Name: `myvegan-farm-backend`
- [ ] Root Directory: `savefarm`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node server/index.js`
- [ ] **Add Disk:** Name: `data-storage`, Mount: `/opt/render/project/src/savefarm/server/data`, Size: 1GB
- [ ] Click "Create Web Service"
- [ ] Wait for deployment
- [ ] Copy backend URL: `https://__________.onrender.com`

## ☐ Frontend (Vercel)

- [ ] Sign up at https://vercel.com (use GitHub login)
- [ ] Click "Add New..." → "Project"
- [ ] Import your `MyVeganFarm` repo
- [ ] Root Directory: `savefarm`
- [ ] Framework: Vite
- [ ] **Add Environment Variables:**
  - [ ] `VITE_API_URL` = Your Render backend URL
  - [ ] `VITE_HF_TOKEN` = Your Hugging Face token
- [ ] Click "Deploy"
- [ ] Wait for deployment
- [ ] Visit your live URL!

## ☐ Testing

Visit your Vercel URL and test:
- [ ] Register/Login works
- [ ] Analyze a recipe
- [ ] Animals save to farm
- [ ] View full farm
- [ ] Browse recipes
- [ ] Community leaderboard loads
- [ ] Nutrition tracker works

## ✅ Done!

Your app is live! Share your URL:
- Frontend: `https://__________.vercel.app`
- Backend: `https://__________.onrender.com`

---

## 🆘 Quick Fixes

**Backend not responding?**
→ Check Render logs, verify Start Command

**Frontend API errors?**
→ Check VITE_API_URL in Vercel env vars, redeploy

**Data resetting?**
→ Add persistent disk in Render

**Routes 404?**
→ Ensure vercel.json exists in savefarm folder
