import React, { useState } from 'react';
import { getRandomVeganMeal, formatMealForAnalyzer } from '../api/recipes';

export function RandomRecipe({ onUseRecipe }) {
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandomMeal = async () => {
    setLoading(true);
    const randomMeal = await getRandomVeganMeal();
    setMeal(randomMeal);
    setLoading(false);
  };

  const handleUseRecipe = () => {
    if (meal && onUseRecipe) {
      const formattedRecipe = formatMealForAnalyzer(meal);
      onUseRecipe(formattedRecipe);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-700">
          🎲 Random Vegan Recipe
        </h2>
        <button
          onClick={fetchRandomMeal}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Random Recipe'}
        </button>
      </div>

      {meal && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex gap-4">
            <img
              src={meal.strMealThumb}
              alt={meal.strMeal}
              className="w-32 h-32 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {meal.strMeal}
              </h3>
              <div className="flex gap-2 mb-3 text-sm">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  🌱 {meal.strCategory}
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  🌍 {meal.strArea}
                </span>
              </div>
              <button
                onClick={handleUseRecipe}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
              >
                Use This Recipe →
              </button>
            </div>
          </div>
        </div>
      )}

      {!meal && !loading && (
        <p className="text-gray-600 text-center py-4">
          Click the button to discover a random vegan recipe! 🌟
        </p>
      )}
    </div>
  );
}
