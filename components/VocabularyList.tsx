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

      <ul>
        {words.map(({ word, pinyin, english }) => (
          <li><b>{word}</b> (<i>{pinyin}</i>): {english ?? "No translation"}</li>
        ))}
      </ul>
    </div>
  );
}
