import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import DifficultySelector from './components/DifficultySelector/DifficultySelector';
import PuzzleWord from './components/PuzzleWord/PuzzleWord';
import ImageDisplay from './components/ImageDisplay/ImageDisplay';
import AlphabetSelector from './components/AlphabetSelector/AlphabetSelector';
import FeedbackPopup from './components/FeedbackPopup/FeedbackPopup';
import { DifficultyLevel, PuzzleData, LetterStatus, SubmissionResult } from './types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy');
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [userAnswers, setUserAnswers] = useState<LetterStatus[]>([]);
  const [currentBlankIndex, setCurrentBlankIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SubmissionResult | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

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

    fetchDifficultyLevels();
  }, []);

  // Fetch a new puzzle when difficulty changes
  useEffect(() => {
    fetchNewPuzzle();
  }, [selectedDifficulty]);

  const fetchNewPuzzle = async () => {
    setIsLoading(true);
    setUserAnswers([]);
    setCurrentBlankIndex(0);
    setShowFeedback(false);
    setFeedback(null);

    try {
      const response = await axios.get(`${API_URL}/puzzle`, {
        params: {
          difficulty: selectedDifficulty,
          user_id: 1 // Using default user for now
        }
      });
      setPuzzle(response.data);
      
      // Initialize user answers array - only for blank positions, visible letters handled by puzzle
      if (response.data.puzzle) {
        const initialAnswers: LetterStatus[] = response.data.puzzle.map(
          (letter: string | null, index: number) => ({
            letter: '', // Always start empty - user will fill blanks, visible letters come from puzzle
            status: 'empty',
            position: index
          })
        );
        setUserAnswers(initialAnswers);
        
        // Find the first blank position (should always be the first one in the array)
        const firstBlankIndex = response.data.blank_positions[0];
        setCurrentBlankIndex(firstBlankIndex);
        
        console.log('DEBUG: Initialized with blank positions:', response.data.blank_positions);
        console.log('DEBUG: Starting with currentBlankIndex:', firstBlankIndex);
      }
    } catch (error) {
      console.error('Failed to fetch puzzle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
  };

  // Helper function to find the next unfilled blank
  const findNextUnfilledBlank = (answers: LetterStatus[], blankPositions: number[], currentIndex: number) => {
    // First, check if there are any unfilled blanks after the current position
    for (const pos of blankPositions) {
      if (pos > currentIndex && (!answers[pos] || answers[pos].letter === '' || answers[pos].status !== 'correct')) {
        return pos;
      }
    }
    // If no unfilled blanks after current position, return undefined (all filled)
    return undefined;
  };

  const handleLetterSelect = (letter: string) => {
    console.log(`DEBUG: handleLetterSelect called with letter "${letter}"`);
    console.log(`DEBUG: currentBlankIndex = ${currentBlankIndex}`);
    console.log(`DEBUG: puzzle?.blank_positions =`, puzzle?.blank_positions);
    console.log(`DEBUG: showFeedback = ${showFeedback}`);
    
    if (!puzzle || currentBlankIndex === undefined || showFeedback) {
      console.log('DEBUG: Exiting early - puzzle, currentBlankIndex, or showFeedback issue');
      return;
    }
    
    // Create a copy of user answers
    const updatedAnswers = [...userAnswers];
    const correctLetter = puzzle.original_word[currentBlankIndex];
    
    // Check if the selected letter is correct
    const isCorrect = letter.toLowerCase() === correctLetter.toLowerCase();
    
    // Update the current blank with the selected letter
    updatedAnswers[currentBlankIndex] = {
      letter: letter,
      status: isCorrect ? 'correct' : 'incorrect',
      position: currentBlankIndex
    };
    
    console.log(`DEBUG: User typed "${letter}" at position ${currentBlankIndex}, isCorrect: ${isCorrect}`);
    console.log('DEBUG: Updated userAnswers:', updatedAnswers);
    
    setUserAnswers(updatedAnswers);
    
    if (isCorrect) {
      // Find the next unfilled blank position
      const nextBlankIndex = findNextUnfilledBlank(updatedAnswers, puzzle.blank_positions, currentBlankIndex);
      
      if (nextBlankIndex !== undefined) {
        // Move to the next blank
        setCurrentBlankIndex(nextBlankIndex);
        console.log(`DEBUG: Moving to next blank at position ${nextBlankIndex}`);
      } else {
        // All blanks are filled correctly, submit the answer
        console.log('DEBUG: All blanks filled correctly, submitting answer');
        handleSubmitAnswer(updatedAnswers); // Pass the updated answers directly
      }
    } else {
      // If incorrect, clear the letter after 2 seconds and stay on the same blank
      setTimeout(() => {
        const clearedAnswers = [...updatedAnswers];
        clearedAnswers[currentBlankIndex] = {
          letter: '',
          status: 'empty',
          position: currentBlankIndex
        };
        setUserAnswers(clearedAnswers);
        // Stay on the same blank - don't change currentBlankIndex
      }, 2000);
    }
  };

  const handleSubmitAnswer = async (answersToUse?: LetterStatus[]) => {
    if (!puzzle) return;
    
    // Use provided answers or current state
    const answersArray = answersToUse || userAnswers;
    
    try {
      // Debug logging
      console.log('DEBUG: puzzle.puzzle:', puzzle.puzzle);
      console.log('DEBUG: userAnswers full array:', answersArray);
      console.log('DEBUG: puzzle.blank_positions:', puzzle.blank_positions);
      
      // Build the complete word by combining original puzzle structure with user input
      const userWord = puzzle.puzzle.map((letter: string | null, index: number) => {
        const userInput = answersArray[index]?.letter || '';
        const result = letter || userInput;
        console.log(`DEBUG: Position ${index}: puzzle="${letter}", userInput="${userInput}", result="${result}"`);
        return result;
      }).join('');
      
      console.log('Submitting word:', userWord);
      console.log('Original word:', puzzle.original_word);
      
      const response = await axios.post(`${API_URL}/submit`, {
        task_id: puzzle.task_id,
        answer: userWord,
        original_word: puzzle.original_word
      });
      
      setFeedback(response.data);
      setShowFeedback(true);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleNextPuzzle = () => {
    fetchNewPuzzle();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>SpellingBee</h1>
        <DifficultySelector 
          levels={difficultyLevels} 
          selectedLevel={selectedDifficulty}
          onSelectDifficulty={handleDifficultyChange}
        />
      </header>
      
      <main className="App-main">
        {isLoading ? (
          <div className="loading">Loading puzzle...</div>
        ) : puzzle ? (
          <>
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
            
            {showFeedback && feedback && (
              <FeedbackPopup 
                result={feedback} 
                onNextPuzzle={handleNextPuzzle}
              />
            )}
          </>
        ) : (
          <div className="no-puzzle">No puzzle available. Please try again.</div>
        )}
      </main>
    </div>
  );
}

export default App;