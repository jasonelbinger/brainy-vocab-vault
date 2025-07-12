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

type Assignment = {
  id: number;
  name: string | null;
  description: string | null;
  cardCount: number | null;
  studentsAssigned: number | null;
  dueDate?: string | null;
  completedAt?: string | null;
  teacherName?: string | null;
  assignmentCode?: string | null;
};

export default function SharedDecks() {
  const [assignmentCode, setAssignmentCode] = useState("");
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

  const { data: teacherAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/teacher-assignments"],
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: CreateDeckForm) => {
      return await apiRequest("/api/teacher-assignments", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          cardCount: 0,
          studentsAssigned: 0,
          teacherName: "Current Teacher",
        }),
      });
    },
    onSuccess: (assignment: Assignment) => {
      toast({
        title: "Assignment Created",
        description: `Assignment "${assignment.name ?? "Untitled"}" created with code: ${assignment.assignmentCode ?? "N/A"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-collections"] });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  const getAssignmentMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest(`/api/teacher-assignments/code/${code}`);
    },
    onSuccess: (assignment: Assignment) => {
      toast({
        title: "Found Assignment",
        description: `Found "${assignment.name ?? "Untitled"}" with ${assignment.cardCount ?? 0} word maps`,
      });
      importAssignmentMutation.mutate(assignment.id);
    },
    onError: () => {
      toast({
        title: "Not Found",
        description: "No assignment found with that code. Check with your teacher.",
        variant: "destructive",
      });
    },
  });

  const importAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest(`/api/teacher-assignments/${assignmentId}/import`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Added",
        description: `Added ${data.cardsImported} word maps to your collection`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vocabulary-cards"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add assignment",
        variant: "destructive",
      });
    },
  });

  const AssignmentCard = ({
    assignment,
    showImport = false,
    showCode = false,
    isTeacher = false,
  }: {
    assignment: Assignment;
    showImport?: boolean;
    showCode?: boolean;
    isTeacher?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{assignment.name ?? "Untitled"}</CardTitle>
            <CardDescription className="mt-1">
              {assignment.description ?? "No description"}
            </CardDescription>
          </div>
          {assignment.dueDate && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {assignment.cardCount ?? 0} word maps
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {isTeacher
                ? `${assignment.studentsAssigned ?? 0} students`
                : `From ${assignment.teacherName ?? "Unknown"}`}
            </div>
            {assignment.completedAt && (
              <div className="flex items-center gap-1 text-green-600">
                <Award className="h-4 w-4" />
                Completed
              </div>
            )}
          </div>

          {showCode && assignment.assignmentCode && (
            <div className="flex items-center gap-2 bg-muted p-2 rounded">
              <span className="text-sm font-mono">{assignment.assignmentCode}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(assignment.assignmentCode!);
                  toast({ title: "Copied", description: "Assignment code copied" });
                }}
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
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="enter-code">Enter Assignment Code</TabsTrigger>
          <TabsTrigger value="create-assignment">Create Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignmentsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
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
              : teacherAssignments.map((assignment: Assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} showImport />
                ))}
          </div>
        </TabsContent>

        <TabsContent value="enter-code" className="space-y-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">Enter Assignment Code</h2>
            <Input
              placeholder="Enter code (e.g. VOCAB123)"
              value={assignmentCode}
              onChange={(e) => setAssignmentCode(e.target.value.toUpperCase())}
              className="text-center font-mono"
            />
            <Button
              onClick={() => getAssignmentMutation.mutate(assignmentCode)}
              disabled={!assignmentCode.trim()}
              className="w-full mt-4"
            >
              <Download className="h-4 w-4 mr-1" />
              Get Assignment
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="create-assignment" className="space-y-6">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">Create New Assignment</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createAssignmentMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science Week 1" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Topic description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
