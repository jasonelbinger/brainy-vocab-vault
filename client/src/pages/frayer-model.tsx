import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FrayerCard } from "@/components/frayer-card";
import { AudioRecorder } from "@/components/audio-recorder";
import { ImageUpload } from "@/components/image-upload";
import { useVocabularyCard, useUpdateVocabularyCard } from "@/hooks/use-vocabulary";
import { useToast } from "@/hooks/use-toast";
import { X, Loader2, Edit, Home, Plus, BookOpen } from "lucide-react";

export default function FrayerModel() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const cardId = parseInt(id || "0");
  const { data: card, isLoading } = useVocabularyCard(cardId);
  const updateCard = useUpdateVocabularyCard();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    characteristics: "",
    examples: "",
    nonExamples: "",
    personalConnection: "",
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Initialize form data when card loads
  useEffect(() => {
    if (card) {
      setFormData({
        characteristics: card.characteristics || "",
        examples: card.examples || "",
        nonExamples: card.nonExamples || "",
        personalConnection: card.personalConnection || "",
      });
    }
  }, [card]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!card) return;
    
    try {
      await updateCard.mutateAsync({
        id: card.id,
        card: {
          ...formData,
          audioUrl: audioFile ? URL.createObjectURL(audioFile) : card.audioUrl,
          imageUrls: imageFile ? [URL.createObjectURL(imageFile)] : card.imageUrls,
        },
      });

      toast({
        title: "Card updated successfully!",
        description: `"${card.word}" has been updated`,
      });

      navigate("/");
    } catch (error) {
      toast({
        title: "Failed to update card",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Card Not Found</h2>
        <Button onClick={() => navigate("/")} variant="outline">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const previewCard = { ...card, ...formData };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              onClick={() => navigate("/card-creation")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New</span>
            </Button>
            <Button
              onClick={() => navigate("/practice")}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Practice</span>
            </Button>
          </div>
          <Button
            onClick={() => setIsEditMode(!isEditMode)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>{isEditMode ? 'View Mode' : 'Edit Mode'}</span>
          </Button>
        </div>

        {!isEditMode ? (
          // Simple Card View Mode
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Vocabulary Card</h1>
                  <p className="text-gray-600">View and study your vocabulary card</p>
                </div>
                <div className="flex justify-center">
                  <FrayerCard card={card} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Edit Mode
          <Card className="bg-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Edit Vocabulary Card</h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Preview Panel */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Card Preview</h2>
                  <FrayerCard card={previewCard} />
                </div>

                {/* Editing Panel */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Details</h2>
                  
                  <div className="space-y-2">
                    <Label htmlFor="characteristics">Characteristics</Label>
                    <Textarea
                      id="characteristics"
                      value={formData.characteristics}
                      onChange={(e) => handleInputChange("characteristics", e.target.value)}
                      placeholder="List key characteristics..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examples">Examples</Label>
                    <Textarea
                      id="examples"
                      value={formData.examples}
                      onChange={(e) => handleInputChange("examples", e.target.value)}
                      placeholder="Provide examples..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nonExamples">Non-Examples</Label>
                    <Textarea
                      id="nonExamples"
                      value={formData.nonExamples}
                      onChange={(e) => handleInputChange("nonExamples", e.target.value)}
                      placeholder="Provide non-examples..."
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personalConnection">Personal Connection</Label>
                    <Textarea
                      id="personalConnection"
                      value={formData.personalConnection}
                      onChange={(e) => handleInputChange("personalConnection", e.target.value)}
                      placeholder="How does this word relate to your life or experience?"
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Image Upload */}
                  <ImageUpload
                    onImagesChange={(urls) => {
                      // For now, we'll just use the first image as a File object
                      // This is a temporary solution until we fully migrate to multiple images
                      if (urls && urls.length > 0) {
                        fetch(urls[0])
                          .then(res => res.blob())
                          .then(blob => {
                            const file = new File([blob], `${card.word}_image.jpg`, { type: blob.type });
                            setImageFile(file);
                          });
                      }
                    }}
                    initialImageUrls={card.imageUrls || []}
                    searchTerm={card.word}
                    maxImages={3}
                  />

                  {/* Audio Recording */}
                  <AudioRecorder
                    onRecordingComplete={(blob) => {
                      const file = new File([blob], `${card.word}_audio.wav`, { type: 'audio/wav' });
                      setAudioFile(file);
                    }}
                    initialAudioUrl={card.audioUrl || undefined}
                  />

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <Button
                      onClick={() => navigate("/")}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateCard.isPending}
                      className="bg-primary hover:bg-blue-600"
                    >
                      {updateCard.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
