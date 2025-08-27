"use client";

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TurndownService from 'turndown';
import { ChineseWord, processChineseTextWithPositions, clearContentCaches } from '../lib/chinese-utils';
import WordDefinition from '../components/WordDefinition';
import Link from 'next/link';

export default function Home() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);
  const [selectedWord, setSelectedWord] = useState<ChineseWord | null>(null);
  const [showWordDefinition, setShowWordDefinition] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);
  const [allWordsInText, setAllWordsInText] = useState<ChineseWord[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  const clearAllHighlights = () => {
    setHighlightedWord(null);
  };

  // String-based highlighter removed in favor of state-driven highlighting

  const handleWordClick = (word: ChineseWord) => {
    // Extract all words from the current markdown content
    const { words } = processChineseTextWithPositions(markdownContent);
    const uniqueWords = words.filter((w, index, self) => 
      self.findIndex(sw => sw.word === w.word) === index
    );
    
    setAllWordsInText(uniqueWords);
    const wordIndex = uniqueWords.findIndex(w => w.word === word.word);
    setCurrentWordIndex(wordIndex);
    
    setSelectedWord(word);
    setShowWordDefinition(true);
    setHighlightedWord(word.word);
  };

  const handleNavigateWord = (direction: 'prev' | 'next') => {
    if (allWordsInText.length === 0) return;
    
    let newIndex = currentWordIndex;
    if (direction === 'prev' && currentWordIndex > 0) {
      newIndex = currentWordIndex - 1;
    } else if (direction === 'next' && currentWordIndex < allWordsInText.length - 1) {
      newIndex = currentWordIndex + 1;
    }
    
    if (newIndex !== currentWordIndex) {
      const newWord = allWordsInText[newIndex];
      setCurrentWordIndex(newIndex);
      setSelectedWord(newWord);
      setHighlightedWord(newWord.word);
    }
  };

  // Mobile-friendly activation helpers
  const handleWordKeyDown = (word: ChineseWord) => (
    e: React.KeyboardEvent<HTMLSpanElement>
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleWordClick(word);
    }
  };

  // Optimized function to render Chinese text with clickable word spans
  const renderChineseTextWithClickableWords = (text: string) => {
    if (!text || !/[\u4e00-\u9fff]/.test(text)) {
      return text;
    }

    const { words, nonChineseParts } = processChineseTextWithPositions(text);
    const elements: React.ReactNode[] = [];

    // If no Chinese words found, return original text
    if (words.length === 0) {
      return text;
    }

    // Create typed parts array
    type TextPart = { text: string; startIndex: number; endIndex: number; };
    type ChineseWordPart = TextPart & { isChineseWord: true; wordData: ChineseWord; };
    type Part = TextPart | ChineseWordPart;

    const allParts: Part[] = [...nonChineseParts];
    words.forEach(word => {
      if (word.startIndex !== undefined) {
        allParts.push({
          text: word.word,
          startIndex: word.startIndex,
          endIndex: word.endIndex!,
          isChineseWord: true,
          wordData: word
        } as ChineseWordPart);
      }
    });

    // Sort by start index
    allParts.sort((a, b) => a.startIndex - b.startIndex);

    allParts.forEach((part, index) => {
      if ('isChineseWord' in part && part.isChineseWord) {
        // This is a Chinese word
        const wordData = part.wordData;
        elements.push(
          <span
            key={`word-${index}-${wordData.word}`}
            role="button"
            tabIndex={0}
            className={`select-none cursor-pointer hover:bg-yellow-200 hover:bg-opacity-50 rounded-sm px-0.5 transition-colors duration-150 ${highlightedWord === wordData.word ? 'bg-yellow-300 border-2 border-amber-400 font-bold text-foreground' : ''}`}
            onPointerUp={(e) => {
              e.stopPropagation();
              handleWordClick(wordData);
            }}
            onKeyDown={handleWordKeyDown(wordData)}
            title={`${wordData.pinyin || ''} - ${wordData.english || 'No translation'}`}
          >
            {wordData.word}
          </span>
        );
      } else {
        // This is non-Chinese text
        elements.push(part.text);
      }
    });

    return elements;
  };

  const handleCloseWordDefinition = () => {
    setShowWordDefinition(false);
    setSelectedWord(null);
    setAllWordsInText([]);
    setCurrentWordIndex(-1);
    clearAllHighlights();
  };

  const handlePaste = async (e: React.ClipboardEvent | ClipboardEvent) => {
    e.preventDefault();
    
    let htmlData = '';
    let textData = '';
    
    // Try modern Clipboard API first (better mobile support)
    if (navigator.clipboard && navigator.clipboard.read) {
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
          // Try to get HTML first
          if (clipboardItem.types.includes('text/html')) {
            const blob = await clipboardItem.getType('text/html');
            htmlData = await blob.text();
          }
          // Fallback to plain text
          if (!htmlData && clipboardItem.types.includes('text/plain')) {
            const blob = await clipboardItem.getType('text/plain');
            textData = await blob.text();
          }
        }
      } catch (error) {
        console.log('Clipboard API failed, trying fallback:', error);
        // Fallback to legacy clipboard API
        if ('clipboardData' in e && e.clipboardData) {
          htmlData = e.clipboardData.getData('text/html');
          textData = e.clipboardData.getData('text/plain');
        }
      }
    } else {
      // Legacy clipboard API fallback
      if ('clipboardData' in e && e.clipboardData) {
        htmlData = e.clipboardData.getData('text/html');
        textData = e.clipboardData.getData('text/plain');
      }
    }
    
    let finalMarkdown = '';
    
    if (htmlData && htmlData.trim() !== '') {
      // Convert HTML to Markdown
      finalMarkdown = turndownService.turndown(htmlData);
    } else if (textData && textData.trim() !== '') {
      // Use plain text as markdown
      finalMarkdown = textData;
    }
    
    if (finalMarkdown) {
      setMarkdownContent(finalMarkdown);
      setShowPasteArea(false);
      clearContentCaches(); // Clear caches for new content
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    if (content.trim()) {
      setMarkdownContent(content);
      setShowPasteArea(false);
      clearContentCaches(); // Clear caches for new content
      // Clear the textarea for next use
      e.target.value = '';
    }
  };

  const handleManualPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text.trim()) {
          setMarkdownContent(text);
          setShowPasteArea(false);
          clearContentCaches(); // Clear caches for new content
        }
      }
    } catch (error) {
      console.log('Manual paste failed:', error);
      // Show instruction to use the textarea instead
      alert('Clipboard access not available. Please manually paste your content in the text area above.');
    }
  };



  const handlePracticeRandomRead = async () => {
    try {
      setIsLoadingPractice(true);
      const res = await fetch('/api/learning', { method: 'POST' });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = await res.json();
      const content = data?.summary || '';
      if (content) {
        setMarkdownContent(content);
        setShowPasteArea(false);
        clearAllHighlights();
        clearContentCaches(); // Clear caches for new content
      } else {
        alert('No content received from the learning API.');
      }
    } catch (error) {
      console.error('Failed to fetch practice content:', error);
      alert('Failed to fetch practice content. Please try again.');
    } finally {
      setIsLoadingPractice(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          <Link href="/">中文粘贴</Link>
        </h1>
        {showPasteArea ? (
          // Unified Paste Area
          <div className="bg-background rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Paste or Type Your Content
              </h2>
              <p className="text-foreground/60 mb-6">
                Paste HTML or Markdown content, or type directly in the box below
              </p>
            </div>
            
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-6 border-2 border-dashed border-foreground/20 rounded-xl resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-all text-lg leading-relaxed bg-background text-foreground placeholder:text-foreground/50"
                placeholder="Supports both HTML and Markdown formats!"
                onChange={handleTextareaChange}
                onPaste={handlePaste}
                autoFocus
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-foreground/60 flex-1">
                   { '💡 Click the text area above to start pasting or typing content.' }
                </p>
                
                {/* Optional manual paste button for devices where clipboard access might be restricted */}
                <button
                  onClick={handleManualPaste}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
                >
                  📋 Try Auto-Paste
                </button>
              </div>
            </div>
            <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <div className="flex justify-center mt-4">
              <button
                onClick={handlePracticeRandomRead}
                disabled={isLoadingPractice}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xl"
              >
                {isLoadingPractice ? 'Loading…' : '📰 今天的新闻'}
              </button>
            </div>
          </div>
        ) : (
          // Rendered Content Area
          <div className="bg-background rounded-lg shadow-md">
            <div className="p-8 max-w-none" ref={contentRef}>
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{

                  h1: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <h1 className="text-4xl font-bold mb-8 text-foreground border-b-2 border-foreground/20 pb-4 leading-tight">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </h1>
                    );
                  },
                  h2: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <h2 className="text-3xl font-bold mb-6 mt-8 text-foreground border-b border-foreground/20 pb-2 leading-tight">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </h2>
                    );
                  },
                  h3: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <h3 className="text-2xl font-bold mb-4 mt-6 text-foreground/80 leading-tight">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </h3>
                    );
                  },
                  h4: ({children}) => (
                    <h4 className="text-xl font-semibold mb-3 mt-5 text-foreground/80 leading-tight">
                      {children}
                    </h4>
                  ),
                  h5: ({children}) => (
                    <h5 className="text-lg font-semibold mb-2 mt-4 text-foreground/80 leading-tight">
                      {children}
                    </h5>
                  ),
                  h6: ({children}) => (
                    <h6 className="text-base font-semibold mb-2 mt-3 text-foreground/80 leading-tight">
                      {children}
                    </h6>
                  ),
                  p: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <p className="mb-6 text-foreground leading-relaxed text-lg rounded-md p-1 -m-1">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </p>
                    );
                  },
                  ul: ({children}) => (
                    <ul className="list-none mb-6 space-y-2 pl-4">
                      {children}
                    </ul>
                  ),
                  ol: ({children}) => (
                    <ol className="list-decimal list-outside mb-6 space-y-2 pl-8 text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <li className="text-lg leading-relaxed relative pl-6 before:content-['•'] before:absolute before:left-0 before:text-blue-500 before:font-bold before:text-xl rounded-md p-1 -m-1">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </li>
                    );
                  },
                  code: ({children}) => (
                    <code className="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md text-sm font-mono text-purple-700 font-medium">
                      {children}
                    </code>
                  ),
                  pre: ({children}) => (
                    <pre className="bg-gray-900 text-gray-100 p-6 rounded-xl overflow-x-auto mb-6 text-sm font-mono border-l-4 border-blue-500 shadow-lg">
                      {children}
                    </pre>
                  ),
                  blockquote: ({children}) => {
                    const text = typeof children === 'string' ? children : '';
                    return (
                      <blockquote className="border-l-4 border-foreground/30 pl-6 pr-4 py-4 mb-6 bg-foreground/5 rounded-r-lg italic text-foreground/80 text-lg shadow-sm">
                        {typeof children === 'string' && /[\u4e00-\u9fff]/.test(text) 
                          ? renderChineseTextWithClickableWords(text)
                          : children
                        }
                      </blockquote>
                    );
                  },
                  a: ({href, children}) => (
                    <a 
                      href={href} 
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors font-medium" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({children}) => (
                    <strong className="font-bold text-foreground bg-yellow-100 px-1 rounded">
                      {children}
                    </strong>
                  ),
                  em: ({children}) => (
                    <em className="italic text-foreground/80 font-medium">
                      {children}
                    </em>
                  ),
                  table: ({children}) => (
                    <div className="mb-6 overflow-x-auto shadow-lg rounded-lg">
                      <table className="min-w-full border-collapse bg-background">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({children}) => (
                    <thead className="bg-foreground/[0.04]">
                      {children}
                    </thead>
                  ),
                  tbody: ({children}) => (
                    <tbody className="divide-y divide-foreground/20">
                      {children}
                    </tbody>
                  ),
                  th: ({children}) => (
                    <th className="border border-foreground/20 px-6 py-4 bg-foreground/[0.06] font-bold text-left text-foreground text-sm uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-foreground/20 px-6 py-4 text-foreground text-sm">
                      {children}
                    </td>
                  ),
                  tr: ({children}) => (
                    <tr className="hover:bg-foreground/5 transition-colors">
                      {children}
                    </tr>
                  ),
                  img: ({src, alt}) => (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="max-w-full h-auto rounded-xl shadow-lg mb-6 border border-foreground/20" 
                    />
                  ),
                  hr: () => (
                    <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>              
            </div>
          </div>
        )}
        
        {/* Word Definition Bottom Sheet */}
        <WordDefinition
          word={selectedWord}
          isVisible={showWordDefinition}
          onClose={handleCloseWordDefinition}
          allWords={allWordsInText}
          currentWordIndex={currentWordIndex}
          onNavigate={handleNavigateWord}
        />
      </div>
      

    </div>
  );
}
