// eslint-disable-next-line @typescript-eslint/no-require-imports
const cedictData = require('cedict-json');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const hanzi = require('hanzi');

// Initialize hanzi (you only need to do this once)
let hanziInitialized = false;
function initializeHanzi() {
  if (!hanziInitialized) {
    hanzi.start();
    hanziInitialized = true;
  }
}

// Interface for individual radical component
export interface RadicalComponent {
  radical: string;
  pinyin?: string;
  meaning?: string;
}

// Interface for radical decomposition data
export interface RadicalDecomposition {
  character: string;
  components: RadicalComponent[];
  level: 1 | 2 | 3; // 1=once, 2=radical, 3=graphical
}

// Performance optimization: Create efficient lookup maps
const simplifiedMap = new Map<string, DictEntry[]>();
const traditionalMap = new Map<string, DictEntry[]>();
const wordCache = new Map<string, { pinyin: string; english: string | null }>();
const segmentationCache = new Map<string, string[]>();
const processedTextCache = new Map<string, ChineseWord[]>();

// Initialize lookup maps for better performance
function initializeLookupMaps() {
  if (simplifiedMap.size > 0) return; // Already initialized

  (cedictData as DictEntry[]).forEach((entry: DictEntry) => {
    // Add to simplified map
    if (!simplifiedMap.has(entry.simplified)) {
      simplifiedMap.set(entry.simplified, []);
    }
    simplifiedMap.get(entry.simplified)!.push(entry);

    // Add to traditional map if different
    if (entry.traditional !== entry.simplified) {
      if (!traditionalMap.has(entry.traditional)) {
        traditionalMap.set(entry.traditional, []);
      }
      traditionalMap.get(entry.traditional)!.push(entry);
    }
  });
}

// Tone mark conversion mappings
const toneMap: { [key: string]: { [tone: string]: string } } = {
  'a': { '1': 'ā', '2': 'á', '3': 'ǎ', '4': 'à', '5': 'a' },
  'o': { '1': 'ō', '2': 'ó', '3': 'ǒ', '4': 'ò', '5': 'o' },
  'e': { '1': 'ē', '2': 'é', '3': 'ě', '4': 'è', '5': 'e' },
  'i': { '1': 'ī', '2': 'í', '3': 'ǐ', '4': 'ì', '5': 'i' },
  'u': { '1': 'ū', '2': 'ú', '3': 'ǔ', '4': 'ù', '5': 'u' },
  'ü': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ', '5': 'ü' },
  'v': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ', '5': 'ü' }
};

// Convert numbered pinyin to tone marks
function convertPinyinTones(pinyin: string): string {
  return pinyin.replace(/([a-z]*?)([1-5])/gi, (match, syllable, tone) => {
    // Find the main vowel to apply tone to (priority: a, o, e, then first i/u)
    let toneVowel = '';
    let toneIndex = -1;
    
    // Priority order for tone marks
    if (syllable.includes('a')) {
      toneVowel = 'a';
      toneIndex = syllable.indexOf('a');
    } else if (syllable.includes('o')) {
      toneVowel = 'o';
      toneIndex = syllable.indexOf('o');
    } else if (syllable.includes('e')) {
      toneVowel = 'e';
      toneIndex = syllable.indexOf('e');
    } else if (syllable.includes('iu')) {
      // Special case: 'iu' gets tone on 'u'
      toneVowel = 'u';
      toneIndex = syllable.indexOf('u');
    } else if (syllable.includes('ui')) {
      // Special case: 'ui' gets tone on 'i'
      toneVowel = 'i';
      toneIndex = syllable.indexOf('i');
    } else if (syllable.includes('i')) {
      toneVowel = 'i';
      toneIndex = syllable.indexOf('i');
    } else if (syllable.includes('u')) {
      toneVowel = 'u';
      toneIndex = syllable.indexOf('u');
    } else if (syllable.includes('ü') || syllable.includes('v')) {
      toneVowel = syllable.includes('ü') ? 'ü' : 'v';
      toneIndex = syllable.includes('ü') ? syllable.indexOf('ü') : syllable.indexOf('v');
    }
    
    if (toneVowel && toneIndex >= 0 && toneMap[toneVowel] && toneMap[toneVowel][tone]) {
      const chars = syllable.split('');
      chars[toneIndex] = toneMap[toneVowel][tone];
      return chars.join('');
    }
    
    return syllable; // Return original if no mapping found
  });
}

// Dictionary entry interface
interface DictEntry {
  simplified: string;
  traditional: string;
  pinyin: string;
  english: string[];
}

// Optimized dictionary lookup using pre-built maps
function lookupWord(word: string): DictEntry[] {
  try {
    initializeLookupMaps(); // Ensure maps are initialized

    const results: DictEntry[] = [];

    // Check simplified map
    const simplifiedEntries = simplifiedMap.get(word);
    if (simplifiedEntries) {
      results.push(...simplifiedEntries);
    }

    // Check traditional map if different from simplified
    const traditionalEntries = traditionalMap.get(word);
    if (traditionalEntries) {
      results.push(...traditionalEntries);
    }

    return results;
  } catch (error) {
    console.error('Error looking up word:', word, error);
    return [];
  }
}

// Function to get radical meaning using hanzi package
function getRadicalMeaning(radical: string): string | undefined {
  try {
    initializeHanzi();
    return hanzi.getRadicalMeaning?.(radical) || undefined;
  } catch (error) {
    return undefined;
  }
}

// Function to get radical decomposition of a character with enhanced info
export function getRadicalDecomposition(character: string, level: 1 | 2 | 3 = 2): RadicalDecomposition | null {
  try {
    initializeHanzi();
    
    const decomposition = hanzi.decompose(character, level);
    if (!decomposition || !decomposition.components) {
      return null;
    }
    
    const filteredComponents = decomposition.components.filter((comp: string) => comp !== 'No glyph available');
    
    // Get enhanced info for each radical component
    const enhancedComponents: RadicalComponent[] = filteredComponents.map((radical: string) => {
      const radicalData = getWordData(radical);
      const meaning = getRadicalMeaning(radical);
      
      return {
        radical,
        pinyin: radicalData.pinyin || undefined,
        meaning: meaning || radicalData.english || undefined
      };
    });
    
    return {
      character,
      components: enhancedComponents,
      level
    };
  } catch (error) {
    console.error('Error decomposing character:', character, error);
    return null;
  }
}

export interface ChineseWord {
  word: string;
  pinyin: string;
  english: string | null;
  startIndex?: number;
  endIndex?: number;
  radicals?: RadicalDecomposition[];
}

export function segmentChineseText(text: string): string[] {
  try {
    // Replace punctuation and quotes with spaces to create word boundaries
    // This ensures quotes and other punctuation act as separators
    const textWithSpaces = text.replace(/[""''《》「」【】『』()（）\[\]{}【】、，。；：！？]+/g, ' ');
    
    // Now extract Chinese character sequences separated by spaces or non-Chinese characters
    const chineseSequences = textWithSpaces.match(/[\u4e00-\u9fff]+/g) || [];
    const words: string[] = [];
    
    for (const sequence of chineseSequences) {
      if (!sequence) continue; // Skip empty sequences
      
      const chineseChars = sequence.split(''); // Convert to character array
      
      // Simple approach: try to find words in dictionary, fall back to individual characters
      let i = 0;
      while (i < chineseChars.length) {
        let found = false;
        
        // Try to find longest matching word (up to 4 characters)
        for (let len = Math.min(4, chineseChars.length - i); len >= 2; len--) {
          const candidate = chineseChars.slice(i, i + len).join('');
          const entries = lookupWord(candidate);
          
          if (entries.length > 0) {
            words.push(candidate);
            i += len;
            found = true;
            break;
          }
        }
        
        // If no word found, add individual character
        if (!found) {
          words.push(chineseChars[i]);
          i++;
        }
      }
    }
    
    // Remove duplicates while preserving order
    return [...new Set(words)];
  } catch (error) {
    console.error('Error segmenting Chinese text:', error);
    // Ultimate fallback: just return individual characters
    return [...new Set(text.match(/[\u4e00-\u9fff]/g) || [])];
  }
}

// Segment Chinese text preserving order and duplicates (token sequence)
export function segmentChineseTextToSequence(text: string): string[] {
  // Check cache first
  const cached = segmentationCache.get(text);
  if (cached) {
    return cached;
  }

  try {
    const textWithSpaces = text.replace(/[""''《》「」【】『』()（）\[\]{}【】、，。；：！？]+/g, ' ');
    const chineseSequences = textWithSpaces.match(/[\u4e00-\u9fff]+/g) || [];
    const words: string[] = [];

    for (const sequence of chineseSequences) {
      if (!sequence) continue;

      const chineseChars = sequence.split('');
      let i = 0;
      while (i < chineseChars.length) {
        let found = false;

        // Try to find longest matching word (up to 4 characters)
        for (let len = Math.min(4, chineseChars.length - i); len >= 2; len--) {
          const candidate = chineseChars.slice(i, i + len).join('');
          const entries = lookupWord(candidate);
          if (entries.length > 0) {
            words.push(candidate);
            i += len;
            found = true;
            break;
          }
        }

        if (!found) {
          words.push(chineseChars[i]);
          i++;
        }
      }
    }

    // Cache the result
    segmentationCache.set(text, words);
    return words;
  } catch (error) {
    console.error('Error segmenting (sequence) Chinese text:', error);
    const fallback = text.match(/[\u4e00-\u9fff]/g) || [];
    segmentationCache.set(text, fallback);
    return fallback;
  }
}

// Process Chinese text into a sequence of ChineseWord items (keeps duplicates)
export function processChineseTextSequence(text: string): ChineseWord[] {
  // Check cache first
  const cached = processedTextCache.get(text);
  if (cached) {
    return cached;
  }

  const tokens = segmentChineseTextToSequence(text);
  const processed: ChineseWord[] = [];
  for (const token of tokens) {
    const data = getWordData(token);
    processed.push({
      word: token,
      pinyin: data.pinyin,
      english: data.english,
    });
  }

  // Cache the result
  processedTextCache.set(text, processed);
  return processed;
}

// Optimized function that processes Chinese text and returns words with positions
export function processChineseTextWithPositions(text: string): { words: ChineseWord[], nonChineseParts: Array<{ text: string, startIndex: number, endIndex: number }> } {
  const cacheKey = `positions_${text}`;
  const cached = processedTextCache.get(cacheKey);
  if (cached) {
    return {
      words: cached,
      nonChineseParts: []
    };
  }

  const words: ChineseWord[] = [];
  const nonChineseParts: Array<{ text: string, startIndex: number, endIndex: number }> = [];

  if (!text || !/[\u4e00-\u9fff]/.test(text)) {
    return { words: [], nonChineseParts: [{ text, startIndex: 0, endIndex: text.length }] };
  }

  const tokens = segmentChineseTextToSequence(text);
  let currentIndex = 0;

  for (const token of tokens) {
    // Find the token in the text
    const tokenIndex = text.indexOf(token, currentIndex);
    if (tokenIndex === -1) continue;

    // Add any non-Chinese text before this token
    if (tokenIndex > currentIndex) {
      const nonChineseText = text.slice(currentIndex, tokenIndex);
      if (nonChineseText) {
        nonChineseParts.push({
          text: nonChineseText,
          startIndex: currentIndex,
          endIndex: tokenIndex
        });
      }
    }

    // Add the Chinese word with position info
    const data = getWordData(token);
    words.push({
      word: token,
      pinyin: data.pinyin,
      english: data.english,
      startIndex: tokenIndex,
      endIndex: tokenIndex + token.length
    });

    currentIndex = tokenIndex + token.length;
  }

  // Add any remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      nonChineseParts.push({
        text: remainingText,
        startIndex: currentIndex,
        endIndex: text.length
      });
    }
  }

  // Cache the words with positions
  processedTextCache.set(cacheKey, words);

  return { words, nonChineseParts };
}

// Cache management functions
export function clearAllCaches() {
  wordCache.clear();
  segmentationCache.clear();
  processedTextCache.clear();
}

export function clearContentCaches() {
  // Clear segmentation and processed text caches, but keep word cache for performance
  segmentationCache.clear();
  // Clear only position-based caches
  for (const [key] of processedTextCache) {
    if (key.startsWith('positions_')) {
      processedTextCache.delete(key);
    }
  }
}

export function getPinyin(word: string): string {
  try {
    const entries = lookupWord(word);
    if (entries && entries.length > 0) {
      // Get the numbered pinyin from dictionary and convert to tone marks
      const numberedPinyin = entries[0].pinyin;
      return convertPinyinTones(numberedPinyin);
    }
    return '';
  } catch (error) {
    console.error('Error getting pinyin for word:', word, error);
    return '';
  }
}

export function getWordData(word: string): { pinyin: string; english: string | null } {
  // Check cache first
  const cached = wordCache.get(word);
  if (cached) {
    return cached;
  }

  try {
    const entries = lookupWord(word);
    if (entries && entries.length > 0) {
      const entry = entries[0];
      const allEnglish = entries.map(entry => entry.english.join('; ')).join(' ');
      // Convert numbered pinyin to tone marks
      const convertedPinyin = convertPinyinTones(entry.pinyin);
      const result = {
        pinyin: convertedPinyin,
        english: allEnglish
      };

      // Cache the result
      wordCache.set(word, result);
      return result;
    }
  } catch (error) {
    console.error('Error getting word data for:', word, error);
  }

  const emptyResult = { pinyin: '', english: null };
  wordCache.set(word, emptyResult);
  return emptyResult;
}

export function processChineseText(text: string): ChineseWord[] {
  // Get unique Chinese words from the text
  const words = segmentChineseText(text);
  const uniqueWords = [...new Set(words)];
  
  // Process each word to get pinyin, translation, and radicals
  const processedWords: ChineseWord[] = [];
  
  for (const word of uniqueWords) {
    const wordData = getWordData(word);
    if (wordData.pinyin || wordData.english) {
      // Get radical decomposition for each character in the word
      const radicals: RadicalDecomposition[] = [];
      for (const char of word) {
        const decomp = getRadicalDecomposition(char);
        if (decomp) {
          radicals.push(decomp);
        }
      }
      
      processedWords.push({
        word,
        pinyin: wordData.pinyin,
        english: wordData.english,
        radicals: radicals.length > 0 ? radicals : undefined
      });
    }
  }
  
  return processedWords;
}

// Find word data by Chinese word
export function findWordInVocabulary(word: string, vocabularyWords: ChineseWord[]): ChineseWord | null {
  return vocabularyWords.find(w => w.word === word) || null;
}

export function extractChineseCharacters(text: string): string {
  // Extract only Chinese characters from the text
  return text.match(/[\u4e00-\u9fff]/g)?.join('') || '';
}
