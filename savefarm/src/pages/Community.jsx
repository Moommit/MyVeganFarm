import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function Community({ onBack, sessionId, currentUser, onSelectRecipe }) {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' or 'recipes'
  const [leaderboard, setLeaderboard] = useState([]);
  const [sharedRecipes, setSharedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareForm, setShowShareForm] = useState(false);
  const [shareForm, setShareForm] = useState({
    recipeName: '',
    recipeText: '',
    description: ''
  });

  useEffect(() => {
    loadCommunityData();
  }, [activeTab]);

  const loadCommunityData = async () => {
    setLoading(true);
    
    if (activeTab === 'leaderboard') {
      try {
  const response = await apiFetch('/api/community/leaderboard');
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      }
    } else if (activeTab === 'recipes') {
      try {
  const response = await apiFetch('/api/community/recipes');
        const data = await response.json();
        setSharedRecipes(data.recipes || []);
      } catch (error) {
        console.error('Error loading shared recipes:', error);
      }
    }
    
    setLoading(false);
  };

  const handleShareRecipe = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiFetch('/api/community/share-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify(shareForm),
      });

      if (response.ok) {
        setShareForm({ recipeName: '', recipeText: '', description: '' });
        setShowShareForm(false);
        loadCommunityData();
        alert('Recipe shared successfully! 🎉');
      } else {
        alert('Failed to share recipe');
      }
    } catch (error) {
      console.error('Error sharing recipe:', error);
      alert('Error sharing recipe');
    }
  };

  const handleLike = async (recipeId) => {
    try {
      const response = await apiFetch(`/api/community/like/${recipeId}`, {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
        },
      });

      if (response.ok) {
        loadCommunityData();
      }
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  };

  const handleTryRecipe = (recipeText) => {
    if (onSelectRecipe) {
      onSelectRecipe(recipeText);
      onBack();
    }
  };

  const getRankEmoji = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            👥 Community
          </h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === 'leaderboard'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === 'recipes'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📚 Shared Recipes
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-gray-600">Loading community data...</p>
          </div>
        ) : null}

        {/* Leaderboard Tab */}
        {!loading && activeTab === 'leaderboard' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Top Animal Savers 🌟
            </h2>
            
            {leaderboard.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No users yet. Be the first to save animals!
              </p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.username}
                    className={`flex items-center gap-4 p-4 rounded-lg transition ${
                      user.username === currentUser
                        ? 'bg-green-50 border-2 border-green-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-2xl font-bold w-12 text-center">
                      {getRankEmoji(index)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {user.username}
                        </h3>
                        {user.username === currentUser && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-3 mt-1 text-sm text-gray-600">
                        {Object.entries(user.animals).map(([animal, count]) => (
                          <span key={animal} className="capitalize">
                            {animal}: {count.toFixed(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {user.totalAnimals}
                      </div>
                      <div className="text-xs text-gray-500">
                        animals saved
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Shared Recipes Tab */}
        {!loading && activeTab === 'recipes' && (
          <div>
            {/* Share Recipe Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowShareForm(!showShareForm)}
                className="w-full py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
              >
                {showShareForm ? '✕ Cancel' : '+ Share Your Recipe'}
              </button>
            </div>

            {/* Share Recipe Form */}
            {showShareForm && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4">Share a Recipe</h3>
                <form onSubmit={handleShareRecipe} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recipe Name
                    </label>
                    <input
                      type="text"
                      value={shareForm.recipeName}
                      onChange={(e) => setShareForm({ ...shareForm, recipeName: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Recipe (ingredients & instructions)
                    </label>
                    <textarea
                      value={shareForm.recipeText}
                      onChange={(e) => setShareForm({ ...shareForm, recipeText: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 h-32"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={shareForm.description}
                      onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Why do you love this recipe?"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Share Recipe 🌱
                  </button>
                </form>
              </div>
            )}

            {/* Shared Recipes List */}
            {sharedRecipes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-600">
                  No shared recipes yet. Be the first to share!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedRecipes.map((recipe) => (
                  <div key={recipe.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {recipe.recipeName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          by <span className="font-semibold">{recipe.username}</span>
                          {' • '}
                          {new Date(recipe.sharedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleLike(recipe.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 rounded-full transition"
                      >
                        <span>❤️</span>
                        <span className="text-sm font-semibold">{recipe.likes || 0}</span>
                      </button>
                    </div>
                    
                    {recipe.description && (
                      <p className="text-gray-700 mb-3 italic">"{recipe.description}"</p>
                    )}
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-3 max-h-32 overflow-y-auto">
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {recipe.recipeText.slice(0, 200)}
                        {recipe.recipeText.length > 200 ? '...' : ''}
                      </pre>
                    </div>
                    
                    {recipe.animalsSaved && Object.keys(recipe.animalsSaved).length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {Object.entries(recipe.animalsSaved).map(([animal, count]) => (
                          <span key={animal} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded capitalize">
                            {animal}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleTryRecipe(recipe.recipeText)}
                      className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      Try This Recipe →
                    </button>
                    
                    {recipe.comments && recipe.comments.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Comments</h4>
                        <div className="space-y-2">
                          {recipe.comments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="text-sm bg-gray-50 p-2 rounded">
                              <span className="font-semibold">{comment.username}:</span> {comment.text}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
