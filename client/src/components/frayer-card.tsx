import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, X, ZoomIn } from "lucide-react";
import { VocabularyCard } from "@shared/schema";
import { useState, useEffect } from "react";
import { getDifficultyColor, getDifficultyLabel } from "@/lib/spaced-repetition";


interface FrayerCardProps {
  card: VocabularyCard;
  showAnswer?: boolean;
  className?: string;
  cardType?: string;
  questionMode?: 'word' | 'definition' | 'image'; // New prop for different question types
  masteryLevel?: number; // Optional mastery level from review session
}

export function FrayerCard({ card, showAnswer = true, className = "", cardType, questionMode = 'word', masteryLevel }: FrayerCardProps) {
  // Get the custom fields data
  const customFields = card.customFields as Record<string, any> || {};
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentWord, setCurrentWord] = useState(card.word);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  // Reset audio state when word changes
  useEffect(() => {
    if (currentWord !== card.word) {
      setCurrentWord(card.word);
      setIsPlayingAudio(false);
    }
  }, [card.word, currentWord]);

  const playPronunciation = async () => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      // Always use the current word from the card prop
      const currentWord = card.word;
      
      // Try to use stored audio URL first
      if (card.audioUrl) {
        const audio = new Audio(card.audioUrl);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
        return;
      }

      // Fallback to Merriam-Webster API for pronunciation - always use fresh word
      const response = await fetch(`/api/dictionary/${encodeURIComponent(currentWord)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const entry = data[0];
          if (entry.hwi && entry.hwi.prs && entry.hwi.prs[0] && entry.hwi.prs[0].sound && entry.hwi.prs[0].sound.audio) {
            const audioFile = entry.hwi.prs[0].sound.audio;
            const subdirectory = audioFile.startsWith('bix') ? 'bix' :
                               audioFile.startsWith('gg') ? 'gg' :
                               audioFile.match(/^[0-9]/) ? 'number' :
                               audioFile.charAt(0);
            
            const audioUrl = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioFile}.mp3`;
            const audio = new Audio(audioUrl);
            audio.onended = () => setIsPlayingAudio(false);
            audio.onerror = () => setIsPlayingAudio(false);
            await audio.play();
          }
        }
      }
    } catch (error) {
      console.error('Error playing pronunciation:', error);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl(null);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showImageModal) {
        closeImageModal();
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showImageModal]);
  
  // Get first image from imageUrls array - handle both array and object formats
  let imageUrl = null;
  if (card.imageUrls) {
    if (Array.isArray(card.imageUrls) && card.imageUrls.length > 0) {
      imageUrl = card.imageUrls[0];
    } else if (typeof card.imageUrls === 'object' && card.imageUrls !== null) {
      // Handle case where imageUrls might be stored as an object
      const imageArray = Object.values(card.imageUrls);
      if (imageArray.length > 0) {
        imageUrl = imageArray[0] as string;
      }
    }
  }
  
  // Also check customFields for images
  if (!imageUrl && customFields) {
    if (customFields.imageUrls && Array.isArray(customFields.imageUrls) && customFields.imageUrls.length > 0) {
      imageUrl = customFields.imageUrls[0];
    } else if (customFields.visualAid && Array.isArray(customFields.visualAid) && customFields.visualAid.length > 0) {
      imageUrl = customFields.visualAid[0];
    }
  }
  


  return (
    <div className={`w-full max-w-4xl mx-auto relative z-10 ${className}`}>
      {showAnswer ? (
        // Enhanced Frayer Model Layout with Fifth Quadrant
        <div className="relative bg-white border-4 border-gray-800 rounded-lg" style={{ aspectRatio: '5/4', minHeight: '600px' }}>
          {/* Mastery Level Badge */}
          {masteryLevel !== undefined && (
            <div className="absolute top-2 right-2 z-30">
              <div 
                className={`px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg`}
                style={{ backgroundColor: getDifficultyColor(masteryLevel) }}
              >
                Level {masteryLevel} - {getDifficultyLabel(masteryLevel)}
              </div>
            </div>
          )}
          {/* Main Four Quadrants Grid */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {/* Top Left - Definition */}
            <div className="border-r-2 border-b-2 border-gray-800 p-4 flex flex-col">
              <h3 className="font-bold text-red-600 text-lg mb-2 text-center">
                {customFields.definition ? 'Definition' : 'What It Means'}
              </h3>
              <div className="flex-1 flex items-start justify-center overflow-hidden">
                <p className="text-gray-700 text-center leading-relaxed text-sm overflow-y-auto max-h-24">
                  {customFields.definition || customFields.whatItIs || 'No definition available'}
                </p>
              </div>
            </div>
            
            {/* Top Right - Characteristics */}
            <div className="border-l-2 border-b-2 border-gray-800 p-4 flex flex-col">
              <h3 className="font-bold text-red-600 text-lg mb-2 text-center">
                {customFields.characteristics ? 'Characteristics' : 'Facts'}
              </h3>
              <div className="flex-1 flex items-start justify-center overflow-hidden">
                <div className="text-gray-700 text-center leading-relaxed whitespace-pre-line text-sm overflow-y-auto max-h-24">
                  {customFields.characteristics || 'No characteristics available'}
                </div>
              </div>
            </div>
            
            {/* Bottom Left - Examples */}
            <div className="border-r-2 border-t-2 border-gray-800 p-4 flex flex-col">
              <h3 className="font-bold text-red-600 text-lg mb-2 text-center">Examples</h3>
              <div className="flex-1 flex items-start justify-center overflow-hidden">
                <div className="text-gray-700 text-center leading-relaxed whitespace-pre-line text-sm overflow-y-auto max-h-24">
                  {customFields.examples || 'No examples available'}
                </div>
              </div>
            </div>
            
            {/* Bottom Right - Non-Examples or Synonyms */}
            <div className="border-l-2 border-t-2 border-gray-800 p-4 flex flex-col">
              <h3 className="font-bold text-red-600 text-lg mb-2 text-center">
                {customFields.synonyms ? 'Synonyms' : 
                 customFields.nonExamples ? 'Non-Examples' : 'What It Isn\'t'}
              </h3>
              <div className="flex-1 flex items-start justify-center overflow-hidden">
                <div className="text-gray-700 text-center leading-relaxed whitespace-pre-line text-sm overflow-y-auto max-h-24">
                  {customFields.synonyms || customFields.nonExamples || 'No synonyms or non-examples available'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Central Circle with Word */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 bg-white border-4 border-gray-800 rounded-full flex items-center justify-center shadow-lg z-10">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 font-merriweather">
                  {card.word}
                </h2>
                <Button
                  onClick={playPronunciation}
                  size="sm"
                  variant="ghost"
                  disabled={isPlayingAudio}
                  className="h-6 w-6 p-0 hover:bg-blue-100 rounded-full"
                  title="Play pronunciation"
                >
                  <Volume2 className={`h-4 w-4 text-blue-600 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
              {card.partOfSpeech && (
                <p className="text-xs text-blue-600 font-medium mb-1">({card.partOfSpeech})</p>
              )}
              <p className="text-sm text-red-600 font-medium">Word/Concept</p>
            </div>
          </div>

          {/* Fifth Quadrant - Visual Aid (Bottom Center) */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-20 bg-gray-50 border-4 border-gray-800 rounded-lg shadow-lg z-20">
            <div className="p-1 h-full">
              {imageUrl ? (
                <div 
                  className="h-full rounded overflow-hidden cursor-pointer group relative"
                  onClick={() => openImageModal(imageUrl)}
                  title="Click to enlarge image"
                >
                  <img 
                    src={imageUrl} 
                    alt={`Visual aid for ${card.word}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      console.log('Image failed to load:', imageUrl);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.classList.add('bg-red-50');
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-white rounded border-2 border-dashed border-gray-300">
                  <p className="text-xs text-gray-500 text-center">Visual Aid</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Question Mode - Different prompts based on questionMode
        <div className="text-center py-20">
          {questionMode === 'image' && imageUrl ? (
            // Image-based question
            <div className="space-y-6">
              <div 
                className="w-96 h-64 mx-auto rounded-lg overflow-hidden border-4 border-gray-800 shadow-lg cursor-pointer group relative"
                onClick={() => openImageModal(imageUrl)}
                title="Click to enlarge image"
              >
                <img 
                  src={imageUrl} 
                  alt="What word does this represent?"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    console.log('Question image failed to load:', imageUrl);
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add('bg-red-50');
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">What word does this image represent?</h1>
            </div>
          ) : questionMode === 'definition' ? (
            // Definition-based question
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-gray-100 p-8 rounded-lg border-4 border-gray-800">
                <p className="text-xl text-gray-700 leading-relaxed">
                  {customFields.definition || 'No definition available'}
                </p>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">What word matches this definition?</h1>
            </div>
          ) : (
            // Standard word-based question
            <div>
              <h1 className="text-6xl font-bold text-gray-900 font-merriweather">
                {card.word}
              </h1>
              {card.partOfSpeech && (
                <p className="text-xl text-gray-600 mt-4">{card.partOfSpeech}</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Cloze Sentence Display */}
      {card.clozeSentence && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-semibold text-gray-800 mb-2">Cloze Practice</div>
          <div className="text-gray-700">
            <p className="mb-2">
              <strong>Fill in the blank:</strong>
            </p>
            <p className="italic">
              {card.clozeSentence.replace(
                new RegExp(`\\b${card.word}\\b`, 'gi'), 
                '____'
              )}
            </p>
            {showAnswer && (
              <p className="mt-2 text-green-700">
                <strong>Answer:</strong> {card.word}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {showImageModal && modalImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-4xl mx-auto p-4">
            <Button
              onClick={closeImageModal}
              size="sm"
              variant="ghost"
              className="absolute -top-2 -right-2 bg-white text-black hover:bg-gray-100 rounded-full h-8 w-8 p-0 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={modalImageUrl} 
              alt={`Enlarged view of ${card.word}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
