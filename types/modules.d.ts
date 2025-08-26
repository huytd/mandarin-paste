



declare module 'cedict-json' {
  interface CedictEntry {
    simplified: string;
    traditional: string;
    pinyin: string;
    definitions: string[];
  }
  
  const cedictData: CedictEntry[];
  export = cedictData;
}