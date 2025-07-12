import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useVocabularyCards } from "@/hooks/use-vocabulary";
import { getDifficultyColor, getDifficultyLabel } from "@/lib/spaced-repetition";
import { ArrowLeft, Search, Eye, Edit, BookOpen } from "lucide-react";

export default function CardList() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: cards, isLoading } = useVocabularyCards();

  const filteredCards = cards?.filter(card => 
    card.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.definition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.partOfSpeech?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/")}
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Vocabulary Cards</h1>
            <p className="text-gray-600 mt-1">
              {filteredCards.length} of {cards?.length || 0} cards
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/card-creation")}
          className="bg-primary hover:bg-primary/90"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Create New Card
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search cards by word, definition, or part of speech..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm ? "No cards match your search" : "No cards found"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? "Try adjusting your search terms" : "Create your first vocabulary card to get started"}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => navigate("/card-creation")}
              className="bg-primary hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Create Your First Card
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 truncate">
                    {card.word}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {card.partOfSpeech && (
                      <Badge variant="outline" className="text-xs">
                        {card.partOfSpeech}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {card.definition && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Definition</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {card.definition}
                      </p>
                    </div>
                  )}
                  
                  {card.examples && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Example</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {card.examples}
                      </p>
                    </div>
                  )}

                  {card.imageUrls && card.imageUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Images</h4>
                      <div className="flex space-x-2">
                        {card.imageUrls.slice(0, 3).map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`${card.word} visual ${index + 1}`}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        ))}
                        {card.imageUrls.length > 3 && (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{card.imageUrls.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      Created {new Date(card.createdAt || '').toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => navigate(`/frayer/${card.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => navigate(`/card-creation?edit=${card.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}