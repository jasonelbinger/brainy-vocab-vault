import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FrayerCard } from "@/components/frayer-card";
import { useVocabularyCards } from "@/hooks/use-vocabulary";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, RotateCcw, Shuffle, Trophy } from "lucide-react";

export default function Practice() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: allCards, isLoading: cardsLoading } = useVocabularyCards();
  
  const [practiceCards, setPracticeCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ attempted: 0, total: 0 });
  const [questionMode, setQuestionMode] = useState<'word' | 'definition' | 'image'>('word');
  const [isSessionStarted, setIsSessionStarted] = useState(false);

  const currentCard = practiceCards[currentIndex];
  const progressPercentage = practiceCards.length > 0 ? ((currentIndex + 1) / practiceCards.length) * 100 : 0;

  // Initialize practice session with shuffled cards
  const startPracticeSession = (count: number = 10) => {
    if (!allCards || allCards.length === 0) return;
    
    // Shuffle and select random cards
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, allCards.length));
    
    setPracticeCards(selected);
    setCurrentIndex(0);
    setSessionStats({ attempted: 0, total: selected.length });
    setIsSessionStarted(true);
    setShowAnswer(false);
  };

  // Set random question mode when card changes
  useEffect(() => {
    if (currentCard) {
      const modes: ('word' | 'definition' | 'image')[] = ['word', 'definition'];
      
      // Add image mode if the card has images
      if (currentCard.imageUrls && currentCard.imageUrls.length > 0) {
        modes.push('image');
      }
      
      // Randomly select a question mode
      const randomMode = modes[Math.floor(Math.random() * modes.length)];
      setQuestionMode(randomMode);
    }
  }, [currentCard]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleNextCard = () => {
    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      total: prev.total
    }));
    
    // Move to next card
    if (currentIndex < practiceCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      toast({
        title: "Practice session complete!",
        description: `You practiced ${sessionStats.attempted + 1} cards. No progress tracking - this was just for practice!`,
      });
      setIsSessionStarted(false);
    }
  };

  const handleSkipCard = () => {
    // Skip without counting as attempted
    if (currentIndex < practiceCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      // Session complete
      toast({
        title: "Practice session complete!",
        description: `You practiced ${sessionStats.attempted} cards. No progress tracking - this was just for practice!`,
      });
      setIsSessionStarted(false);
    }
  };

  const handleRestartSession = () => {
    startPracticeSession(practiceCards.length);
  };

  // Reset showAnswer when currentIndex changes
  useEffect(() => {
    setShowAnswer(false);
  }, [currentIndex]);

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (!allCards || allCards.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Cards Available</h2>
        <p className="text-gray-600 mb-6">Create some vocabulary cards first before practicing.</p>
        <Button onClick={() => navigate("/card-creation")} className="mr-4">
          Create Cards
        </Button>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // Session selection screen
  if (!isSessionStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Extra Practice Session</h1>
          <p className="text-gray-600 mb-6">
            Practice as much as you want! This won't affect your review schedule or mastery levels - it's just for extra learning.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Available Cards: {allCards.length}</h3>
              <p className="text-gray-600">Choose how many cards to practice with</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Button 
                onClick={() => startPracticeSession(5)}
                className="h-16 flex flex-col"
                variant="outline"
              >
                <span className="text-2xl font-bold">5</span>
                <span className="text-sm">Quick Practice</span>
              </Button>
              <Button 
                onClick={() => startPracticeSession(10)}
                className="h-16 flex flex-col"
                variant="outline"
              >
                <span className="text-2xl font-bold">10</span>
                <span className="text-sm">Short Session</span>
              </Button>
              <Button 
                onClick={() => startPracticeSession(20)}
                className="h-16 flex flex-col"
                variant="outline"
              >
                <span className="text-2xl font-bold">20</span>
                <span className="text-sm">Medium Session</span>
              </Button>
              <Button 
                onClick={() => startPracticeSession(allCards.length)}
                className="h-16 flex flex-col"
                variant="outline"
              >
                <span className="text-2xl font-bold">All</span>
                <span className="text-sm">Full Practice</span>
              </Button>
            </div>

            <div className="flex justify-center space-x-4">
              <Button onClick={() => navigate("/")} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Practice Mode:</span>
                <span className="text-sm font-medium text-primary">
                  {currentIndex + 1} of {practiceCards.length}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRestartSession}
                variant="ghost"
                size="sm"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Restart
              </Button>
              <Progress value={progressPercentage} className="w-32" />
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard with 3D Flip Animation */}
      <div className="mb-8 perspective-1000 relative z-10">
        <div className={`relative w-full min-h-96 transition-transform duration-700 transform-style-preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
          {/* Question Side */}
          <Card className={`absolute inset-0 min-h-96 backface-hidden ${showAnswer ? 'rotate-y-180' : ''}`}>
            <CardContent className="p-4">
              <FrayerCard 
                card={currentCard} 
                showAnswer={false} 
                questionMode={questionMode}
              />
            </CardContent>
          </Card>
          
          {/* Answer Side */}
          <Card className={`absolute inset-0 min-h-96 backface-hidden rotate-y-180 ${showAnswer ? 'rotate-y-0' : ''}`}>
            <CardContent className="p-4">
              <FrayerCard 
                card={currentCard} 
                showAnswer={true} 
                questionMode={questionMode}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Practice Actions - Fixed below card to avoid overlap */}
      <div className="mt-8 space-y-4 pb-20">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 border">
            {!showAnswer ? (
              <Button
                onClick={handleShowAnswer}
                size="lg"
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              >
                <Eye className="h-5 w-5 mr-2" />
                Reveal the Answer
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex space-x-4 justify-center">
                  <Button
                    onClick={handleNextCard}
                    size="lg"
                    className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
                  >
                    Next Word →
                  </Button>
                  <Button
                    onClick={() => setShowAnswer(false)}
                    size="lg"
                    variant="outline"
                    className="px-8 py-4 text-lg"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Flip Back
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    💡 For spaced repetition with mastery tracking, use <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 underline" 
                      onClick={() => navigate("/review")}
                    >
                      Review Mode
                    </Button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Stats */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full">
          <Trophy className="h-4 w-4" />
          <span className="text-sm font-medium">
            Practice Mode: {sessionStats.attempted} of {sessionStats.total} cards attempted
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          This practice session won't affect your review schedule or mastery levels
        </p>
      </div>
    </div>
  );
}