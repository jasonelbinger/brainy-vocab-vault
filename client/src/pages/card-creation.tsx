import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateVocabularyCard, useVocabularyCard, useUpdateVocabularyCard } from "@/hooks/use-vocabulary";
import { useCardTemplates } from "@/hooks/use-card-templates";
import { fetchDictionaryData, getMerriamWebsterUrl } from "@/lib/dictionary-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ImageUpload } from "@/components/image-upload";
import { AudioRecorder } from "@/components/audio-recorder";
import { FieldConfig } from "@shared/schema";
import { X, Book, Check, Loader2, Volume2, Eye, ExternalLink, Search, Plus, Home, BookOpen, Network } from "lucide-react";

// Helper function to search for prefix/suffix meanings in Google
const searchPrefixSuffixMeaning = (text: string) => {
  const searchTerm = text.startsWith('-') || text.endsWith('-') ? text : `${text} meaning`;
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm + ' prefix suffix meaning')}`;
  window.open(googleSearchUrl, '_blank');
};

// Helper function to open SnappyWords for visual word connections
const openSnappyWords = (word: string) => {
  if (!word.trim()) return;
  const snappyWordsUrl = `https://snappywords.com/${encodeURIComponent(word.trim().toLowerCase())}`;
  window.open(snappyWordsUrl, '_blank');
};

export default function CardCreation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check for edit mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const editCardId = urlParams.get('edit') ? parseInt(urlParams.get('edit')!) : null;
  const isEditMode = !!editCardId;
  
  const createCard = useCreateVocabularyCard();
  const updateCard = useUpdateVocabularyCard();
  const { data: existingCard, isLoading: cardLoading } = useVocabularyCard(editCardId || 0);
  const { data: templates, isLoading: templatesLoading } = useCardTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Find the selected template or default to the first one
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId) || templates?.find(t => t.isDefault) || templates?.[0];
  
  // Set default template when templates load
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);
  
  const [formData, setFormData] = useState({
    word: "",
    partOfSpeech: "",
    definition: "",
    characteristics: "",
    examples: "",
    nonExamples: "",
    personalConnection: "",
    clozeSentence: "",
  });
  
  const [dynamicFieldData, setDynamicFieldData] = useState<Record<string, any>>({});
  const [createdCardId, setCreatedCardId] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pronunciationAudio, setPronunciationAudio] = useState<string | null>(null);
  
  const [isLoadingDictionary, setIsLoadingDictionary] = useState(false);

  // Load existing card data when in edit mode
  useEffect(() => {
    if (isEditMode && existingCard && !cardLoading) {
      const customFields = existingCard.customFields as Record<string, any> || {};
      setFormData({
        word: existingCard.word || "",
        partOfSpeech: existingCard.partOfSpeech || "",
        definition: existingCard.definition || "",
        characteristics: customFields.characteristics || "",
        examples: existingCard.examples || "",
        nonExamples: customFields.nonExamples || "",
        personalConnection: customFields.personalConnection || "",
        clozeSentence: existingCard.clozeSentence || "",
      });
      
      // Set custom fields
      setDynamicFieldData(existingCard.customFields || {});
      
      // Set images
      setImageUrls(existingCard.imageUrls || []);
      
      // Set audio
      setPronunciationAudio(existingCard.audioUrl || null);
      
      // Set template
      if (existingCard.templateId) {
        setSelectedTemplateId(existingCard.templateId);
      }
    }
  }, [isEditMode, existingCard, cardLoading]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill pronunciation when word changes
    if (field === 'word' && value.trim() && value !== formData.word) {
      autoFillWordData(value.trim());
    }
  };

  const autoFillWordData = async (word: string) => {
    if (!word || isLoadingDictionary) return;
    
    setIsLoadingDictionary(true);
    try {
      const dictionaryData = await fetchDictionaryData(word);
      
      if (dictionaryData) {
        // Auto-fill pronunciation if available
        if (dictionaryData.audioUrl) {
          setPronunciationAudio(dictionaryData.audioUrl);
        }
      }
    } catch (error) {
      // Silently fail for auto-fill to avoid annoying users
      console.log('Auto-fill failed for word:', word);
    } finally {
      setIsLoadingDictionary(false);
    }
  };

  const fetchPronunciationAudio = async () => {
    if (!formData.word.trim()) return;
    
    setIsLoadingDictionary(true);
    try {
      // Use Merriam-Webster API for pronunciation
      const response = await fetch(`/api/dictionary/${encodeURIComponent(formData.word.trim())}`);
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
            setPronunciationAudio(audioUrl);
            
            toast({
              title: "Pronunciation loaded",
              description: "Merriam-Webster pronunciation audio loaded for this word",
            });
          } else {
            toast({
              title: "No pronunciation found",
              description: "This word doesn't have pronunciation audio available",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Audio lookup failed",
        description: "Could not load pronunciation audio",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDictionary(false);
    }
  };

  const handleDynamicFieldChange = (fieldId: string, value: any) => {
    setDynamicFieldData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    if (!formData.word.trim()) {
      toast({
        title: "Word is required",
        description: "Please enter a word to create the card",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Form submission - imageUrls:', imageUrls.length, 'items');
      console.log('User data:', user);
      console.log('Selected template:', selectedTemplate);
      console.log('Templates available:', templates);
      
      if (!selectedTemplate) {
        toast({
          title: "No template selected",
          description: "Please select a learning style template",
          variant: "destructive",
        });
        return;
      }
      
      const cardData = {
        word: formData.word.trim(),
        templateId: selectedTemplate.id,
        partOfSpeech: formData.partOfSpeech || "",
        definition: dynamicFieldData.definition || formData.definition || "",
        characteristics: dynamicFieldData.characteristics || formData.characteristics || "",
        examples: dynamicFieldData.examples || formData.examples || "",
        nonExamples: dynamicFieldData.nonExamples || formData.nonExamples || "",
        personalConnection: dynamicFieldData.personalConnection || formData.personalConnection || "",
        clozeSentence: formData.clozeSentence || "",
        customFields: dynamicFieldData,
        imageUrls: imageUrls,
        audioUrl: pronunciationAudio || "",
        pronunciationKey: "",
      };
      
      console.log('Card data being sent:', cardData);

      if (isEditMode && editCardId) {
        // Update existing card
        const result = await updateCard.mutateAsync({ id: editCardId, card: cardData });
        setCreatedCardId(result.id);

        toast({
          title: "Card updated successfully!",
          description: `"${formData.word}" has been updated`,
        });
      } else {
        // Create new card
        const result = await createCard.mutateAsync(cardData);
        setCreatedCardId(result.id);

        toast({
          title: "Card created successfully!",
          description: `"${formData.word}" has been added to your vocabulary`,
        });
        
        // Don't clear form immediately - let user choose what to do next
        // setCreatedCardId is set to show success message and options
      }

    } catch (error) {
      toast({
        title: "Failed to create card",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFieldCompact = (field: FieldConfig) => {
    const value = dynamicFieldData[field.id] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                id={field.id}
                value={value}
                onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                required={field.required}
                className="flex-1 border-gray-300 focus:border-blue-500"
              />
              {(field.id === 'prefix' || field.id === 'suffix') && (
                <Button
                  type="button"
                  onClick={() => searchPrefixSuffixMeaning(value || field.id)}
                  size="sm"
                  variant="outline"
                  title={`Search Google for ${field.name.toLowerCase()} meaning`}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      
      case 'textarea':
        return (
          <div className="space-y-2">
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                }
              }}
              placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
              className="min-h-[100px] border-gray-300 focus:border-blue-500 resize-none"
              required={field.required}
            />
            {field.name.toLowerCase().includes('non-example') && (
              <p className="text-xs text-gray-500">
                💡 What is NOT an example of this word? This helps clarify the meaning.
              </p>
            )}
            {field.name.toLowerCase().includes('characteristics') && (
              <p className="text-xs text-gray-500">
                💡 What qualities or traits define this word? Think about its key features.
              </p>
            )}
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            <ImageUpload
              onImagesChange={(urls) => handleDynamicFieldChange(field.id, urls)}
              initialImageUrls={Array.isArray(value) ? value : (value ? [value] : [])}
              searchTerm={formData.word}
              maxImages={3}
              className="w-full"
            />
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            <AudioRecorder
              onRecordingComplete={(blob) => {
                const url = URL.createObjectURL(blob);
                handleDynamicFieldChange(field.id, url);
              }}
              initialAudioUrl={value}
              className="w-full"
            />
          </div>
        );
      
      default:
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
            required={field.required}
            className="border-gray-300 focus:border-blue-500"
          />
        );
    }
  };

  const renderField = (field: FieldConfig, stepNumber: number = 0) => {
    const value = dynamicFieldData[field.id] || '';
    
    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.required && ' *'}
            </Label>
            <div className="flex space-x-2">
              <Input
                id={field.id}
                value={value}
                onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                required={field.required}
                className="flex-1"
              />
              {(field.id === 'prefix' || field.id === 'suffix') && (
                <Button
                  type="button"
                  onClick={() => searchPrefixSuffixMeaning(value || field.id)}
                  size="icon"
                  variant="outline"
                  title={`Search Google for ${field.name.toLowerCase()} meaning`}
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.required && ' *'}
            </Label>
            <Textarea
              id={field.id}
              value={value}
              onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation(); // Allow ENTER for line breaks
                }
              }}
              placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
              className="min-h-[80px]"
              required={field.required}
            />
            {field.name.toLowerCase().includes('non-example') && (
              <p className="text-sm text-gray-600 mt-1">
                Non-examples help clarify what the word is NOT. List things that might be confused with this word but are actually different.
              </p>
            )}
            {field.name.toLowerCase().includes('personal connection') && (
              <p className="text-sm text-gray-600 mt-1">
                Personal connections help you remember the word. Think of how this word relates to your life, experiences, or other words you know.
              </p>
            )}
            {field.name.toLowerCase().includes('characteristic') && (
              <p className="text-sm text-gray-600 mt-1">
                Characteristics describe the essential qualities or features of this word. What makes this word unique? What are its key properties or attributes?
              </p>
            )}
            {field.name.toLowerCase().includes('memory device') && (
              <p className="text-sm text-gray-600 mt-1">
                A memory device is a technique to help you remember this word. Create a vivid image, rhyme, story, or association that connects the word parts to their meanings. The more unusual or memorable, the better!
              </p>
            )}
          </div>
        );
      
      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.name}
              {field.required && ' *'}
            </Label>
            <Select value={value} onValueChange={(val) => handleDynamicFieldChange(field.id, val)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      
      case 'image':
        return (
          <div key={field.id}>
            <ImageUpload
              onImagesChange={(urls) => {
                handleDynamicFieldChange(field.id, urls);
                setImageUrls(urls);
              }}
              initialImageUrls={imageUrls}
              searchTerm={formData.word}
              className="w-full"
              maxImages={3}
            />
          </div>
        );
      
      case 'audio':
        return (
          <div key={field.id}>
            <AudioRecorder
              onRecordingComplete={(blob) => {
                const file = new File([blob], `${formData.word}_audio.wav`, { type: 'audio/wav' });
                handleDynamicFieldChange(field.id, file);
              }}
              className="w-full"
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl mb-0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {isEditMode ? "✏️ Edit Your Word Map" : "Create New Word Map"}
            </h1>
            <p className="text-blue-100">
              {isEditMode ? "Make changes to your word map" : "Add a new word to your vocabulary vault"}
            </p>
          </div>
          
          {/* Mastery Level Indicator */}
          <div className="bg-white bg-opacity-10 rounded-lg p-4 mx-6">
            <div className="text-center">
              <div className="text-sm font-medium text-blue-100 mb-2">Learning Levels</div>
              <div className="flex space-x-1">
                {[
                  { level: 0, label: 'New', color: 'bg-red-500' },
                  { level: 1, label: 'Learning', color: 'bg-orange-500' },
                  { level: 2, label: 'Familiar', color: 'bg-yellow-500' },
                  { level: 3, label: 'Good', color: 'bg-blue-500' },
                  { level: 4, label: 'I Know It!', color: 'bg-green-500' }
                ].map(({ level, label, color }) => (
                  <div
                    key={level}
                    className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}
                    title={`Level ${level}: ${label}`}
                  >
                    <span className="text-xs font-bold text-white">{level}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-blue-100 mt-1">Review Progress</div>
            </div>
          </div>
          
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <Card className="rounded-t-none shadow-lg">
        <CardContent className="p-8">


          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selection */}
            {templates && templates.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Choose Your Learning Style</h3>
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div 
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          {template.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Why it works:</span> {template.description}
                            </p>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedTemplate?.id === template.id 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedTemplate?.id === template.id && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Frayer Model-Inspired Layout */}
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Central Word Circle */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-full border-4 border-blue-200 text-center">
                <Label htmlFor="word" className="text-lg font-semibold text-gray-800 block mb-3">
                  📝 Word/Concept
                </Label>
                <div className="max-w-xs mx-auto space-y-3">
                  <div className="relative">
                    <Input
                      id="word"
                      value={formData.word}
                      onChange={(e) => handleInputChange("word", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.word.trim()) {
                          e.preventDefault();
                          window.open(getMerriamWebsterUrl(formData.word), '_blank');
                        }
                      }}
                      placeholder="Enter word..."
                      className="text-xl py-3 text-center font-bold border-2 border-blue-300 focus:border-blue-500"
                    />
                    {isLoadingDictionary && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Part of Speech */}
                  <Select value={formData.partOfSpeech} onValueChange={(value) => handleInputChange("partOfSpeech", value)}>
                    <SelectTrigger className="text-sm border-2 border-blue-300 focus:border-blue-500">
                      <SelectValue placeholder="Part of speech..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="noun">Noun</SelectItem>
                      <SelectItem value="verb">Verb</SelectItem>
                      <SelectItem value="adjective">Adjective</SelectItem>
                      <SelectItem value="adverb">Adverb</SelectItem>
                      <SelectItem value="pronoun">Pronoun</SelectItem>
                      <SelectItem value="preposition">Preposition</SelectItem>
                      <SelectItem value="conjunction">Conjunction</SelectItem>
                      <SelectItem value="interjection">Interjection</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Quick Action Buttons */}
                  {formData.word.trim() && (
                    <div className="space-y-2">
                      <div className="flex justify-center space-x-1">
                      <Button
                        type="button"
                        onClick={() => window.open(getMerriamWebsterUrl(formData.word), '_blank')}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Book className="h-3 w-3 mr-1" />
                        Dictionary
                      </Button>
                      <Button
                        type="button"
                        onClick={fetchPronunciationAudio}
                        disabled={isLoadingDictionary}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        Audio
                      </Button>
                      <Button
                        type="button"
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(formData.word)}&tbm=isch`, '_blank')}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Images
                      </Button>
                      <Button
                        type="button"
                        onClick={() => openSnappyWords(formData.word)}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                        title="See visual connections between words - synonyms, related words, and word families"
                      >
                        <Network className="h-3 w-3 mr-1" />
                        Word Map
                      </Button>
                      </div>
                      <div className="text-xs text-center text-gray-500 px-2">
                        💡 <strong>Word Map</strong> shows visual connections between words - perfect for exploring synonyms and word families!
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Pronunciation Audio Player */}
                {pronunciationAudio && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Volume2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">Pronunciation ready</span>
                      <audio controls className="ml-2 h-8">
                        <source src={pronunciationAudio} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
              </div>

              {/* Frayer Model Quadrants */}
              {selectedTemplate && !templatesLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedTemplate.fields as FieldConfig[])
                    ?.sort((a, b) => a.order - b.order)
                    ?.map((field, index) => (
                      <div key={field.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{index + 1}</span>
                          </div>
                          <Label htmlFor={field.id} className="font-semibold text-gray-800">
                            {field.name}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        </div>
                        {renderFieldCompact(field)}
                      </div>
                    ))}
                </div>
              )}
              
              {/* Cloze Sentence Feature */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label htmlFor="clozeSentence" className="font-semibold text-gray-800 mb-2 block">
                  Cloze Sentence (Optional)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Create a sentence using your vocabulary word. The system will replace the word with underscores (__) for practice.
                </p>
                <Textarea
                  id="clozeSentence"
                  value={formData.clozeSentence}
                  onChange={(e) => handleInputChange("clozeSentence", e.target.value)}
                  placeholder={`Example: "The ${formData.word || 'word'} was very important in the story."`}
                  className="min-h-[80px] border-yellow-300 focus:border-yellow-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                    }
                  }}
                />
                {formData.clozeSentence && formData.word && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-gray-700">
                      <strong>Preview:</strong> {formData.clozeSentence.replace(
                        new RegExp(`\\b${formData.word}\\b`, 'gi'), 
                        '____'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            {createdCardId ? (
              <div className="text-center space-y-6 pt-6">
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-900 mb-2">Success!</h3>
                  <p className="text-green-700">Your vocabulary card for <strong>"{formData.word}"</strong> has been created and is ready for learning.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button
                    onClick={() => navigate(`/frayer/${createdCardId}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Word Map
                  </Button>
                  <Button
                    onClick={() => navigate("/practice")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Practice Now
                  </Button>
                  <Button
                    onClick={() => {
                      // Clear form and reset for new card
                      setCreatedCardId(null);
                      setFormData({
                        word: "",
                        partOfSpeech: "",
                        definition: "",
                        characteristics: "",
                        examples: "",
                        nonExamples: "",
                        personalConnection: "",
                        clozeSentence: "",
                      });
                      setDynamicFieldData({});
                      setImageUrls([]);
                      setPronunciationAudio(null);
                    }}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Make Another Word Map
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCard.isPending || updateCard.isPending || isSubmitting}
                  className="bg-primary hover:bg-blue-600"
                >
                  {(createCard.isPending || updateCard.isPending || isSubmitting) ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditMode ? "Update Word Map" : "Create Word Map"
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
