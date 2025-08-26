import React from 'react';
import { ChineseWord } from '../lib/chinese-utils';

interface WordDefinitionProps {
  word: ChineseWord | null;
  isVisible: boolean;
  onClose: () => void;
}

export default function WordDefinition({ word, isVisible, onClose }: WordDefinitionProps) {
  if (!isVisible || !word) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-amber-50 border-t-2 border-amber-200 shadow-lg transform transition-transform duration-300 ease-in-out z-50">
      <div className="max-w-4xl mx-auto p-6">
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
              <div className="text-gray-500 italic">
                No definition available
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
      </div>
    </div>
  );
}
