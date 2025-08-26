"use client";

import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import TurndownService from 'turndown';
import { processChineseTextSequence, ChineseWord } from '../lib/chinese-utils';
import ParagraphBreakdown from '../components/ParagraphBreakdown';
import Link from 'next/link';

export default function Home() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(true);
  const [selectedParagraphWords, setSelectedParagraphWords] = useState<ChineseWord[] | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [highlightedMarkdown, setHighlightedMarkdown] = useState('');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const selectedParagraphRef = useRef<HTMLElement | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [isLoadingPractice, setIsLoadingPractice] = useState(false);

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });
  const clearAllHighlights = () => {
    setHighlightedMarkdown('');
  };

  const highlightAllWordOccurrences = (word: string) => {
    const content = markdownContent;
    let currentIndex = 0;
    let occurrenceCount = 0;
    let highlightedContent = '';
    let lastProcessedIndex = 0;
    
    // Find all occurrences and highlight them
    while (true) {
      const idx = content.indexOf(word, currentIndex);
      if (idx === -1) {
        // Add remaining content
        highlightedContent += content.slice(lastProcessedIndex);
        break;
      }
      
      // Add content before this occurrence
      highlightedContent += content.slice(lastProcessedIndex, idx);
      
      // Use same highlight style for all occurrences
      const highlightStyle = 'background-color: #fde047; border: 2px solid #f59e0b; border-radius: 4px; padding: 2px 4px; margin: 0 1px; font-weight: bold; color: #000;';
      
      // Add highlighted word
      highlightedContent += `<span class="hr-highlight" style="${highlightStyle}">${word}</span>`;
      
      lastProcessedIndex = idx + word.length;
      currentIndex = idx + word.length;
      occurrenceCount++;
    }
    
    if (occurrenceCount > 0) {
      setHighlightedMarkdown(highlightedContent);
      return true;
    }
    
    console.warn(`Could not find any occurrences of word "${word}"`);
    return false;
  };

  const handleParagraphClick = (e: React.MouseEvent<HTMLElement>) => {
    // Avoid triggering on interactive elements or when user is selecting text
    const target = e.target as HTMLElement;
    if (target && target.closest('a, button, input, textarea, select, code, pre')) {
      return;
    }
    const selectedText = typeof window !== 'undefined' ? window.getSelection()?.toString() : '';
    if (selectedText && selectedText.trim().length > 0) {
      return;
    }

    const text = (e.currentTarget as HTMLElement).innerText || '';
    if (!text.trim()) return;
    if (!/[\u4e00-\u9fff]/.test(text)) return;
    const words = processChineseTextSequence(text);
    setSelectedParagraphWords(words);
    setShowBreakdown(true);
    selectedParagraphRef.current = e.currentTarget as HTMLElement;
    clearAllHighlights();
  };

  const handleCloseBreakdown = () => {
    setShowBreakdown(false);
    setSelectedParagraphWords(null);
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
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    if (content.trim()) {
      setMarkdownContent(content);
      setShowPasteArea(false);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          <Link href="/">中文粘贴</Link>
        </h1>
        {showPasteArea ? (
          // Unified Paste Area
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-3">
                Paste or Type Your Content
              </h2>
              <p className="text-gray-500 mb-6">
                Paste HTML or Markdown content, or type directly in the box below
              </p>
            </div>
            
            <div className="space-y-4">
              <textarea
                className="w-full h-64 p-6 border-2 border-dashed border-gray-300 rounded-xl resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 transition-all text-lg leading-relaxed"
                placeholder="Supports both HTML and Markdown formats!"
                onChange={handleTextareaChange}
                onPaste={handlePaste}
                autoFocus
              />
              
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <p className="text-sm text-gray-500 flex-1">
                   { '💡 Click the text area above to start pasting or typing content.' }
                </p>
                
                {/* Optional manual paste button for devices where clipboard access might be restricted */}
                <button
                  onClick={handleManualPaste}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium border border-blue-200"
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
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-8 max-w-none" ref={contentRef}>
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{

                  h1: ({children}) => (
                    <h1
                      className="text-4xl font-bold mb-8 text-black border-b-2 border-gray-200 pb-4 leading-tight"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </h1>
                  ),
                  h2: ({children}) => (
                    <h2
                      className="text-3xl font-bold mb-6 mt-8 text-black border-b border-gray-200 pb-2 leading-tight"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </h2>
                  ),
                  h3: ({children}) => (
                    <h3
                      className="text-2xl font-bold mb-4 mt-6 text-gray-700 leading-tight"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </h3>
                  ),
                  h4: ({children}) => (
                    <h4 className="text-xl font-semibold mb-3 mt-5 text-gray-700 leading-tight">
                      {children}
                    </h4>
                  ),
                  h5: ({children}) => (
                    <h5 className="text-lg font-semibold mb-2 mt-4 text-gray-700 leading-tight">
                      {children}
                    </h5>
                  ),
                  h6: ({children}) => (
                    <h6 className="text-base font-semibold mb-2 mt-3 text-gray-700 leading-tight">
                      {children}
                    </h6>
                  ),
                  p: ({children}) => (
                    <p
                      className="mb-6 text-black leading-relaxed text-lg cursor-pointer select-none active:bg-amber-50 rounded-md p-1 -m-1"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </p>
                  ),
                  ul: ({children}) => (
                    <ul className="list-none mb-6 space-y-2 pl-4">
                      {children}
                    </ul>
                  ),
                  ol: ({children}) => (
                    <ol className="list-decimal list-outside mb-6 space-y-2 pl-8 text-black">
                      {children}
                    </ol>
                  ),
                  li: ({children}) => (
                    <li
                      className="text-lg leading-relaxed relative pl-6 before:content-['•'] before:absolute before:left-0 before:text-blue-500 before:font-bold before:text-xl cursor-pointer select-none active:bg-amber-50 rounded-md p-1 -m-1"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </li>
                  ),
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
                  blockquote: ({children}) => (
                    <blockquote
                      className="border-l-4 border-blue-400 pl-6 pr-4 py-4 mb-6 bg-blue-50 rounded-r-lg italic text-gray-700 text-lg shadow-sm cursor-pointer select-none active:bg-amber-50"
                      onClick={handleParagraphClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleParagraphClick(e as unknown as React.MouseEvent<HTMLElement>);
                        }
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                  a: ({href, children}) => (
                    <a 
                      href={href} 
                      className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:decoration-blue-800 transition-colors font-medium" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({children}) => (
                    <strong className="font-bold text-black bg-yellow-100 px-1 rounded">
                      {children}
                    </strong>
                  ),
                  em: ({children}) => (
                    <em className="italic text-gray-700 font-medium">
                      {children}
                    </em>
                  ),
                  table: ({children}) => (
                    <div className="mb-6 overflow-x-auto shadow-lg rounded-lg">
                      <table className="min-w-full border-collapse bg-white">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({children}) => (
                    <thead className="bg-gray-50">
                      {children}
                    </thead>
                  ),
                  tbody: ({children}) => (
                    <tbody className="divide-y divide-gray-200">
                      {children}
                    </tbody>
                  ),
                  th: ({children}) => (
                    <th className="border border-gray-200 px-6 py-4 bg-gray-100 font-bold text-left text-black text-sm uppercase tracking-wider">
                      {children}
                    </th>
                  ),
                  td: ({children}) => (
                    <td className="border border-gray-200 px-6 py-4 text-black text-sm">
                      {children}
                    </td>
                  ),
                  tr: ({children}) => (
                    <tr className="hover:bg-gray-50 transition-colors">
                      {children}
                    </tr>
                  ),
                  img: ({src, alt}) => (
                    <img 
                      src={src} 
                      alt={alt} 
                      className="max-w-full h-auto rounded-xl shadow-lg mb-6 border border-gray-200" 
                    />
                  ),
                  hr: () => (
                    <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  ),
                }}
              >
                {highlightedMarkdown || markdownContent}
              </ReactMarkdown>              
            </div>
          </div>
        )}
        
        {/* Paragraph Breakdown Bottom Sheet */}
        <ParagraphBreakdown
          words={selectedParagraphWords}
          isVisible={showBreakdown}
          onClose={handleCloseBreakdown}
          onWordClick={(word) => {
            // Handle highlight + scroll
            const paragraphEl = selectedParagraphRef.current;
            if (!paragraphEl || !selectedParagraphWords) return;
            
            // Prevent double execution with a small delay
            if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = setTimeout(() => {
              // Clear existing highlights
              clearAllHighlights();
                            
              highlightAllWordOccurrences(word.word);              
            }, 10);
          }}
        />
      </div>
      

    </div>
  );
}
