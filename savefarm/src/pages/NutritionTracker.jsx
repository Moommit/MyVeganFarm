import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export default function NutritionTracker({ onBack, sessionId }) {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'history', 'goals'
  const [todayLogs, setTodayLogs] = useState([]);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    mealName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: ''
  });

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load today's logs
      const logsResponse = await apiFetch(
        `/api/nutrition/logs?startDate=${today}&endDate=${today}`,
        {
          headers: { 'x-session-id': sessionId },
        }
      );
      const logsData = await logsResponse.json();
      setTodayLogs(logsData.logs[today] || []);

      // Load goals
      const goalsResponse = await apiFetch('/api/nutrition/goals', {
        headers: { 'x-session-id': sessionId },
      });
      const goalsData = await goalsResponse.json();
      setGoals(goalsData.goals);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
    setLoading(false);
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    
    const nutrition = {
      calories: parseFloat(newMeal.calories) || 0,
      protein: parseFloat(newMeal.protein) || 0,
      carbs: parseFloat(newMeal.carbs) || 0,
      fat: parseFloat(newMeal.fat) || 0,
      fiber: parseFloat(newMeal.fiber) || 0,
    };

    try {
      const response = await apiFetch('/api/nutrition/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({
          date: today,
          mealName: newMeal.mealName,
          nutrition,
        }),
      });

      if (response.ok) {
        setNewMeal({ mealName: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
        setShowAddMeal(false);
        loadData();
      }
    } catch (error) {
      console.error('Error adding meal:', error);
    }
  };

  const handleDeleteMeal = async (logId) => {
    if (!confirm('Delete this meal entry?')) return;

    try {
      const response = await apiFetch(`/api/nutrition/log/${today}/${logId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': sessionId },
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  const calculateTotals = () => {
    return todayLogs.reduce(
      (totals, log) => ({
        calories: totals.calories + (log.nutrition.calories || 0),
        protein: totals.protein + (log.nutrition.protein || 0),
        carbs: totals.carbs + (log.nutrition.carbs || 0),
        fat: totals.fat + (log.nutrition.fat || 0),
        fiber: totals.fiber + (log.nutrition.fiber || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  };

  const getProgressColor = (value, goal) => {
    const percentage = (value / goal) * 100;
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressPercentage = (value, goal) => {
    return Math.min((value / goal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🥗</div>
          <p className="text-gray-600">Loading nutrition data...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-green-700">
            🥗 Nutrition Tracker
          </h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>

        {/* Date Display */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {new Date(today).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>

        {/* Nutrition Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[
            { key: 'calories', label: 'Calories', unit: 'kcal', icon: '🔥' },
            { key: 'protein', label: 'Protein', unit: 'g', icon: '💪' },
            { key: 'carbs', label: 'Carbs', unit: 'g', icon: '🌾' },
            { key: 'fat', label: 'Fat', unit: 'g', icon: '🥑' },
            { key: 'fiber', label: 'Fiber', unit: 'g', icon: '🌿' },
          ].map(({ key, label, unit, icon }) => (
            <div key={key} className="bg-white rounded-xl shadow-md p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm text-gray-600 mb-1">{label}</div>
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {totals[key].toFixed(0)}
                <span className="text-sm text-gray-500"> / {goals[key]}{unit}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${getProgressColor(totals[key], goals[key])}`}
                  style={{ width: `${getProgressPercentage(totals[key], goals[key])}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Vegan-Critical Nutrients Warning */}
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Vegan Nutrients</h3>
          <p className="text-sm text-yellow-700 mb-2">
            Make sure you're getting enough of these critical nutrients:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="bg-white p-2 rounded">
              <strong>B12:</strong> {goals.vitaminB12}mcg/day
            </div>
            <div className="bg-white p-2 rounded">
              <strong>Iron:</strong> {goals.iron}mg/day
            </div>
            <div className="bg-white p-2 rounded">
              <strong>Omega-3:</strong> {goals.omega3}g/day
            </div>
            <div className="bg-white p-2 rounded">
              <strong>Calcium:</strong> {goals.calcium}mg/day
            </div>
          </div>
        </div>

        {/* Add Meal Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddMeal(!showAddMeal)}
            className="w-full py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold"
          >
            {showAddMeal ? '✕ Cancel' : '+ Log a Meal'}
          </button>
        </div>

        {/* Add Meal Form */}
        {showAddMeal && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Log Your Meal</h3>
            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meal Name</label>
                <input
                  type="text"
                  value={newMeal.mealName}
                  onChange={(e) => setNewMeal({ ...newMeal, mealName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Breakfast, Lunch, Snack"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    type="number"
                    value={newMeal.calories}
                    onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={newMeal.protein}
                    onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={newMeal.carbs}
                    onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={newMeal.fat}
                    onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    value={newMeal.fiber}
                    onChange={(e) => setNewMeal({ ...newMeal, fiber: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Save Meal
              </button>
            </form>
          </div>
        )}

        {/* Today's Meals */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Today's Meals</h3>
          
          {todayLogs.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No meals logged yet today. Start tracking your nutrition! 📝
            </p>
          ) : (
            <div className="space-y-3">
              {todayLogs.map((log) => (
                <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{log.mealName}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(log.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Cal:</span>
                      <span className="font-semibold ml-1">{log.nutrition.calories}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-semibold ml-1">{log.nutrition.protein}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="font-semibold ml-1">{log.nutrition.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fat:</span>
                      <span className="font-semibold ml-1">{log.nutrition.fat}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fiber:</span>
                      <span className="font-semibold ml-1">{log.nutrition.fiber}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
