import React, { useEffect, useState } from 'react';
import './Fireworks.css';

interface FireworksProps {
  show: boolean;
  onComplete: () => void;
}

const Fireworks: React.FC<FireworksProps> = ({ show, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fireworks-overlay">
      <div className="celebration-content">
        <h1 className="celebration-title">🎉 AMAZING! 🎉</h1>
        <h2 className="celebration-subtitle">You solved 10 puzzles in a row!</h2>
        <p className="celebration-message">You're a Spelling Bee Champion! 🏆</p>
      </div>
      
      {/* Multiple fireworks */}
      <div className="firework firework-1">
        <div className="explosion"></div>
      </div>
      <div className="firework firework-2">
        <div className="explosion"></div>
      </div>
      <div className="firework firework-3">
        <div className="explosion"></div>
      </div>
      <div className="firework firework-4">
        <div className="explosion"></div>
      </div>
      <div className="firework firework-5">
        <div className="explosion"></div>
      </div>
      <div className="firework firework-6">
        <div className="explosion"></div>
      </div>
    </div>
  );
};

export default Fireworks;