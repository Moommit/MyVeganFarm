# MyVeganFarm Backend - Render Deployment

This is the Express backend for MyVeganFarm app. It handles:
- User authentication (sessions)
- Animal saving data per user
- Community recipe sharing
- Nutrition tracking
- File-based storage (JSON files)

## Environment Variables

None required - the server auto-configures:
- `PORT` - Render provides this automatically
- Data files auto-initialize on first run

## Deployment on Render

### Quick Start

1. **Upload to GitHub:**
   - Go to https://github.com/new
   - Create a new repository (e.g., "MyVeganFarm")
   - Download GitHub Desktop: https://desktop.github.com/
   - Open GitHub Desktop → Add → Add Existing Repository → Select `C:\Users\mohay\OneDrive\Desktop\MyVeganFarm`
   - Commit all files
   - Publish to GitHub

2. **Deploy on Render:**
   - Go to https://render.com (sign up with GitHub)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `myvegan-farm-backend` (or any name you prefer)
     - **Region:** Choose closest to you
     - **Branch:** `main` (or `master`)
     - **Root Directory:** `savefarm`
     - **Runtime:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `node server/index.js`
     - **Instance Type:** Free (or paid if you need more reliability)
   
3. **Add Persistent Disk (Important!):**
   - In your Render service settings
   - Go to "Disks" tab
   - Click "Add Disk"
   - **Name:** `data-storage`
   - **Mount Path:** `/opt/render/project/src/savefarm/server/data`
   - **Size:** 1GB (more than enough for JSON files)
   - This prevents data loss on redeploys!

4. **Deploy:**
   - Click "Create Web Service"
   - Wait 2-5 minutes for build and deployment
   - Copy your service URL (e.g., `https://myvegan-farm-backend.onrender.com`)

### After Deployment

Your backend URL will be something like:
```
https://myvegan-farm-backend.onrender.com
```

Test it by visiting:
```
https://myvegan-farm-backend.onrender.com/api/community/leaderboard
```

You should see `{"leaderboard":[]}` (empty array initially).

### Update Frontend

Add this environment variable to your frontend (Vercel or local):
```
VITE_API_URL=https://myvegan-farm-backend.onrender.com
```

## Local Development

```bash
cd savefarm
npm install
node server/index.js
```

Server runs on http://localhost:3000

## File Storage

Data is stored in:
- `server/data/users.json` - User accounts and per-user animal data
- `server/data/shared_recipes.json` - Community shared recipes

## API Endpoints

### Authentication
- `POST /api/register` - Create account
- `POST /api/login` - Login
- `POST /api/logout` - Logout

### Animals
- `GET /api/animals` - Get user's saved animals
- `POST /api/animals` - Save animals
- `POST /api/animals/reset` - Reset farm

### Community
- `GET /api/community/leaderboard` - Top users by animals saved
- `GET /api/community/recipes` - Shared recipes
- `POST /api/community/share-recipe` - Share a recipe
- `POST /api/community/like/:recipeId` - Like a recipe
- `POST /api/community/comment/:recipeId` - Comment on recipe

### Nutrition
- `POST /api/nutrition/log` - Log a meal
- `GET /api/nutrition/logs` - Get nutrition logs
- `GET /api/nutrition/goals` - Get goals
- `POST /api/nutrition/goals` - Set goals
- `DELETE /api/nutrition/log/:date/:logId` - Delete meal entry

## Tech Stack

- Node.js + Express
- File-based JSON storage
- Session-based authentication
- CORS enabled for all origins
