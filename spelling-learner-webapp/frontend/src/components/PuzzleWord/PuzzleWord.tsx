import React from 'react';
import { LetterStatus } from '../../types';
import './PuzzleWord.css';

/**
 * PuzzleWord component displays the word with blanks to be filled.
 * 
 * @param puzzle - Array of letters or nulls representing the puzzle
 * @param userAnswers - Array of user's answers with status
 * @param currentBlankIndex - The index of the current blank to be filled
 */
interface PuzzleWordProps {
  puzzle: (string | null)[];
  userAnswers: LetterStatus[];
  currentBlankIndex: number;
}

const PuzzleWord: React.FC<PuzzleWordProps> = ({
  puzzle,
  userAnswers,
  currentBlankIndex
}) => {
  console.log('DEBUG PuzzleWord: currentBlankIndex =', currentBlankIndex);
  console.log('DEBUG PuzzleWord: puzzle =', puzzle);
  
  return (
    <div className="puzzle-word">
      {puzzle.map((letter, index) => {
        const isBlank = letter === null;
        const userAnswer = userAnswers[index];
        const isCurrentBlank = index === currentBlankIndex;
        
        let letterClassName = 'letter';
        if (isBlank) {
          letterClassName += ' blank';
          if (isCurrentBlank) {
            letterClassName += ' current';
          }
        }
        
        if (userAnswer && userAnswer.letter) {
          if (userAnswer.status === 'correct') {
            letterClassName += ' correct';
          } else if (userAnswer.status === 'incorrect') {
            letterClassName += ' incorrect';
          }
        }
        
        return (
          <div key={index} className={letterClassName}>
            {isBlank ? (
              userAnswer?.letter || '_'
            ) : (
              letter
            )}
            {userAnswer?.status === 'correct' && (
              <span className="check-mark">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PuzzleWord;