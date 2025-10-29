import React, { useState, useEffect } from 'react';
import { getVeganMeals, getMealById, searchMeals } from '../api/recipes';

export default function RecipeLibrary({ onBack, onSelectRecipe }) {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    setLoading(true);
    const data = await getVeganMeals();
    setMeals(data);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadMeals();
      return;
    }
    setLoading(true);
    const results = await searchMeals(searchQuery);
    setMeals(results);
    setLoading(false);
  };

  const handleMealClick = async (mealId) => {
    const mealDetails = await getMealById(mealId);
    setSelectedMeal(mealDetails);
    setShowDetails(true);
  };

  const handleTryRecipe = () => {
    if (selectedMeal && onSelectRecipe) {
      onSelectRecipe(selectedMeal);
      onBack();
    }
  };

  if (showDetails && selectedMeal) {
    return (
      <div className="min-h-screen bg-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowDetails(false)}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back to Recipes
          </button>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <img
              src={selectedMeal.strMealThumb}
              alt={selectedMeal.strMeal}
              className="w-full h-64 object-cover"
            />
            
            <div className="p-6">
              <h1 className="text-3xl font-bold text-green-700 mb-2">
                {selectedMeal.strMeal}
              </h1>
              
              <div className="flex gap-4 mb-4 text-sm text-gray-600">
                <span className="bg-green-100 px-3 py-1 rounded-full">
                  🌱 {selectedMeal.strCategory}
                </span>
                <span className="bg-blue-100 px-3 py-1 rounded-full">
                  🌍 {selectedMeal.strArea}
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Ingredients</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((i) => {
                    const ingredient = selectedMeal[`strIngredient${i}`];
                    const measure = selectedMeal[`strMeasure${i}`];
                    if (ingredient && ingredient.trim()) {
                      return (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{measure} {ingredient}</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Instructions</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedMeal.strInstructions}
                </p>
              </div>

              {selectedMeal.strYoutube && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Video Tutorial</h2>
                  <a
                    href={selectedMeal.strYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Watch on YouTube →
                  </a>
                </div>
              )}

              <button
                onClick={handleTryRecipe}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition font-semibold"
              >
                Analyze This Recipe 🧠
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            🌱 Vegan Recipe Library
          </h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vegan recipes..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={loadMeals}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </form>

        {/* Recipe Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🌱</div>
            <p className="text-gray-600">Loading delicious vegan recipes...</p>
          </div>
        ) : meals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">😔</div>
            <p className="text-gray-600">No recipes found. Try a different search!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => (
              <div
                key={meal.idMeal}
                onClick={() => handleMealClick(meal.idMeal)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              >
                <img
                  src={meal.strMealThumb}
                  alt={meal.strMeal}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {meal.strMeal}
                  </h3>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="bg-green-100 px-2 py-1 rounded">
                      🌱 Vegan
                    </span>
                    <span className="text-green-600 hover:text-green-700">
                      View Recipe →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
