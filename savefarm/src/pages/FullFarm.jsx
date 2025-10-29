import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import cowImage from '../assets/animals/cow.svg';
import chickenImage from '../assets/animals/chicken.svg';
import pigImage from '../assets/animals/pig.svg';
import fishImage from '../assets/animals/fish.svg';
import farmBg from '../assets/backgrounds/farm.jpg';

const IMAGES = {
  cow: cowImage,
  chicken: chickenImage,
  pig: pigImage,
  fish: fishImage,
};

const getWhole = n => Math.floor(n || 0);

function RandomPos({ index, children, area, zone }) {
  // Generate positions based on index and designated zones
  const seed = (index * 9301 + 49297) % 233280;
  const rnd = (seed / 233280);
  
  // Define zone boundaries
  const zones = {
    fish: { x: [65, 85], y: [60, 85] }, // Moved fish to bottom right
    cow: { x: [40, 60], y: [60, 80] },
    chicken: { x: [35, 55], y: [55, 75] },
    pig: { x: [15, 35], y: [50, 70] }
  };

  const zoneRange = zones[zone];
  const left = zoneRange.x[0] + (rnd * (zoneRange.x[1] - zoneRange.x[0]));
  const top = zoneRange.y[0] + ((1 - rnd) * (zoneRange.y[1] - zoneRange.y[0]));
  
  // More random delays and durations based on both seed and index
  const delay = ((rnd * 5) + (index * 1.3) % 4).toFixed(2);
  const dur = (10 + ((seed % 7) * 2)).toFixed(2);

  const style = {
    position: 'absolute',
    left: `${left}%`,
    top: `${top}%`,
    transform: 'translate(-50%, -50%)',
    '--delay': `${delay}s`,
    '--duration': `${dur}s`,
    zIndex: Math.floor(top)
  };

  const cls = `animal ${area}`;
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export default function FullFarm({ onBack, sessionId }) {
  const [animalCounts, setAnimalCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await apiFetch('/api/animals', {
          headers: {
            'x-session-id': sessionId,
          },
        });
        const data = await res.json();
        if (mounted) setAnimalCounts(data.animals || {});
      } catch (err) {
        console.error('Failed to load animals for full farm', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [sessionId]);

  // Build arrays of animals for each area
  const cows = Array.from({ length: getWhole(animalCounts.cow) });
  const chickens = Array.from({ length: getWhole(animalCounts.chicken) });
  const fishes = Array.from({ length: getWhole(animalCounts.fish) });
  const pigs = Array.from({ length: getWhole(animalCounts.pig) });

  return (
    <div className="min-h-screen p-6 bg-sky-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-green-700">🌾 Your Full Farm</h1>
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white border rounded shadow hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Farm layout with background image */}
        <div className="relative w-full h-[520px] rounded-xl overflow-hidden shadow-lg">
          {/* Background image */}
          <img src={farmBg} alt="farm background" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
          
          {/* Animals container */}
          <div className="relative w-full h-full">
            {/* Fish in the right corner pond */}
            {fishes.map((_, i) => (
              <RandomPos key={`fish-${i}`} index={i + 301} area="swim" zone="fish">
                <img src={IMAGES.fish} alt="fish" className="w-16 h-16" />
              </RandomPos>
            ))}
            
            {/* Cows in the middle-bottom */}
            {cows.map((_, i) => (
              <RandomPos key={`cow-${i}`} index={i + 1} area="roam" zone="cow">
                <img src={IMAGES.cow} alt="cow" className="w-24 h-24" />
              </RandomPos>
            ))}
            
            {/* Chickens near the cows */}
            {chickens.map((_, i) => (
              <RandomPos key={`ch-${i}`} index={i + 201} area="peck" zone="chicken">
                <img src={IMAGES.chicken} alt="chicken" className="w-16 h-16" />
              </RandomPos>
            ))}
            
            {/* Pigs to the left of cows and chickens */}
            {pigs.map((_, i) => (
              <RandomPos key={`pig-${i}`} index={i + 101} area="roam" zone="pig">
                <img src={IMAGES.pig} alt="pig" className="w-20 h-20" />
              </RandomPos>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white p-4 rounded shadow">
          {loading ? (
            <div>Loading animals…</div>
          ) : (
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex gap-2 items-center">
                <img src={cowImage} alt="cow" className="w-8 h-8" />
                <span className="font-semibold">Cows: {(animalCounts.cow || 0).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 items-center">
                <img src={chickenImage} alt="chicken" className="w-8 h-8" />
                <span className="font-semibold">Chickens: {(animalCounts.chicken || 0).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 items-center">
                <img src={pigImage} alt="pig" className="w-8 h-8" />
                <span className="font-semibold">Pigs: {(animalCounts.pig || 0).toFixed(2)}</span>
              </div>
              <div className="flex gap-2 items-center">
                <img src={fishImage} alt="fish" className="w-8 h-8" />
                <span className="font-semibold">Fish: {(animalCounts.fish || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
