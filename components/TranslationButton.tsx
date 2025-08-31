import React from 'react';

interface TranslationButtonProps {
  isTranslating: boolean;
  onTranslate: () => void;
  className?: string;
}

export const TranslationButton: React.FC<TranslationButtonProps> = ({
  isTranslating,
  onTranslate,
  className = "text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
}) => {
  return (
    <button
      onClick={onTranslate}
      disabled={isTranslating}
      className={className}
    >
      {isTranslating ? (
        <>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          Translating...
        </>
      ) : (
        <>
          <span>🌐</span>
          Translate
        </>
      )}
    </button>
  );
};
