import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../lib/chinese-utils';

interface FlashcardModeProps {
  words: ChineseWord[];
  isVisible: boolean;
  onClose: () => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ words, isVisible, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledWords, setShuffledWords] = useState<ChineseWord[]>([]);

  // Shuffle words when component mounts or words change
  useEffect(() => {
    if (words.length > 0) {
      const shuffled = [...words].sort(() => Math.random() - 0.5);
      setShuffledWords(shuffled);
      setCurrentIndex(0);
      setShowAnswer(false);
    }
  }, [words]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          setShowAnswer(!showAnswer);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isVisible, showAnswer, currentIndex, shuffledWords.length]);

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...shuffledWords].sort(() => Math.random() - 0.5);
    setShuffledWords(shuffled);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  if (!isVisible || shuffledWords.length === 0) {
    return null;
  }

  const currentWord = shuffledWords[currentIndex];
  const progress = ((currentIndex + 1) / shuffledWords.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-foreground/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-foreground">Flashcard Mode</h2>
            <button
              onClick={onClose}
              className="p-2 text-foreground/60 hover:text-foreground hover:bg-foreground/10 rounded-full transition-colors"
              aria-label="Close flashcards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-foreground/20 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-foreground/70 flex justify-between">
            <span>{currentIndex + 1} of {shuffledWords.length}</span>
            <button
              onClick={handleShuffle}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              🔀 Shuffle
            </button>
          </div>
        </div>

        {/* Flashcard content */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-foreground mb-6">
              {currentWord.word}
            </div>
            
            {showAnswer && (
              <div className="space-y-4 animate-fade-in">
                {currentWord.pinyin && (
                  <div className="text-2xl text-blue-600 font-medium">
                    {currentWord.pinyin}
                  </div>
                )}
                {currentWord.english && (
                  <div className="text-lg text-foreground/80 leading-relaxed max-w-md">
                    {currentWord.english}
                  </div>
                )}
                {!currentWord.english && (
                  <div className="text-foreground/50 italic">
                    No translation available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Show/Hide answer button */}
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg mb-6"
          >
            {showAnswer ? 'Hide Answer' : 'Show Answer'}
          </button>
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-foreground/20 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="text-sm text-foreground/70 text-center">
            <div>Press ← → to navigate</div>
            <div>Space to reveal answer</div>
            <div>Esc to close</div>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === shuffledWords.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardMode;