import React from 'react';
import { TranslationButton } from './TranslationButton';
import { TranslationDisplay } from './TranslationDisplay';

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