import React from 'react';

interface TranslationDisplayProps {
  translation: string;
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({ translation }) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
      <div className="text-sm text-blue-600 font-medium mb-1">Translation:</div>
      <div className="text-gray-700 text-sm leading-relaxed">{translation}</div>
    </div>
  );
};