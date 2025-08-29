import React, { useEffect } from 'react';
import { ChineseWord, getWordData } from '../lib/chinese-utils';

interface WordDefinitionProps {
  word: ChineseWord | null;
  isVisible: boolean;
  onClose: () => void;
  allWords?: ChineseWord[];
  currentWordIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const WordDefinition = React.memo(function WordDefinition({ 
  word, 
  isVisible, 
  onClose, 
  allWords = [], 
  currentWordIndex = -1, 
  onNavigate 
}: WordDefinitionProps) {
  // Handle click outside to dismiss
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const wordDefinitionElement = document.querySelector('[data-word-definition]');
      
      // Check if click is outside the word definition popup
      if (wordDefinitionElement && !wordDefinitionElement.contains(target)) {
        onClose();
      }
    };

    // Add event listener with a small delay to avoid immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !word) {
    return null;
  }

  const canNavigateBack = currentWordIndex > 0;
  const canNavigateForward = currentWordIndex < allWords.length - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t-2 border-amber-200 shadow-lg transform transition-transform duration-300 ease-in-out z-50">
      <div className="max-w-4xl mx-auto p-6" data-word-definition>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              {/* Chinese Word */}
              <div className="text-4xl font-bold text-gray-800">
                {word.word}
              </div>
              
              {/* Pinyin */}
              {word.pinyin && (
                <div className="text-xl text-blue-600 font-medium">
                  {word.pinyin}
                </div>
              )}
            </div>
            
            {/* English Definition */}
            {word.english && (
              <div className="text-lg text-gray-700 leading-relaxed mb-2">
                {word.english}
              </div>
            )}
            
            {/* No definition available */}
            {!word.english && (
              <div className="text-gray-500 italic mb-4">
                No definition available
              </div>
            )}
            
            {/* Character structure in plain format */}
            {word.radicals && word.radicals.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Character structure
                </div>
                <div className="space-y-2 text-sm text-gray-800">
                  {word.radicals.map((radical, radicalIndex) => {
                    const charInfo = getWordData(radical.character);
                    return (
                      <div key={radicalIndex} className="leading-relaxed">
                        <span className="text-base font-semibold mr-2">{radical.character}</span>
                        {charInfo.pinyin ? (
                          <span className="text-blue-600 mr-1">{charInfo.pinyin}</span>
                        ) : null}
                        {charInfo.english ? (
                          <span className="text-gray-600 mr-2">[{charInfo.english}]</span>
                        ) : null}
                        <span>:
                          {radical.components.map((comp, compIndex) => (
                            <span key={compIndex}>
                              {compIndex > 0 ? ' + ' : ' '}
                              <span className="font-medium">{comp.radical}</span>
                              {comp.pinyin ? <span className="text-blue-600"> {comp.pinyin}</span> : null}
                              {comp.meaning ? <span className="text-gray-600"> [{comp.meaning}]</span> : null}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close definition"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>
        
        {/* Navigation buttons */}
        {onNavigate && allWords.length > 1 && (
          <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-amber-200">
            <button
              onClick={() => onNavigate('prev')}
              disabled={!canNavigateBack}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous word"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center text-sm text-gray-600">
              {currentWordIndex + 1} of {allWords.length}
            </div>
            
            <button
              onClick={() => onNavigate('next')}
              disabled={!canNavigateForward}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Next word"
            >
              Next
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

WordDefinition.displayName = 'WordDefinition';

export default WordDefinition;
