import React from 'react';
import { SubmissionResult } from '../../types';
import './FeedbackPopup.css';

/**
 * FeedbackPopup component displays feedback to the user after a puzzle attempt.
 * 
 * @param result - Result of the submission
 * @param onNextPuzzle - Callback function to load the next puzzle
 * @param onRetry - Callback function to retry the current puzzle
 */
interface FeedbackPopupProps {
  result: SubmissionResult;
  onNextPuzzle: () => void;
  onRetry?: () => void;
}

const FeedbackPopup: React.FC<FeedbackPopupProps> = ({
  result,
  onNextPuzzle,
  onRetry
}) => {
  return (
    <>
      <div className="feedback-popup-overlay" />
      <div className={`feedback-popup ${result.correct ? 'correct' : 'incorrect'}`}>
        <h3>{result.correct ? 'Correct!' : 'Oops!'}</h3>
        <p>{result.message}</p>
        <div className="feedback-buttons">
          {!result.correct && onRetry && (
            <button className="feedback-button retry-button" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="feedback-button next-puzzle-button" onClick={onNextPuzzle}>
            Next Puzzle
          </button>
        </div>
      </div>
    </>
  );
};

export default FeedbackPopup;