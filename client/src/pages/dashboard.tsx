import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressTracker } from "@/components/progress-tracker";
import { useDueReviewSessions, useRecentActivity, useMasteryLevelCounts } from "@/hooks/use-review-session";
import { useVocabularyCards } from "@/hooks/use-vocabulary";
import { Clock, Plus, Trophy, BookOpen, Settings, Brain, Target, TrendingUp, Calendar, Star, Zap, Share2, Users, RotateCcw } from "lucide-react";
import { getDifficultyLabel, getDifficultyColor } from "@/lib/spaced-repetition";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [userRole, setUserRoleState] = useState<"student" | "teacher">("student");
  
  const { data: dueReviews, isLoading: reviewsLoading } = useDueReviewSessions();
  const { data: vocabularyCards, isLoading: cardsLoading } = useVocabularyCards();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity();
  const { data: masteryLevels, isLoading: masteryLoading } = useMasteryLevelCounts();

  // Get user role on component mount
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const response = await fetch("/api/user/role");
        const data = await response.json();
        setUserRoleState(data.role);
      } catch (error) {
        console.error("Error getting user role:", error);
      }
    };
    getUserRole();
  }, []);

  const setUserRole = async (role: "student" | "teacher") => {
    try {
      await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      setUserRoleState(role);
      window.location.reload(); // Refresh to show appropriate interface
    } catch (error) {
      console.error("Error setting user role:", error);
    }
  };

  const dueCount = dueReviews?.length || 0;
  const totalCards = vocabularyCards?.length || 0;
  const newCards = vocabularyCards?.filter(card => 
    new Date(card.createdAt!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  ).length || 0;
  
  // Priority learning: Current unit words (last 20 cards created)
  const currentUnitCards = vocabularyCards?.slice(-20) || [];
  const currentUnitDue = dueReviews?.filter(review => 
    currentUnitCards.some(card => card.id === review.cardId)
  ).length || 0;
  
  // Calculate learning progress (5-level system: 0-4)
  const masteredCards = masteryLevels?.level4 || 0;
  const learningCards = (masteryLevels?.level2 || 0) + (masteryLevels?.level3 || 0);
  const reviewCards = masteryLevels?.level1 || 0;
  const practiceCards = masteryLevels?.level0 || 0;
  const progressPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  // Recent activity with mock data if empty (for demo purposes)
  const activityData = recentActivity && recentActivity.length > 0 
    ? recentActivity 
    : [];

  // Redirect to teacher dashboard if user is a teacher
  if (userRole === "teacher") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-lg text-gray-600">Manage your classroom and student vocabulary</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Classroom */}
          <Card className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Create Classroom</h3>
                  <p className="text-sm text-gray-600">Set up your class</p>
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create New Classroom
              </Button>
            </CardContent>
          </Card>

          {/* Manage Students */}
          <Card className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Students</h3>
                  <p className="text-sm text-gray-600">Assign vocabulary</p>
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <BookOpen className="h-4 w-4 mr-2" />
                Assign Words
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Management */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Settings className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Management</h3>
                <p className="text-sm text-gray-600">Reset for new semester</p>
              </div>
            </div>
            <Button 
              onClick={async () => {
                if (confirm("This will clear all student data. Are you sure?")) {
                  try {
                    await fetch("/api/teacher/reset-semester", { method: "POST" });
                    alert("System reset successfully!");
                  } catch (error) {
                    console.error("Error resetting semester:", error);
                  }
                }
              }}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset for New Semester
            </Button>
          </CardContent>
        </Card>

        {/* Role Switch */}
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Switch to Student View</h3>
                <p className="text-sm text-gray-600">Test the student experience</p>
              </div>
              <Button 
                onClick={() => setUserRole("student")}
                variant="outline"
                size="sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Student View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Welcome to Brainy Vocab Vault! 🎉</h1>
            <p className="text-lg text-gray-600">Master vocabulary through intelligent spaced repetition</p>
          </div>
        </div>
        
        {/* Role Selection - Only show for students */}
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={() => setUserRole("teacher")}
            variant="outline" 
            size="sm" 
            className="text-sm border-green-200 hover:bg-green-50"
          >
            <Users className="h-4 w-4 mr-2" />
            I'm a Teacher
          </Button>
        </div>
        
        {/* Overall Progress */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Learning Progress</span>
            <span className="font-semibold text-gray-900">{masteredCards}/{totalCards} mastered</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-gray-500">{progressPercentage}% of your vocabulary mastered</p>
        </div>
      </div>

      {/* Priority Learning Section */}
      {currentUnitCards.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Current Unit Priority</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Latest {currentUnitCards.length} words
            </Badge>
          </div>
          <p className="text-gray-600 mb-4">
            Focus on your most recent vocabulary before reviewing older words. This approach follows proven learning methodology.
          </p>
          
          {currentUnitDue > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-gray-900">{currentUnitDue} priority words ready for review</span>
              </div>
              <Link href="/review">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Target className="h-4 w-4 mr-2" />
                  Priority Review
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-green-600 font-semibold flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>All priority words up to date!</span>
            </p>
          )}
        </div>
      )}

      {/* Study Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Review Due Card - ATTENTION GRABBING */}
        <Card className="hover:shadow-xl transition-all hover:scale-110 border-l-4 border-l-orange-500 ring-2 ring-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Study Cards</h3>
                  <p className="text-sm text-gray-600 font-medium">SRS algorithm ready</p>
                </div>
              </div>
              <span className="text-4xl font-black text-orange-600">
                {reviewsLoading ? "..." : dueCount}
              </span>
            </div>
            <Link href="/review">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Clock className="h-5 w-5 mr-2" />
                Start Learning Practice
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Add New Words - ATTENTION GRABBING */}
        <Card className="hover:shadow-xl transition-all hover:scale-110 border-l-4 border-l-green-500 ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Make a Card</h3>
                  <p className="text-sm text-gray-600 font-medium">Expand vocabulary</p>
                </div>
              </div>
              <span className="text-4xl font-black text-green-600">+</span>
            </div>
            <Link href="/card-creation">
              <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Plus className="h-5 w-5 mr-2" />
                Create New Card
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Total Cards */}
        <Card className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Total Vocabulary</h3>
                  <p className="text-sm text-gray-600">Words collected</p>
                </div>
              </div>
              <span className="text-3xl font-bold text-purple-600">
                {cardsLoading ? "..." : totalCards}
              </span>
            </div>
            <div className="text-sm text-gray-600 font-medium mb-3">
              {masteredCards} mastered • {learningCards} learning • {reviewCards} review • {practiceCards} practice
            </div>
            <Link href="/cards">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <BookOpen className="h-5 w-5 mr-2" />
                See All My Word Maps
              </Button>
            </Link>
          </CardContent>
        </Card>



        {/* Extra Practice */}
        <Card className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Extra Practice</h3>
                  <p className="text-sm text-gray-600">No limit training</p>
                </div>
              </div>
            </div>
            <Link href="/practice">
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                <Trophy className="h-5 w-5 mr-2" />
                Extra Practice
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Progress Tracker */}
      <ProgressTracker />

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Recent Work</h3>
          
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activityData && activityData.length > 0 ? (
            <div className="space-y-3">
              {activityData.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.type === 'created' ? (
                      <Plus className="h-5 w-5 text-blue-600" />
                    ) : activity.type === 'review' ? (
                      <Clock className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Trophy className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'created' ? 'Added' : 'Reviewed'} 
                      <span className="font-bold text-blue-600 ml-1">"{activity.word}"</span>
                    </p>
                    <p className="text-xs text-gray-600">{activity.details}</p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              {activityData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No recent activity yet</p>
                  <p className="text-sm">Start by adding your first vocabulary card!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent activity</p>
              <p className="text-sm">Start by adding your first vocabulary word!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastery Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Learning Progress Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Mastered</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{masteredCards}</span>
                  <p className="text-xs text-gray-500">Review every 30+ days</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Learning</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">{learningCards}</span>
                  <p className="text-xs text-gray-500">Active review cycle</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">New</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gray-600">{practiceCards}</span>
                  <p className="text-xs text-gray-500">Need first review</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SRS Algorithm Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span>Spaced Repetition System</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Brainy Vocab Vault uses an intelligent SRS algorithm that schedules reviews based on your memory strength:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-700">Practice Again - Immediate review</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700">Review - Short interval</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-700">Learning - Building memory</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">Familiar - Extended intervals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700">Words I Know Well - Long-term retention</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <Star className="h-3 w-3 inline mr-1" />
                  Words can appear again in the same session if you need more practice (Level 0).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Floating Action Button */}
      <Link href="/card-creation">
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
