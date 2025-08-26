"use client";

import React from 'react';
import { ChineseWord } from '../lib/chinese-utils';

interface ParagraphBreakdownProps {
  words: ChineseWord[] | null;
  isVisible: boolean;
  onClose: () => void;
  onWordClick?: (word: ChineseWord, index: number) => void;
}

export default function ParagraphBreakdown({ words, isVisible, onClose, onWordClick }: ParagraphBreakdownProps) {
  if (!isVisible || !words || words.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/5"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl rounded-t-2xl bg-amber-50 border-t-2 border-amber-200 shadow-2xl z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-amber-200" />
          <div className="flex items-start justify-between">
            <div className="text-base font-semibold text-gray-800">Paragraph breakdown</div>
            <button
              onClick={onClose}
              className="-mr-2 rounded-full p-2 text-gray-500 hover:bg-amber-100 hover:text-gray-800 transition-colors"
              aria-label="Close breakdown"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-6 pb-4 max-h-[30vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {words.map((item, index) => (
              <div
                key={`pb-${index}-${item.word}`}
                className="rounded-xl border border-amber-200 bg-white/70 backdrop-blur-sm p-2 sm:p-3 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => onWordClick?.(item, index)}
                onPointerUp={() => onWordClick?.(item, index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onWordClick?.(item, index);
                  }
                }}
                aria-label={`Highlight ${item.word}`}
              >
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight mb-0.5">
                  {item.word}
                </div>
                {item.pinyin && (
                  <div className="text-sm sm:text-base text-blue-700 font-medium mb-0.5 leading-tight">
                    {item.pinyin}
                  </div>
                )}
                <div className="text-xs sm:text-sm text-gray-700 leading-snug">
                  {item.english || 'No translation available'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
