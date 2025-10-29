import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Path to data files
const usersFile = path.join(__dirname, 'data', 'users.json');

// In-memory sessions (for production, use Redis or similar)
const sessions = new Map();

// Ensure data directory exists
await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

// Initialize users.json if it doesn't exist
try {
  await fs.access(usersFile);
} catch {
  await fs.writeFile(usersFile, JSON.stringify({ users: {} }));
}

app.use(cors({
  origin: (origin, callback) => callback(null, true), // allow all origins for simplicity; tighten with env if needed
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-session-id']
}));
app.use(express.json());

// Helper to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to get user from session
function getUserFromSession(req) {
  const sessionId = req.headers['x-session-id'];
  return sessions.get(sessionId);
}

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    
    if (data.users[username]) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    data.users[username] = {
      passwordHash: hashPassword(password),
      animals: {},
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
    
    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, username);

    res.json({ success: true, sessionId, username });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    const user = data.users[username];

    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, username);

    res.json({ success: true, sessionId, username });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  sessions.delete(sessionId);
  res.json({ success: true });
});

// Get current user's animal counts
app.get('/api/animals', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    const user = data.users[username];
    
    res.json({ animals: user.animals || {} });
  } catch (error) {
    console.error('Error reading animal data:', error);
    res.status(500).json({ error: 'Failed to read animal data' });
  }
});

// Update current user's animal counts
app.post('/api/animals', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { animals } = req.body;
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    
    data.users[username].animals = animals;
    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving animal data:', error);
    res.status(500).json({ error: 'Failed to save animal data' });
  }
});

// Reset current user's animal counts
app.post('/api/animals/reset', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    data.users[username].animals = {};
    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting animal data:', error);
    res.status(500).json({ error: 'Failed to reset animal data' });
  }
});

// ==================== COMMUNITY ENDPOINTS ====================

// Path to shared recipes file
const sharedRecipesFile = path.join(__dirname, 'data', 'shared_recipes.json');

// Initialize shared_recipes.json if it doesn't exist
try {
  await fs.access(sharedRecipesFile);
} catch {
  await fs.writeFile(sharedRecipesFile, JSON.stringify({ recipes: [] }));
}

// Get leaderboard (top users by animals saved)
app.get('/api/community/leaderboard', async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    
    // Calculate total animals for each user
    const leaderboard = Object.entries(data.users).map(([username, userData]) => {
      const totalAnimals = Object.values(userData.animals || {}).reduce((sum, count) => sum + count, 0);
      return {
        username,
        totalAnimals: parseFloat(totalAnimals.toFixed(2)),
        animals: userData.animals || {},
        joinedAt: userData.createdAt
      };
    });
    
    // Sort by total animals (descending)
    leaderboard.sort((a, b) => b.totalAnimals - a.totalAnimals);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Share a recipe with the community
app.post('/api/community/share-recipe', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { recipeName, recipeText, description, animalsSaved } = req.body;
    
    if (!recipeName || !recipeText) {
      return res.status(400).json({ error: 'Recipe name and text required' });
    }
    
    const recipesData = JSON.parse(await fs.readFile(sharedRecipesFile, 'utf8'));
    
    const newRecipe = {
      id: crypto.randomUUID(),
      username,
      recipeName,
      recipeText,
      description: description || '',
      animalsSaved: animalsSaved || {},
      sharedAt: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    recipesData.recipes.unshift(newRecipe); // Add to beginning
    
    await fs.writeFile(sharedRecipesFile, JSON.stringify(recipesData, null, 2));
    
    res.json({ success: true, recipe: newRecipe });
  } catch (error) {
    console.error('Error sharing recipe:', error);
    res.status(500).json({ error: 'Failed to share recipe' });
  }
});

// Get all shared recipes
app.get('/api/community/recipes', async (req, res) => {
  try {
    const recipesData = JSON.parse(await fs.readFile(sharedRecipesFile, 'utf8'));
    res.json({ recipes: recipesData.recipes || [] });
  } catch (error) {
    console.error('Error fetching shared recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Like a shared recipe
app.post('/api/community/like/:recipeId', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { recipeId } = req.params;
    const recipesData = JSON.parse(await fs.readFile(sharedRecipesFile, 'utf8'));
    
    const recipe = recipesData.recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    recipe.likes = (recipe.likes || 0) + 1;
    
    await fs.writeFile(sharedRecipesFile, JSON.stringify(recipesData, null, 2));
    
    res.json({ success: true, likes: recipe.likes });
  } catch (error) {
    console.error('Error liking recipe:', error);
    res.status(500).json({ error: 'Failed to like recipe' });
  }
});

// Add comment to a shared recipe
app.post('/api/community/comment/:recipeId', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { recipeId } = req.params;
    const { comment } = req.body;
    
    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    const recipesData = JSON.parse(await fs.readFile(sharedRecipesFile, 'utf8'));
    
    const recipe = recipesData.recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    if (!recipe.comments) {
      recipe.comments = [];
    }
    
    const newComment = {
      id: crypto.randomUUID(),
      username,
      text: comment,
      createdAt: new Date().toISOString()
    };
    
    recipe.comments.push(newComment);
    
    await fs.writeFile(sharedRecipesFile, JSON.stringify(recipesData, null, 2));
    
    res.json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==================== NUTRITION TRACKING ENDPOINTS ====================

// Save daily nutrition log
app.post('/api/nutrition/log', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { date, mealName, nutrition } = req.body;
    
    if (!date || !nutrition) {
      return res.status(400).json({ error: 'Date and nutrition data required' });
    }
    
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    
    if (!data.users[username].nutritionLogs) {
      data.users[username].nutritionLogs = {};
    }
    
    if (!data.users[username].nutritionLogs[date]) {
      data.users[username].nutritionLogs[date] = [];
    }
    
    const logEntry = {
      id: crypto.randomUUID(),
      mealName: mealName || 'Meal',
      nutrition,
      timestamp: new Date().toISOString()
    };
    
    data.users[username].nutritionLogs[date].push(logEntry);
    
    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true, log: logEntry });
  } catch (error) {
    console.error('Error saving nutrition log:', error);
    res.status(500).json({ error: 'Failed to save nutrition log' });
  }
});

// Get nutrition logs for a date range
app.get('/api/nutrition/logs', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { startDate, endDate } = req.query;
    
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    const nutritionLogs = data.users[username].nutritionLogs || {};
    
    // Filter logs by date range if provided
    let filteredLogs = nutritionLogs;
    if (startDate && endDate) {
      filteredLogs = {};
      Object.keys(nutritionLogs).forEach(date => {
        if (date >= startDate && date <= endDate) {
          filteredLogs[date] = nutritionLogs[date];
        }
      });
    }
    
    res.json({ logs: filteredLogs });
  } catch (error) {
    console.error('Error fetching nutrition logs:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition logs' });
  }
});

// Set/Get daily nutrition goals
app.post('/api/nutrition/goals', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { goals } = req.body;
    
    if (!goals) {
      return res.status(400).json({ error: 'Goals data required' });
    }
    
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    data.users[username].nutritionGoals = goals;
    
    await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
    
    res.json({ success: true, goals });
  } catch (error) {
    console.error('Error saving nutrition goals:', error);
    res.status(500).json({ error: 'Failed to save nutrition goals' });
  }
});

app.get('/api/nutrition/goals', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    const goals = data.users[username].nutritionGoals || getDefaultGoals();
    
    res.json({ goals });
  } catch (error) {
    console.error('Error fetching nutrition goals:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition goals' });
  }
});

// Helper function for default vegan nutrition goals
function getDefaultGoals() {
  return {
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 70,
    fiber: 30,
    iron: 18,
    calcium: 1000,
    vitaminB12: 2.4,
    vitaminD: 15,
    omega3: 1.6,
    zinc: 11
  };
}

// Delete nutrition log entry
app.delete('/api/nutrition/log/:date/:logId', async (req, res) => {
  try {
    const username = getUserFromSession(req);
    
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { date, logId } = req.params;
    
    const data = JSON.parse(await fs.readFile(usersFile, 'utf8'));
    
    if (data.users[username].nutritionLogs && data.users[username].nutritionLogs[date]) {
      data.users[username].nutritionLogs[date] = data.users[username].nutritionLogs[date].filter(
        log => log.id !== logId
      );
      
      if (data.users[username].nutritionLogs[date].length === 0) {
        delete data.users[username].nutritionLogs[date];
      }
      
      await fs.writeFile(usersFile, JSON.stringify(data, null, 2));
      
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Log not found' });
    }
  } catch (error) {
    console.error('Error deleting nutrition log:', error);
    res.status(500).json({ error: 'Failed to delete nutrition log' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});