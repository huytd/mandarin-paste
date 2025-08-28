import React, { useEffect } from 'react';
import { ChineseWord, getIndividualCharacterMeanings } from '../lib/chinese-utils';

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
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 dark:bg-zinc-900 border-t-2 border-amber-200 dark:border-zinc-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 max-h-[80vh] overflow-hidden">
      <div className="max-w-4xl mx-auto h-full flex flex-col" data-word-definition>
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              {/* Chinese Word */}
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {word.word}
              </div>
              
              {/* Pinyin */}
              {word.pinyin && (
                <div className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                  {word.pinyin}
                </div>
              )}
            </div>
            
            {/* English Definition */}
            {word.english && (
              <div className="text-base text-gray-700 dark:text-gray-200 leading-relaxed mb-2">
                {word.english}
              </div>
            )}
            
            {/* No definition available */}
            {!word.english && (
              <div className="text-gray-500 dark:text-gray-400 italic mb-4">
                No definition available
              </div>
            )}
            
            {/* Individual character meanings for multi-character words */}
            {word.word.length > 1 && (() => {
              const characterMeanings = getIndividualCharacterMeanings(word.word);
              // Show all characters that have pinyin or english, regardless of radical count
              const filteredMeanings = characterMeanings.filter(char => 
                char.pinyin || char.english
              );
              
              if (filteredMeanings.length > 0) {
                return (
                  <div className="mt-4 pt-4 border-t border-amber-300 dark:border-zinc-800">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                      Individual Character Meanings:
                    </div>
                                          <div className="space-y-3">
                        {filteredMeanings.map((charData, index) => {
                          // Get radical decomposition for this character
                          const radicalDecomp = word.radicals?.find(r => r.character === charData.character);
                          
                          return (
                            <div key={index}>
                              <div className="flex items-start gap-3">
                                <div className="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-[32px]">
                                  {charData.character}
                                </div>
                                <div className="flex-1">
                                  {charData.pinyin && (
                                    <div className="text-base text-blue-600 dark:text-blue-400 font-medium">
                                      {charData.pinyin}
                                    </div>
                                  )}
                                  {charData.english && (
                                    <div className="text-sm text-gray-700 dark:text-gray-200">
                                      {charData.english}
                                    </div>
                                  )}
                                  
                                  {/* Radical breakdown for this character - only show if character has multiple radicals */}
                                  {radicalDecomp && radicalDecomp.components.length > 1 && (
                                    <div className="mt-1">
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                        Radicals: {radicalDecomp.components.map((comp, compIndex) => (
                                          <span key={compIndex} className="ml-1">
                                            <span className="text-green-600 dark:text-green-400 font-medium">{comp.radical}</span>
                                            {comp.pinyin && <span className="text-blue-500 dark:text-blue-400 ml-1">({comp.pinyin})</span>}
                                            {comp.meaning && <span className="text-gray-600 dark:text-gray-300 ml-1">{comp.meaning}</span>}
                                            {compIndex < radicalDecomp.components.length - 1 && <span className="text-gray-400 dark:text-gray-500">,</span>}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Radical composition display - only show if no individual character meanings are displayed */}
            {word.radicals && word.radicals.length > 0 && (() => {
              // Check if we're showing individual character meanings
              if (word.word.length > 1) {
                const characterMeanings = getIndividualCharacterMeanings(word.word);
                const hasFilteredMeanings = characterMeanings.filter(char => 
                  char.hasMultipleRadicals && (char.pinyin || char.english)
                ).length > 0;
                
                // If we have individual character meanings, don't show separate radical section
                if (hasFilteredMeanings) {
                  return null;
                }
              }
              
              return (
              <div className="mt-4 pt-4 border-t border-amber-300 dark:border-zinc-800">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Character Structure & Radicals:
                </div>
                <div className="space-y-3">
                  {word.radicals.map((radical, radicalIndex) => (
                    <div key={radicalIndex}>
                      <div className="flex items-start gap-3">
                        <div className="text-xl font-bold text-gray-800 dark:text-gray-100 min-w-[32px]">
                          {radical.character}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Radicals: {radical.components.map((comp, compIndex) => (
                              <span key={compIndex} className="ml-1">
                                <span className="text-green-600 dark:text-green-400 font-medium">{comp.radical}</span>
                                {comp.pinyin && <span className="text-blue-500 dark:text-blue-400 ml-1">({comp.pinyin})</span>}
                                {comp.meaning && <span className="text-gray-600 dark:text-gray-300 ml-1">{comp.meaning}</span>}
                                {compIndex < radical.components.length - 1 && <span className="text-gray-400 dark:text-gray-500">,</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              );
            })()}
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-800 rounded-full transition-colors flex-shrink-0"
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
        </div>
        
        {/* Navigation buttons - fixed at bottom */}
        {onNavigate && allWords.length > 1 && (
          <div className="flex justify-center gap-4 p-4 border-t border-amber-200 dark:border-zinc-800 bg-amber-50 dark:bg-zinc-900 flex-shrink-0">
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
            
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
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
