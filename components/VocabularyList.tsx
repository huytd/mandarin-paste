import React from 'react';
import { ChineseWord } from '../lib/chinese-utils';

interface VocabularyListProps {
  words: ChineseWord[];
  onWordClick?: (word: ChineseWord) => void;
  onStartFlashcards?: () => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ words, onWordClick, onStartFlashcards }) => {
  if (!words || words.length === 0) {
    return null;
  }

  return (
    <div className="bg-background rounded-lg shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Vocabulary ({words.length} words)
        </h2>
        {onStartFlashcards && (
          <button
            onClick={onStartFlashcards}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          >
            🃏 Start Flashcards
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {words.map((word, index) => (
          <div
            key={`${word.word}-${index}`}
            className={`p-4 border border-foreground/20 rounded-lg hover:bg-foreground/5 transition-colors ${
              onWordClick ? 'cursor-pointer' : ''
            }`}
            onClick={() => onWordClick?.(word)}
          >
            <div className="text-2xl font-bold text-foreground mb-2">
              {word.word}
            </div>
            {word.pinyin && (
              <div className="text-blue-600 font-medium mb-2">
                {word.pinyin}
              </div>
            )}
            {word.english && (
              <div className="text-foreground/80 text-sm leading-relaxed mb-2">
                {word.english}
              </div>
            )}
            {/* Radical composition display */}
            {word.radicals && word.radicals.length > 0 && (
              <div className="border-t border-foreground/10 pt-2 mt-2">
                <div className="text-xs text-foreground/60 mb-1">Radicals:</div>
                <div className="flex flex-wrap gap-2">
                  {word.radicals.map((radical, radicalIndex) => (
                    <div key={radicalIndex} className="text-sm border border-green-200 rounded px-2 py-1 bg-green-50">
                      <div className="font-medium text-foreground/70 mb-1">
                        {radical.character}:
                      </div>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {radical.components.map((comp, compIndex) => (
                          <span key={compIndex} className="text-green-700">
                            {comp.radical}
                            {comp.pinyin && (
                              <span className="text-blue-500 ml-1">({comp.pinyin})</span>
                            )}
                            {comp.meaning && (
                              <span className="text-gray-600 ml-1">[{comp.meaning}]</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!word.english && (
              <div className="text-foreground/50 text-sm italic">
                No translation available
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VocabularyList;