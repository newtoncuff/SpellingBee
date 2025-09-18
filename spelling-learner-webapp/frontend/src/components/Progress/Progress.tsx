import React from 'react';
import './Progress.css';

interface ProgressProps {
  consecutiveCorrect: number;
}

const Progress: React.FC<ProgressProps> = ({ consecutiveCorrect }) => {
  const maxStars = 10;
  const stars = [];

  // Create array of star elements
  for (let i = 0; i < maxStars; i++) {
    const isFilled = i < consecutiveCorrect;
    const imageSrc = isFilled 
      ? 'http://localhost:5000/api/images/star.jpg'
      : 'http://localhost:5000/api/images/nostar.jpg';
    
    stars.push(
      <div key={i} className={`star ${isFilled ? 'filled' : 'empty'}`}>
        <img 
          src={imageSrc}
          alt={isFilled ? "completed star" : "incomplete star"}
          className="star-image"
        />
      </div>
    );
  }

  return (
    <div className="progress-container">
      <h3 className="progress-title">Puzzle Progress</h3>
      <div className="stars-container">
        {stars}
      </div>
      <p className="progress-text">
        {consecutiveCorrect} / {maxStars} puzzles solved in a row
      </p>
    </div>
  );
};

export default Progress;