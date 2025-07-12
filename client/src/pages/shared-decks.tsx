import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Share2, Download, Plus, Search, BookOpen, Users, ExternalLink, Copy, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const createDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type CreateDeckForm = z.infer<typeof createDeckSchema>;

export default function SharedDecks() {
  const [assignmentCode, setAssignmentCode] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateDeckForm>({
    resolver: zodResolver(createDeckSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  // Get teacher assignments (word collections sent to student)
  const { data: teacherAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/teacher-assignments"],
  });

  // Get my created collections (for teachers)
  const { data: myCollections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ["/api/teacher-collections"],
  });

  // Create teacher assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: CreateDeckForm) => {
      return await apiRequest("/api/teacher-assignments", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
          cardCount: 0,
          studentsAssigned: 0,
          teacherName: "Current Teacher", // This would come from auth in real app
        }),
      });
    },
    onSuccess: (assignment) => {
      toast({
        title: "Assignment Created",
        description: `Assignment "${assignment.name}" created with code: ${assignment.assignmentCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-collections"] });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  // Import deck mutation
  const importDeckMutation = useMutation({
    mutationFn: async (deckId: number) => {
      return await apiRequest(`/api/shared-decks/${deckId}/import`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Imported ${data.cardsImported} word maps successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to import deck",
        variant: "destructive",
      });
    },
  });

  // Get assignment by code
  const getAssignmentMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest(`/api/teacher-assignments/code/${code}`);
    },
    onSuccess: (assignment) => {
      toast({
        title: "Found Assignment",
        description: `Found "${assignment.name}" with ${assignment.cardCount} word maps from your teacher`,
      });
      // Auto-import the assignment
      importAssignmentMutation.mutate(assignment.id);
    },
    onError: (error) => {
      toast({
        title: "Not Found",
        description: "No assignment found with that code. Check with your teacher.",
        variant: "destructive",
      });
    },
  });

  // Import assignment
  const importAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest(`/api/teacher-assignments/${assignmentId}/import`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Added",
        description: `Added ${data.cardsImported} word maps from your teacher to your collection!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary-cards"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add assignment to your collection",
        variant: "destructive",
      });
    },
  });

  const handleCreateDeck = (data: CreateDeckForm) => {
    createAssignmentMutation.mutate(data);
  };

  const handleImportDeck = (deckId: number) => {
    importDeckMutation.mutate(deckId);
  };

  const handleGetAssignment = () => {
    if (assignmentCode.trim()) {
      getAssignmentMutation.mutate(assignmentCode.trim());
    }
  };

  const handleCopyAssignmentCode = (assignmentCode: string) => {
    navigator.clipboard.writeText(assignmentCode);
    toast({
      title: "Copied",
      description: "Assignment code copied to clipboard",
    });
  };

  // No filtering needed for teacher assignments - they're already personalized

  const AssignmentCard = ({ assignment, showImport = false, showCode = false, isTeacher = false }: any) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{assignment.name}</CardTitle>
            <CardDescription className="mt-1">
              {assignment.description || "No description"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {assignment.dueDate && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {assignment.cardCount} word maps
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {isTeacher ? `${assignment.studentsAssigned || 0} students` : `From ${assignment.teacherName}`}
            </div>
            {assignment.completedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <Award className="h-4 w-4" />
                Completed
              </div>
            )}
          </div>

          {showCode && (
            <div className="flex items-center gap-2 bg-muted p-2 rounded">
              <span className="text-sm font-mono">{assignment.assignmentCode}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyAssignmentCode(assignment.assignmentCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            {showImport && !assignment.completedAt && (
              <Button
                variant="default"
                size="sm"
                onClick={() => importAssignmentMutation.mutate(assignment.id)}
                disabled={importAssignmentMutation.isPending}
              >
                <Download className="h-4 w-4 mr-1" />
                Add to My Collection
              </Button>
            )}
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Preview Words
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Teacher Assignments
        </h1>
        <p className="text-gray-600">
          Get word collections from your teachers
        </p>
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="enter-code">Enter Assignment Code</TabsTrigger>
          <TabsTrigger value="create-assignment">Create Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignmentsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : teacherAssignments.length > 0 ? (
              teacherAssignments.map((assignment: any) => (
                <AssignmentCard key={assignment.id} assignment={assignment} showImport />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No assignments yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Your teacher will send you word collections to practice
                </p>
                <p className="text-sm text-gray-500">
                  Ask your teacher for an assignment code to get started
                </p>
              </div>
            )}
          </div>
        </TabsContent>



        <TabsContent value="enter-code" className="space-y-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Enter Assignment Code
            </h2>
            <div className="space-y-4">
              <Input
                placeholder="Enter code from teacher (e.g. VOCAB123)"
                value={assignmentCode}
                onChange={(e) => setAssignmentCode(e.target.value.toUpperCase())}
                className="text-center font-mono"
              />
              <Button
                onClick={handleGetAssignment}
                disabled={!assignmentCode.trim() || getAssignmentMutation.isPending}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-1" />
                Get Assignment
              </Button>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              Enter the assignment code your teacher gave you to add new word maps to your collection
            </p>
          </div>
        </TabsContent>

        <TabsContent value="create-assignment" className="space-y-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Create New Assignment
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateDeck)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science Vocabulary Week 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the vocabulary topic..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </form>
            </Form>
            <p className="text-sm text-gray-600 text-center mt-4">
              Students will use the assignment code to add these word maps to their collection
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}