import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import cowImage from '../assets/animals/cow.svg';
import chickenImage from '../assets/animals/chicken.svg';
import pigImage from '../assets/animals/pig.svg';
import fishImage from '../assets/animals/fish.svg';

const ANIMAL_IMAGES = {
  cow: cowImage,
  chicken: chickenImage,
  pig: pigImage,
  fish: fishImage
};

// Utility to get whole number of animals to display
const getWholeAnimals = (number) => Math.floor(number);

// Farm display component
export function Farm({ animalCounts, onReset, sessionId }) {
  const [animals, setAnimals] = useState([]);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset your farm? All animals will be removed.')) {
      setIsResetting(true);
      try {
        await apiFetch('/api/animals/reset', {
          method: 'POST',
          headers: {
            'x-session-id': sessionId,
          },
        });
        onReset?.(); // Notify parent component
      } catch (err) {
        console.error('Error resetting farm:', err);
      }
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (!animalCounts) return;

    // Convert animal counts to arrays of animals to display
    const allAnimals = Object.entries(animalCounts).flatMap(([animal, count]) => {
      const wholeCount = getWholeAnimals(count);
      return Array(wholeCount).fill({ type: animal });
    });

    setAnimals(allAnimals);
  }, [animalCounts]);

  return (
    <div className="farm-container p-4 bg-green-100 rounded-lg min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Animal Sanctuary</h2>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {isResetting ? 'Resetting...' : 'Reset Farm'}
        </button>
      </div>
      
      {/* Stats Section */}
      <div className="mb-6 bg-gradient-to-b from-green-50 to-white rounded-xl p-6 shadow-md border border-green-100">
        <h3 className="text-xl font-bold mb-4 text-green-800">🌱 Animals Saved So Far</h3>
        <div className="space-y-3">
          {Object.entries(animalCounts || {}).map(([animal, count]) => (
            <div key={animal} className="flex justify-between items-center p-2 hover:bg-green-50 rounded-lg transition-colors">
              <span className="capitalize flex items-center gap-2">
                <span className="w-6 h-6">
                  <img src={ANIMAL_IMAGES[animal]} alt={animal} className="w-full h-full object-contain" />
                </span>
                {animal}s:
              </span>
              <span className="font-semibold text-green-700">{count.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex justify-between items-center font-bold text-lg text-green-800">
            <span>Total Animals:</span>
            <span>{Object.values(animalCounts || {}).reduce((a, b) => a + b, 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Farm grid - Shows whole numbers as icons */}
      <div className="grid grid-cols-4 gap-4 md:grid-cols-6 lg:grid-cols-8">
        {animals.map((animal, index) => (
          <div key={index} className="relative group">
            <img
              src={ANIMAL_IMAGES[animal.type]}
              alt={animal.type}
              className="w-16 h-16 transition-transform hover:scale-110"
            />
            <span className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-sm transition-opacity">
              {animal.type}
            </span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {(!animalCounts || Object.keys(animalCounts).length === 0) && (
        <div className="text-center text-gray-500 mt-8">
          No animals saved yet. Try veganizing some recipes!
        </div>
      )}
    </div>
  );
}