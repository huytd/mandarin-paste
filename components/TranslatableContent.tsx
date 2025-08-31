import React from 'react';
import { TranslationButton } from './TranslationButton';
import { TranslationDisplay } from './TranslationDisplay';

// Helper function to check if text contains Chinese characters
const containsChinese = (text: string): boolean => {
  return /[\u4e00-\u9fff]/.test(text);
};

interface TranslatableContentProps {
  textContent: string;
  paragraphId: string;
  translation: string | undefined;
  isTranslating: boolean;
  onTranslate: (text: string, paragraphId: string) => void;
  className?: string;
  buttonClassName?: string;
}

export const TranslatableContent: React.FC<TranslatableContentProps> = ({
  textContent,
  paragraphId,
  translation,
  isTranslating,
  onTranslate,
  className = "mt-2",
  buttonClassName
}) => {
  // Only show translation functionality if the text contains Chinese characters
  if (!containsChinese(textContent)) {
    return null;
  }

  return (
    <div className={className}>
      {translation ? (
        <TranslationDisplay translation={translation} />
      ) : (
        <TranslationButton
          isTranslating={isTranslating}
          onTranslate={() => onTranslate(textContent, paragraphId)}
          className={buttonClassName}
        />
      )}
    </div>
  );
};