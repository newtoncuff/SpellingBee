import React from 'react';
import { render, screen } from '@testing-library/react';
import PuzzleWord from '../PuzzleWord';
import { LetterStatus } from '../../../types';

describe('PuzzleWord Component', () => {
  test('renders puzzle word with blanks', () => {
    const puzzle: (string | null)[] = ['c', null, 't'];
    const userAnswers: LetterStatus[] = [
      { letter: 'c', status: 'empty', position: 0 },
      { letter: '', status: 'empty', position: 1 },
      { letter: 't', status: 'empty', position: 2 }
    ];
    const currentBlankIndex = 1;

    render(
      <PuzzleWord
        puzzle={puzzle}
        userAnswers={userAnswers}
        currentBlankIndex={currentBlankIndex}
      />
    );

    // Check if the letters are displayed
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.getByText('_')).toBeInTheDocument();
    expect(screen.getByText('t')).toBeInTheDocument();
  });

  test('renders correct status for answered letters', () => {
    const puzzle: (string | null)[] = ['c', null, 't'];
    const userAnswers: LetterStatus[] = [
      { letter: 'c', status: 'empty', position: 0 },
      { letter: 'a', status: 'correct', position: 1 },
      { letter: 't', status: 'empty', position: 2 }
    ];
    const currentBlankIndex = 1;

    render(
      <PuzzleWord
        puzzle={puzzle}
        userAnswers={userAnswers}
        currentBlankIndex={currentBlankIndex}
      />
    );

    // Check for correct letter
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  test('renders incorrect status for wrong letters', () => {
    const puzzle: (string | null)[] = ['c', null, 't'];
    const userAnswers: LetterStatus[] = [
      { letter: 'c', status: 'empty', position: 0 },
      { letter: 'x', status: 'incorrect', position: 1 },
      { letter: 't', status: 'empty', position: 2 }
    ];
    const currentBlankIndex = 1;

    render(
      <PuzzleWord
        puzzle={puzzle}
        userAnswers={userAnswers}
        currentBlankIndex={currentBlankIndex}
      />
    );

    // Check for incorrect letter
    expect(screen.getByText('x')).toBeInTheDocument();
  });
});