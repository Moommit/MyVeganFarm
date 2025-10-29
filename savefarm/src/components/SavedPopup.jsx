import { useEffect } from 'react';

// Popup component for celebrating saved animals
export function SavedPopup({ details, onClose }) {
  useEffect(() => {
    // Play celebration sound when popup appears
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.5; // Set volume to 50%
    audio.play().catch(err => console.log('Audio playback failed:', err));

    // Auto-close after 3 seconds
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white rounded-xl p-6 shadow-2xl transform scale-100 transition-transform relative z-10 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-green-600 mb-4">🎉 Animals Saved! 🌱</h3>
          <div className="space-y-2 mb-4">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-4 bg-green-50 rounded-lg">
                <span className="capitalize">{detail.animal}:</span>
                <span className="font-bold text-green-700">+{parseFloat(detail.yearly_impact).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 italic">Keep up the great work! 💚</p>
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}