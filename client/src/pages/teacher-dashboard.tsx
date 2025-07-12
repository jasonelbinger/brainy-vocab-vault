import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, BookOpen, Settings, Plus, RotateCcw, GraduationCap, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboard() {
  const [classroomName, setClassroomName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false);
  const [isResettingSystem, setIsResettingSystem] = useState(false);
  const { toast } = useToast();

  const createClassroom = async () => {
    if (!classroomName.trim()) return;
    
    setIsCreatingClassroom(true);
    try {
      const response = await fetch("/api/teacher/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: classroomName }),
      });
      
      if (response.ok) {
        const classroom = await response.json();
        setClassCode(classroom.classCode);
        setClassroomName("");
        toast({
          title: "Classroom Created!",
          description: `Class code: ${classroom.classCode}`,
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error Creating Classroom",
          description: error.message || "Failed to create classroom",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClassroom(false);
    }
  };

  const resetForNewSemester = async () => {
    if (!confirm("This will clear all student vocabulary data. Are you sure?")) return;
    
    setIsResettingSystem(true);
    try {
      const response = await fetch("/api/teacher/reset-semester", {
        method: "POST",
      });
      
      if (response.ok) {
        toast({
          title: "System Reset Complete",
          description: "All student data cleared for new semester",
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error Resetting System",
          description: error.message || "Failed to reset system",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resetting semester:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingSystem(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
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
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-600" />
              <span>Create Classroom</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="classroom-name">Classroom Name</Label>
              <Input
                id="classroom-name"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                placeholder="e.g., Grade 5 English"
              />
            </div>
            <Button 
              onClick={createClassroom}
              disabled={isCreatingClassroom || !classroomName.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isCreatingClassroom ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </>
              )}
            </Button>
            {classCode && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Class Code: <span className="font-bold text-lg">{classCode}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Share this code with students to join your classroom
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Students */}
        <Card className="hover:shadow-lg transition-all hover:scale-105 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Manage Students</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Students will join your classroom using the class code. Once they join, you can assign vocabulary words to them.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Active Students</span>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Total Vocabulary Assigned</span>
                <Badge variant="secondary">0</Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              disabled
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Assign Vocabulary (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Management */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span>System Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800 mb-2">New Semester Reset</h3>
            <p className="text-sm text-orange-700 mb-4">
              Clear all student vocabulary data to start fresh for a new semester. This action cannot be undone.
            </p>
            <Button 
              onClick={resetForNewSemester}
              disabled={isResettingSystem}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isResettingSystem ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset for New Semester
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold text-blue-800">Create Your Classroom</h4>
                <p className="text-sm text-blue-700">Give your classroom a name and get a unique class code</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold text-blue-800">Share Class Code</h4>
                <p className="text-sm text-blue-700">Students use this code to join your classroom</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold text-blue-800">Assign Vocabulary</h4>
                <p className="text-sm text-blue-700">Send vocabulary words to students (feature coming soon)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}