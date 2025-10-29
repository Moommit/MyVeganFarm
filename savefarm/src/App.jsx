import React, { useState, useEffect } from "react";
import { analyzeRecipe } from "./api/analyze.js";
import { apiFetch } from "./api/client";
import { formatMealForAnalyzer } from "./api/recipes.js";
import { Farm } from "./components/Farm";
import { SavedPopup } from "./components/SavedPopup";
import { Auth } from "./components/Auth";
import { RandomRecipe } from "./components/RandomRecipe";
import FullFarm from "./pages/FullFarm";
import RecipeLibrary from "./pages/RecipeLibrary";
import Community from "./pages/Community";
import NutritionTracker from "./pages/NutritionTracker";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname || '/');
  const [recipe, setRecipe] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalAnimals, setTotalAnimals] = useState({});
  const [savedPopup, setSavedPopup] = useState(null);
  
  // Authentication state
  const [user, setUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
  const storedSessionId = localStorage.getItem('sessionId');
    const storedUsername = localStorage.getItem('username');
    
    if (storedSessionId && storedUsername) {
      // Verify session is still valid by trying to load animals
      apiFetch('/api/animals', {
        headers: {
          'x-session-id': storedSessionId,
        },
      })
        .then(res => {
          if (res.ok) {
            setUser(storedUsername);
            setSessionId(storedSessionId);
            return res.json();
          } else {
            // Session invalid, clear storage
            localStorage.removeItem('sessionId');
            localStorage.removeItem('username');
            throw new Error('Session expired');
          }
        })
        .then(data => {
          setTotalAnimals(data.animals || {});
          setAuthLoading(false);
        })
        .catch(err => {
          console.error('Error verifying session:', err);
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Load animals from server when user logs in
  useEffect(() => {
    if (user && sessionId) {
      apiFetch('/api/animals', {
        headers: {
          'x-session-id': sessionId,
        },
      })
        .then(res => res.json())
        .then(data => setTotalAnimals(data.animals || {}))
        .catch(err => console.error('Error loading animals:', err));
    }
  }, [user, sessionId]);

  // Simple client-side routing using history API
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Save animals to server when they change
  useEffect(() => {
    if (Object.keys(totalAnimals).length > 0 && sessionId) {
      apiFetch('/api/animals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ animals: totalAnimals }),
      })
        .catch(err => console.error('Error saving animals:', err));
    }
  }, [totalAnimals, sessionId]);

  const handleLogin = (username, newSessionId) => {
    setUser(username);
    setSessionId(newSessionId);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
        },
      });
    } catch (err) {
      console.error('Error logging out:', err);
    }
    
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    setUser(null);
    setSessionId(null);
    setTotalAnimals({});
  };

  const handleAnalyze = async () => {
    if (!recipe.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await analyzeRecipe(recipe);
    setResult(res);
    setLoading(false);

    // If the recipe was vegan, update total animals saved
    if (res.animals_saved > 0) {
      setTotalAnimals(prev => {
        const newTotals = { ...prev };
        // Add animals from details to totals
        if (res.details) {
          res.details.forEach(({ animal, yearly_impact }) => {
            newTotals[animal] = (newTotals[animal] || 0) + parseFloat(yearly_impact);
          });
        }
        return newTotals;
      });
      // Show popup with saved animals details
      setSavedPopup(res.details);
    }
  };

  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setRoute(to);
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-green-100">
        <div className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login/register if not authenticated
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-100 text-gray-800 p-6 font-sans">
      {/* Header with user info and logout */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">
          Welcome, <span className="font-semibold text-green-700">{user}</span>! 👋
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          Logout
        </button>
      </div>

      <h1 className="text-3xl font-bold text-green-700 mb-4">🌱 Vegan Saver AI</h1>
      <p className="max-w-md text-center mb-6">
        Paste your recipe below and see how many animals you’ve saved by going vegan!
      </p>

      <textarea
        value={recipe}
        onChange={(e) => setRecipe(e.target.value)}
        placeholder="Paste your recipe here..."
        className="w-full max-w-md h-40 p-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
      >
        {loading ? "Analyzing with AI..." : "Analyze Recipe 🧠"}
      </button>

      {/* Analysis Results */}
      {result && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6 max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-2 text-green-700">
            🌱 Recipe Analysis
          </h2>
          
          {result.animals_saved > 0 ? (
            <>
              <p className="text-lg mb-2 text-green-600 font-bold">
                This recipe is vegan! Great choice! 🎉
              </p>
              <p className="italic text-gray-700">{result.comment}</p>
            </>
          ) : (
            <>
              <p className="text-lg mb-2">
                Potential yearly impact if veganized:
                <span className="font-bold text-green-600 ml-2">
                  {result.potential_yearly_impact} animals
                </span>
              </p>
              <p className="italic text-gray-700">{result.comment}</p>
              {result.details && result.details.length > 0 && (
                <div className="mt-4 text-left">
                  <h3 className="font-semibold mb-2">Details:</h3>
                  <ul className="list-disc pl-5">
                    {result.details.map((detail, i) => (
                      <li key={i} className="text-sm">
                        {detail.ingredient}: {detail.yearly_impact} {detail.animal}s per year
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Farm Display or Full Farm route */}
      <div className="mt-8 w-full max-w-4xl">
        {route === '/farm' ? (
          <FullFarm onBack={() => navigate('/')} sessionId={sessionId} />
        ) : route === '/recipes' ? (
          <RecipeLibrary 
            onBack={() => navigate('/')}
            onSelectRecipe={(meal) => {
              const formattedRecipe = formatMealForAnalyzer(meal);
              setRecipe(formattedRecipe);
            }}
          />
        ) : route === '/community' ? (
          <Community 
            onBack={() => navigate('/')}
            sessionId={sessionId}
            currentUser={user}
            onSelectRecipe={(recipeText) => setRecipe(recipeText)}
          />
          ) : route === '/nutrition' ? (
            <NutritionTracker
              onBack={() => navigate('/')}
              sessionId={sessionId}
            />
        ) : (
          <>
            {/* Random Recipe Suggestion */}
            <RandomRecipe onUseRecipe={(recipeText) => setRecipe(recipeText)} />
            
            <div className="mb-4 flex justify-end gap-2">
                <button
                  onClick={() => navigate('/nutrition')}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Nutrition 🥗
                </button>
              <button
                onClick={() => navigate('/community')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Community 👥
              </button>
              <button
                onClick={() => navigate('/recipes')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Browse Recipes 📚
              </button>
              <button
                onClick={() => navigate('/farm')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                View Full Farm
              </button>
            </div>
            <Farm
              animalCounts={totalAnimals}
              onReset={() => setTotalAnimals({})}
              sessionId={sessionId}
            />
          </>
        )}
      </div>

      <footer className="mt-10 text-gray-500 text-sm">
        Made with 💚 Vegan AI by Mo
      </footer>

      {/* Celebration Popup */}
      {savedPopup && (
        <SavedPopup
          details={savedPopup}
          onClose={() => setSavedPopup(null)}
        />
      )}
    </div>
  );
}
