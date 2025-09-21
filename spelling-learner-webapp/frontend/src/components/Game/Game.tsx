import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DifficultySelector from '../DifficultySelector/DifficultySelector';
import PuzzleWord from '../PuzzleWord/PuzzleWord';
import ImageDisplay from '../ImageDisplay/ImageDisplay';
import AlphabetSelector from '../AlphabetSelector/AlphabetSelector';
import FeedbackPopup from '../FeedbackPopup/FeedbackPopup';
import Progress from '../Progress/Progress';
import Fireworks from '../Fireworks/Fireworks';
import { DifficultyLevel, PuzzleData, LetterStatus, SubmissionResult } from '../../types';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function Game() {
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [userAnswers, setUserAnswers] = useState<LetterStatus[]>([]);
  const [currentBlankIndex, setCurrentBlankIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SubmissionResult | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [showFireworks, setShowFireworks] = useState<boolean>(false);

  // Fetch difficulty levels on mount
  useEffect(() => {
    const fetchDifficultyLevels = async () => {
      try {
        const response = await axios.get(`${API_URL}/difficulty`);
        setDifficultyLevels(response.data.levels);
      } catch (error) {
        console.error('Failed to fetch difficulty levels:', error);
      }
    };

    const fetchProgress = async () => {
      try {
        const response = await axios.get(`${API_URL}/progress?user_id=1`);
        setConsecutiveCorrect(response.data.consecutive_correct);
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };

    fetchDifficultyLevels();
    fetchProgress();
  }, []);

  const generatePuzzle = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/puzzle`, {
        params: {
          difficulty: selectedDifficulty,
          user_id: 1
        }
      });
      setPuzzle(response.data);
      
      if (response.data.puzzle) {
        const initialAnswers: LetterStatus[] = response.data.puzzle.map(
          (letter: string | null, index: number) => ({
            letter: '',
            status: 'empty',
            position: index
          })
        );
        setUserAnswers(initialAnswers);
        
        const firstBlankIndex = response.data.blank_positions[0];
        setCurrentBlankIndex(firstBlankIndex);
      }
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDifficulty]);

  // Generate new puzzle when difficulty changes
  useEffect(() => {
    if (selectedDifficulty) {
      generatePuzzle();
    }
  }, [selectedDifficulty, generatePuzzle]);

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  const findNextUnfilledBlank = (answers: LetterStatus[], blankPositions: number[], currentIndex: number) => {
    for (const pos of blankPositions) {
      if (pos > currentIndex && (!answers[pos] || answers[pos].letter === '' || answers[pos].status !== 'correct')) {
        return pos;
      }
    }
    return undefined;
  };

  const handleLetterSelect = (letter: string) => {
    if (!puzzle) return;

    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentBlankIndex] = {
      ...updatedAnswers[currentBlankIndex],
      letter: letter,
      status: 'empty'
    };
    setUserAnswers(updatedAnswers);

    const nextBlankIndex = findNextUnfilledBlank(updatedAnswers, puzzle.blank_positions, currentBlankIndex);
    if (nextBlankIndex !== undefined) {
      setCurrentBlankIndex(nextBlankIndex);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!puzzle) return;
    
    try {
      const userWord = puzzle.puzzle.map((letter: string | null, index: number) => {
        const userInput = userAnswers[index]?.letter || '';
        return letter || userInput;
      }).join('');
      
      const response = await axios.post(`${API_URL}/submit`, {
        task_id: puzzle.task_id,
        answer: userWord,
        original_word: puzzle.original_word,
        user_id: 1
      });
      
      setFeedback(response.data);
      setShowFeedback(true);
      
      // Update progress state
      setConsecutiveCorrect(response.data.consecutive_correct);
      
      // Show fireworks if celebration is triggered
      if (response.data.celebration) {
        setShowFireworks(true);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleNextPuzzle = () => {
    setShowFeedback(false);
    setFeedback(null);
    generatePuzzle();
  };

  const handleRetryPuzzle = () => {
    setShowFeedback(false);
    setFeedback(null);
    
    // Reset user answers to empty state
    if (puzzle) {
      const resetAnswers: LetterStatus[] = puzzle.puzzle.map(
        (letter: string | null, index: number) => ({
          letter: '',
          status: 'empty',
          position: index
        })
      );
      setUserAnswers(resetAnswers);
      
      // Reset to first blank position
      const firstBlankIndex = puzzle.blank_positions[0];
      setCurrentBlankIndex(firstBlankIndex);
    }
  };

  const handleFireworksComplete = () => {
    setShowFireworks(false);
  };

  const isAnswerComplete = () => {
    if (!puzzle) return false;
    return puzzle.blank_positions.every(pos => userAnswers[pos]?.letter?.length > 0);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>SpellingBee</h1>
        <p>Fill in the missing letters to complete the word!</p>
      </header>

      <main className="main-content">
        <DifficultySelector
          levels={difficultyLevels}
          selectedLevel={selectedDifficulty}
          onSelectDifficulty={handleDifficultyChange}
        />

        {isLoading && <div className="loading">Loading puzzle...</div>}

        {!isLoading && puzzle && (
          <div className="puzzle-container">
            <ImageDisplay
              imageUrl={puzzle.image_url}
              altText={puzzle.image_alt}
            />

            <PuzzleWord
              puzzle={puzzle.puzzle}
              userAnswers={userAnswers}
              currentBlankIndex={currentBlankIndex}
            />

            <AlphabetSelector onSelectLetter={handleLetterSelect} />

            <div className="submit-section">
              <button
                onClick={handleSubmitAnswer}
                disabled={!isAnswerComplete()}
                className={`submit-button ${isAnswerComplete() ? 'enabled' : 'disabled'}`}
              >
                {isAnswerComplete() ? 'GO' : 'Complete the word first'}
              </button>
            </div>

            <Progress consecutiveCorrect={consecutiveCorrect} />
          </div>
        )}

        {showFeedback && feedback && (
          <FeedbackPopup
            result={feedback}
            onNextPuzzle={handleNextPuzzle}
            onRetry={handleRetryPuzzle}
          />
        )}
      </main>

      <Fireworks 
        show={showFireworks} 
        onComplete={handleFireworksComplete} 
      />
    </div>
  );
}

export default Game;