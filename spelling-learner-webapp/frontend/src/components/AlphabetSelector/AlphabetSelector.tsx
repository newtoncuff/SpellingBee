import React, { useMemo } from 'react';
import './AlphabetSelector.css';

/**
 * AlphabetSelector component displays an alphabet of letters for the user to select.
 * All letters are white with colorful borders and remain selectable even after being used.
 * 
 * @param onSelectLetter - Callback function when a letter is selected
 */
interface AlphabetSelectorProps {
  onSelectLetter: (letter: string) => void;
}

const AlphabetSelector: React.FC<AlphabetSelectorProps> = ({
  onSelectLetter
}) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  
  // Generate random colors for each letter (memoized to keep colors consistent)
  const letterColors = useMemo(() => {
    const colors = [
      '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
      '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#e91e63',
      '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4',
      '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
    ];
    
    return alphabet.reduce((acc, letter, index) => {
      acc[letter] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>);
  }, [alphabet]);

  return (
    <div className="alphabet-selector">
      <h3>Select a letter:</h3>
      <div className="letters-container">
        {alphabet.map((letter) => (
          <button
            key={letter}
            className="letter-button"
            style={{ borderColor: letterColors[letter] }}
            onClick={() => onSelectLetter(letter)}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AlphabetSelector;