// eslint-disable-next-line @typescript-eslint/no-require-imports
const cedictData = require('cedict-json');

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

// Simple dictionary interface using cedict-json
function lookupWord(word: string): DictEntry[] {
  try {
    // cedict-json provides an array of entries, we filter by simplified or traditional
    return (cedictData as DictEntry[]).filter((entry: DictEntry) => 
      entry.simplified === word || entry.traditional === word
    );
  } catch (error) {
    console.error('Error looking up word:', word, error);
    return [];
  }
}

export interface ChineseWord {
  word: string;
  pinyin: string;
  english: string | null;
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

    return words;
  } catch (error) {
    console.error('Error segmenting (sequence) Chinese text:', error);
    return text.match(/[\u4e00-\u9fff]/g) || [];
  }
}

// Process Chinese text into a sequence of ChineseWord items (keeps duplicates)
export function processChineseTextSequence(text: string): ChineseWord[] {
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
  return processed;
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
  try {
    const entries = lookupWord(word);
    if (entries && entries.length > 0) {
      const entry = entries[0];
      const allEnglish = entries.map(entry => entry.english.join('; ')).join(' ');
      // Convert numbered pinyin to tone marks
      const convertedPinyin = convertPinyinTones(entry.pinyin);
      return {
        pinyin: convertedPinyin,
        english: allEnglish
      };
    }
  } catch (error) {
    console.error('Error getting word data for:', word, error);
  }
  
  return { pinyin: '', english: null };
}

export function processChineseText(text: string): ChineseWord[] {
  // Get unique Chinese words from the text
  const words = segmentChineseText(text);
  const uniqueWords = [...new Set(words)];
  
  // Process each word to get pinyin and translation
  const processedWords: ChineseWord[] = [];
  
  for (const word of uniqueWords) {
    const wordData = getWordData(word);
    if (wordData.pinyin || wordData.english) {
      processedWords.push({
        word,
        pinyin: wordData.pinyin,
        english: wordData.english
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
