import React from 'react';
import { ChineseWord, getWordData } from '../lib/chinese-utils';

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
            {/* Radical composition display (plain style) */}
            {word.radicals && word.radicals.length > 0 && (
              <div className="border-t border-foreground/10 pt-2 mt-2">
                <div className="text-xs text-foreground/60 mb-1">Character structure</div>
                <div className="space-y-1 text-sm text-foreground">
                  {word.radicals.map((radical, radicalIndex) => {
                    const charInfo = getWordData(radical.character);
                    return (
                      <div key={radicalIndex} className="leading-relaxed">
                        <span className="font-semibold mr-2">{radical.character}</span>
                        {charInfo.pinyin ? (
                          <span className="text-blue-600 mr-1">{charInfo.pinyin}</span>
                        ) : null}
                        {charInfo.english ? (
                          <span className="text-foreground/70 mr-2">[{charInfo.english}]</span>
                        ) : null}
                        <span>:
                          {radical.components.map((comp, compIndex) => (
                            <span key={compIndex}>
                              {compIndex > 0 ? ' + ' : ' '}
                              <span className="font-medium">{comp.radical}</span>
                              {comp.pinyin ? <span className="text-blue-600"> {comp.pinyin}</span> : null}
                              {comp.meaning ? <span className="text-foreground/70"> [{comp.meaning}]</span> : null}
                            </span>
                          ))}
                        </span>
                      </div>
                    );
                  })}
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