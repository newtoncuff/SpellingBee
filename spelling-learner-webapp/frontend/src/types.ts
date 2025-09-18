/**
 * Types for the SpellingBee application
 */

export interface DifficultyLevel {
  id: string;
  name: string;
}

export interface PuzzleData {
  task_id: number;
  puzzle: (string | null)[];
  original_word: string;
  image_url: string;
  image_alt: string;
  blank_positions: number[];
}

export interface LetterStatus {
  letter: string;
  status: 'empty' | 'correct' | 'incorrect';
  position: number;
}

export interface SubmissionResult {
  correct: boolean;
  message: string;
  consecutive_correct: number;
  celebration: boolean;
}

export interface UserStats {
  overall: {
    total: number;
    completed: number;
    correct: number;
  };
  by_difficulty: {
    difficulty: string;
    total: number;
    completed: number;
    correct: number;
  }[];
}