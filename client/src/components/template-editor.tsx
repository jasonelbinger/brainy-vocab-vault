import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FieldConfig, FieldType, CardTemplate } from "@shared/schema";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface TemplateEditorProps {
  template?: CardTemplate;
  onSave: (template: { name: string; fields: FieldConfig[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateEditor({ template, onSave, onCancel, isLoading }: TemplateEditorProps) {
  const [templateName, setTemplateName] = useState(template?.name || "Custom Template");
  const [fields, setFields] = useState<FieldConfig[]>(
    template?.fields as FieldConfig[] || [
      { id: 'definition', name: 'Definition', type: 'textarea', required: true, order: 1 },
    ]
  );

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'select', label: 'Single Choice' },
    { value: 'multiselect', label: 'Multiple Choice' },
    { value: 'image', label: 'Image Upload' },
    { value: 'audio', label: 'Audio Recording' },
  ];

  const addField = () => {
    const newField: FieldConfig = {
      id: `field_${Date.now()}`,
      name: 'New Field',
      type: 'text',
      required: false,
      order: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FieldConfig>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);

    // Update order values
    const fieldsWithNewOrder = reorderedFields.map((field, index) => ({
      ...field,
      order: index + 1,
    }));

    setFields(fieldsWithNewOrder);
  };

  const handleSave = () => {
    onSave({
      name: templateName,
      fields: fields.map((field, index) => ({ ...field, order: index + 1 })),
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Card Template Editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Name */}
        <div className="space-y-2">
          <Label htmlFor="templateName">Template Name</Label>
          <Input
            id="templateName"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter template name"
          />
        </div>

        {/* Fields Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Card Fields</h3>
            <Button onClick={addField} size="sm" className="bg-primary hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {fields.map((field, index) => (
                    <Draggable key={field.id} draggableId={field.id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                        >
                          <div className="flex items-start space-x-4">
                            <div {...provided.dragHandleProps} className="mt-2">
                              <GripVertical className="h-5 w-5 text-gray-400" />
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              {/* Field Name */}
                              <div className="space-y-2">
                                <Label>Field Name</Label>
                                <Input
                                  value={field.name}
                                  onChange={(e) => updateField(index, { name: e.target.value })}
                                  placeholder="Field name"
                                />
                              </div>

                              {/* Field Type */}
                              <div className="space-y-2">
                                <Label>Field Type</Label>
                                <Select
                                  value={field.type}
                                  onValueChange={(value) => updateField(index, { type: value as FieldType })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fieldTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Required Toggle */}
                              <div className="space-y-2">
                                <Label>Required</Label>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    checked={field.required}
                                    onCheckedChange={(checked) => updateField(index, { required: checked })}
                                  />
                                  <Badge variant={field.required ? "default" : "secondary"}>
                                    {field.required ? "Required" : "Optional"}
                                  </Badge>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="space-y-2">
                                <Label>Actions</Label>
                                <Button
                                  onClick={() => removeField(index)}
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Additional Options */}
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Placeholder */}
                            <div className="space-y-2">
                              <Label>Placeholder Text</Label>
                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                              />
                            </div>

                            {/* Options for select fields */}
                            {(field.type === 'select' || field.type === 'multiselect') && (
                              <div className="space-y-2">
                                <Label>Options (one per line)</Label>
                                <Textarea
                                  value={field.options?.join('\n') || ''}
                                  onChange={(e) => updateField(index, { 
                                    options: e.target.value.split('\n').filter(Boolean) 
                                  })}
                                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                                  className="h-20"
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !templateName.trim() || fields.length === 0}
            className="bg-primary hover:bg-blue-600"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}