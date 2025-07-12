import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Trophy, Zap, Users, Star } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-gray-900">Brainy Vocab Vault</h1>
              <p className="text-xl text-gray-600 mt-2">Master new vocab through brainy spaced repetition</p>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Transform your vocabulary learning with scientifically-proven methods. Our platform combines the powerful Frayer Model 
            with adaptive spaced repetition to make every word stick permanently in your memory.
          </p>
          
          <Button 
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg font-semibold"
          >
            Start Learning Today
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span>Frayer Model Learning</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Build deep understanding with definition, characteristics, examples, and visual connections for each word.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Zap className="h-6 w-6 text-purple-600" />
                <span>Smart Spaced Repetition</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                5-level mastery system that optimizes review timing based on your performance and memory strength.
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Trophy className="h-6 w-6 text-green-600" />
                <span>Progress Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Visual analytics show your learning journey with mastery levels, daily goals, and achievement milestones.
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-orange-600" />
                <span>Classroom Ready</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Teachers can create classrooms, assign vocabulary sets, and monitor student progress in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Star className="h-6 w-6 text-indigo-600" />
                <span>Multimedia Support</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Add images, audio pronunciations, and personal connections to create rich, memorable vocabulary cards.
              </p>
            </CardContent>
          </Card>

          <Card className="border-pink-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-pink-600" />
                <span>Adaptive Learning</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Priority learning system focuses on your current vocabulary unit while maintaining long-term retention.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Vocabulary?</h2>
          <p className="text-lg text-gray-600 mb-6">
            Join thousands of learners who are mastering vocabulary faster and more effectively than ever before.
          </p>
          <Button 
            onClick={handleLogin}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-lg font-semibold"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    </div>
  );
}