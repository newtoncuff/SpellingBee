import React from 'react';
import { DifficultyLevel } from '../../types';
import './DifficultySelector.css';

/**
 * DifficultySelector component allows users to choose a difficulty level for the puzzles.
 * 
 * @param levels - Array of available difficulty levels
 * @param selectedLevel - Current selected difficulty level ID
 * @param onSelectDifficulty - Callback function when a difficulty is selected
 */
interface DifficultySelectorProps {
  levels: DifficultyLevel[];
  selectedLevel: string;
  onSelectDifficulty: (difficulty: string) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  levels,
  selectedLevel,
  onSelectDifficulty
}) => {
  return (
    <div className="difficulty-selector">
      <h2>Select Difficulty</h2>
      <div className="difficulty-buttons">
        {levels.map((level) => (
          <button
            key={level.id}
            className={`difficulty-button ${selectedLevel === level.id ? 'selected' : ''}`}
            onClick={() => onSelectDifficulty(level.id)}
          >
            {level.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DifficultySelector;