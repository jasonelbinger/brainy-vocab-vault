export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

export function getMerriamWebsterUrl(word: string): string {
  if (!word.trim()) return '';
  return `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word.trim().toLowerCase())}?ref=kidsdictionary`;
}

export async function fetchDictionaryData(word: string): Promise<DictionaryEntry | null> {
  try {
    const response = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      console.error('Dictionary API request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Dictionary API response for word:', word, data);
    
    // Handle Merriam-Webster Elementary Dictionary API response format
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      console.log('First entry:', entry);
      
      if (typeof entry === 'string') {
        // API returned suggestions instead of definitions
        console.log('API returned suggestions:', data);
        return null;
      }
      
      // Elementary Dictionary has a different structure
      // Extract audio URL if available
      const audioFileName = entry.hwi?.prs?.[0]?.sound?.audio;
      let audioUrl = undefined;
      
      if (audioFileName) {
        // Merriam-Webster audio URL structure for Elementary Dictionary
        const audioFolder = audioFileName.charAt(0) === 'b' && audioFileName.charAt(1) === 'i' && audioFileName.charAt(2) === 'x' ? 'bix' :
                           audioFileName.charAt(0) === 'g' && audioFileName.charAt(1) === 'g' ? 'gg' :
                           audioFileName.charAt(0);
        audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${audioFolder}/${audioFileName}.mp3`;
      }
      
      return {
        word: entry.meta?.id || word,
        phonetic: entry.hwi?.prs?.[0]?.mw || undefined,
        audioUrl,
        meanings: entry.fl ? [{
          partOfSpeech: entry.fl,
          definitions: entry.shortdef?.map((def: string) => ({
            definition: def,
            example: undefined,
            synonyms: undefined,
            antonyms: undefined,
          })) || []
        }] : []
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching dictionary data:', error);
    return null;
  }
}

export function extractExampleSentences(entry: DictionaryEntry): string[] {
  const examples: string[] = [];
  
  entry.meanings.forEach(meaning => {
    meaning.definitions.forEach(def => {
      if (def.example) {
        examples.push(def.example);
      }
    });
  });
  
  return examples;
}
