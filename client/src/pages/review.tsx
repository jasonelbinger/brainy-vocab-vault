import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FrayerCard } from "@/components/frayer-card";
import { useDueReviewSessions, useStudySettings, useUpdateReviewSession } from "@/hooks/use-review-session";
import { useVocabularyCard } from "@/hooks/use-vocabulary";
import { useToast } from "@/hooks/use-toast";
import { X, Eye, Check, RotateCcw, CheckCheck, BookOpen } from "lucide-react";

export default function Review() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: dueReviews, isLoading: reviewsLoading, error: reviewsError } = useDueReviewSessions();
  const { data: settings } = useStudySettings();
  const updateReviewSession = useUpdateReviewSession();

  // Handle authentication errors
  useEffect(() => {
    if (reviewsError && reviewsError.message?.includes('401')) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to access reviews",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
    }
  }, [reviewsError, toast]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [questionMode, setQuestionMode] = useState<'word' | 'definition' | 'image'>('word');

  const currentSession = dueReviews?.[currentIndex];
  const { data: currentCard, isLoading: cardLoading } = useVocabularyCard(currentSession?.cardId || 0);

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
  
  const progressPercentage = dueReviews ? ((currentIndex + 1) / dueReviews.length) * 100 : 0;

  useEffect(() => {
    if (!reviewsLoading && (!dueReviews || dueReviews.length === 0)) {
      toast({
        title: "No reviews due",
        description: "Great job! You're all caught up.",
      });
      navigate("/");
    }
  }, [dueReviews, reviewsLoading, navigate, toast]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleMasteryResponse = async (masteryLevel: 'justLearned' | 'stillLearning' | 'good' | 'easy') => {
    if (!currentSession || !settings) return;
    
    const correct = masteryLevel !== 'justLearned' && masteryLevel !== 'stillLearning';
    
    try {
      await updateReviewSession.mutateAsync({
        id: currentSession.id,
        correct,
        settings,
      });
      
      setSessionStats(prev => ({
        correct: prev.correct + (correct ? 1 : 0),
        total: prev.total + 1,
      }));
      
      // Move to next card
      if (currentIndex < (dueReviews?.length || 0) - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowAnswer(false); // Reset for next card
      } else {
        // Session complete
        toast({
          title: "Review session complete!",
          description: `You got ${sessionStats.correct + (correct ? 1 : 0)} out of ${sessionStats.total + 1} cards correct.`,
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Failed to update review",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };
  
  // Reset showAnswer when currentIndex changes
  useEffect(() => {
    setShowAnswer(false);
  }, [currentIndex]);

  if (reviewsLoading || cardLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review session...</p>
        </div>
      </div>
    );
  }

  if (!dueReviews || dueReviews.length === 0 || !currentCard) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Reviews Available</h2>
        <p className="text-gray-600 mb-6">You're all caught up! Come back later for more reviews.</p>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Dashboard
        </Button>
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
                <span className="text-sm font-medium text-gray-700">Progress:</span>
                <span className="text-sm font-medium text-primary">
                  {currentIndex + 1} of {dueReviews?.length || 0}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Progress value={progressPercentage} className="w-32" />
              <span className="text-sm font-medium text-gray-700">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flashcard with 3D Flip Animation */}
      <div className="mb-16 perspective-1000">
        <div className={`relative w-full min-h-96 max-h-[500px] transition-transform duration-700 transform-style-preserve-3d ${showAnswer ? 'rotate-y-180' : ''}`}>
          {/* Question Side */}
          <Card className={`absolute inset-0 min-h-96 max-h-[500px] backface-hidden ${showAnswer ? 'rotate-y-180' : ''}`}>
            <CardContent className="p-4">
              <FrayerCard 
                card={currentCard} 
                showAnswer={false} 
                cardType={currentSession?.cardType}
                questionMode={questionMode}
              />
            </CardContent>
          </Card>
          
          {/* Answer Side */}
          <Card className={`absolute inset-0 min-h-96 max-h-[500px] backface-hidden rotate-y-180 ${showAnswer ? 'rotate-y-0' : ''}`}>
            <CardContent className="p-4">
              <FrayerCard 
                card={currentCard} 
                showAnswer={true} 
                cardType={currentSession?.cardType}
                questionMode={questionMode}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Actions - Fixed positioning */}
      <div className="w-full max-w-4xl mx-auto mt-8 relative z-20">
        <div className="flex justify-center">
          {!showAnswer ? (
            <Button
              onClick={handleShowAnswer}
              size="lg"
              className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              Flip Card
            </Button>
          ) : (
            <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <div className="flex flex-col space-y-4">
                <h3 className="text-center text-lg font-semibold text-gray-900">How well did you know this?</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  <Button
                    onClick={() => handleMasteryResponse('justLearned')}
                    variant="outline"
                    className="px-4 py-3 border-red-300 text-red-600 hover:bg-red-50 flex flex-col items-center space-y-1"
                    disabled={updateReviewSession.isPending}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs">Just Learned</span>
                  </Button>
                  <Button
                    onClick={() => handleMasteryResponse('stillLearning')}
                    variant="destructive"
                    className="px-4 py-3 flex flex-col items-center space-y-1"
                    disabled={updateReviewSession.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="text-xs">Still Learning</span>
                  </Button>
                  <Button
                    onClick={() => handleMasteryResponse('good')}
                    className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white flex flex-col items-center space-y-1"
                    disabled={updateReviewSession.isPending}
                  >
                    <Check className="h-4 w-4" />
                    <span className="text-xs">Good</span>
                  </Button>
                  <Button
                    onClick={() => handleMasteryResponse('easy')}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white flex flex-col items-center space-y-1"
                    disabled={updateReviewSession.isPending}
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span className="text-xs">Easy</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Session Stats */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          Session Progress: {sessionStats.correct} correct out of {sessionStats.total} reviewed
        </p>
      </div>
    </div>
  );
}