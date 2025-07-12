import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TemplateEditor } from "@/components/template-editor";
import { useCardTemplates, useCreateCardTemplate, useUpdateCardTemplate, useDeleteCardTemplate } from "@/hooks/use-card-templates";
import { useToast } from "@/hooks/use-toast";
import { CardTemplate, FieldConfig } from "@shared/schema";
import { Plus, Edit, Trash2, Settings, X } from "lucide-react";

export default function TemplateManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: templates, isLoading } = useCardTemplates();
  const createTemplate = useCreateCardTemplate();
  const updateTemplate = useUpdateCardTemplate();
  const deleteTemplate = useDeleteCardTemplate();
  
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTemplate = async (templateData: { name: string; fields: FieldConfig[] }) => {
    try {
      await createTemplate.mutateAsync({
        name: templateData.name,
        isDefault: false,
        fields: templateData.fields,
      });
      
      toast({
        title: "Template created",
        description: `"${templateData.name}" has been created successfully`,
      });
      
      setIsCreating(false);
    } catch (error) {
      toast({
        title: "Failed to create template",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTemplate = async (templateData: { name: string; fields: FieldConfig[] }) => {
    if (!editingTemplate) return;
    
    try {
      await updateTemplate.mutateAsync({
        id: editingTemplate.id,
        template: {
          name: templateData.name,
          fields: templateData.fields,
        },
      });
      
      toast({
        title: "Template updated",
        description: `"${templateData.name}" has been updated successfully`,
      });
      
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: "Failed to update template",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (template: CardTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteTemplate.mutateAsync(template.id);
      
      toast({
        title: "Template deleted",
        description: `"${template.name}" has been deleted`,
      });
    } catch (error) {
      toast({
        title: "Failed to delete template",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (isCreating || editingTemplate) {
    return (
      <div className="max-w-6xl mx-auto">
        <TemplateEditor
          template={editingTemplate || undefined}
          onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          onCancel={() => {
            setIsCreating(false);
            setEditingTemplate(null);
          }}
          isLoading={createTemplate.isPending || updateTemplate.isPending}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center space-x-2">
                <Settings className="h-6 w-6" />
                <span>Card Templates</span>
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Customize the fields for your vocabulary cards. Create different templates for different learning styles.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="icon"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                        {template.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        {(template.fields as FieldConfig[])?.length || 0} fields configured
                      </p>
                      <div className="text-xs text-gray-500">
                        Fields: {(template.fields as FieldConfig[])?.map(f => f.name).join(', ') || 'None'}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setEditingTemplate(template)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {!template.isDefault && (
                        <Button
                          onClick={() => handleDeleteTemplate(template)}
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteTemplate.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
              <p className="text-gray-600 mb-6">
                Create your first card template to customize the fields for your vocabulary cards.
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}