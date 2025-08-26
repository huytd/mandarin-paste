import React from 'react';
import { ChineseWord } from '../lib/chinese-utils';

interface VocabularyListProps {
  words: ChineseWord[];
}

export default function VocabularyList({ words }: VocabularyListProps) {
  if (!words || words.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t-2 border-gray-200">
      <h2 id="vocabulary-list" className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
        <span className="text-3xl mr-3">📚</span>
        Vocabulary List
      </h2>
      <div className="text-lg text-gray-700 mb-6">Total: {words.length} words</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {words.map((wordData, index) => (
          <div
            key={`${wordData.word}-${index}`}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col space-y-2">
              {/* Chinese Word */}
              <div className="text-2xl font-bold text-gray-800">
                {wordData.word}
              </div>
              
              {/* Pinyin */}
              {wordData.pinyin && (
                <div className="text-lg text-blue-600 font-medium">
                  {wordData.pinyin}
                </div>
              )}
              
              {/* English Translation */}
              {wordData.english && (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {wordData.english}
                </div>
              )}
              
              {/* No translation available */}
              {!wordData.english && (
                <div className="text-sm text-gray-500 italic">
                  No translation available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
