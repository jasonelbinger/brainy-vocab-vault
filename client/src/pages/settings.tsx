import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useStudySettings, useUpdateStudySettings } from "@/hooks/use-review-session";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LocalStorage } from "@/lib/storage";
import { X, Download, Upload, Trash2, Save, Loader2 } from "lucide-react";

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useStudySettings();
  const updateSettings = useUpdateStudySettings();
  
  const [formData, setFormData] = useState({
    dailyGoal: 20,
    newCardsPerDay: 5,
    autoPlayAudio: true,
    level0Interval: 1,
    level1Interval: 3,
    level2Interval: 7,
    level3Interval: 30,
    enableDictionaryApi: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize form data when settings load
  useState(() => {
    if (settings) {
      setFormData({
        dailyGoal: settings.dailyGoal || 20,
        newCardsPerDay: settings.newCardsPerDay || 5,
        autoPlayAudio: settings.autoPlayAudio ?? true,
        level0Interval: settings.level0Interval || 1,
        level1Interval: settings.level1Interval || 3,
        level2Interval: settings.level2Interval || 7,
        level3Interval: settings.level3Interval || 30,
        enableDictionaryApi: settings.enableDictionaryApi ?? true,
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast({
        title: "Settings saved",
        description: "Your study preferences have been updated",
      });
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiRequest('GET', '/api/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'vocabulary-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Your vocabulary data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await apiRequest('POST', '/api/import', data);
        
        toast({
          title: "Import successful",
          description: "Your vocabulary data has been imported",
        });
        
        // Refresh the page to show imported data
        window.location.reload();
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Please check your file and try again",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      return;
    }
    
    setIsResetting(true);
    try {
      await apiRequest('POST', '/api/reset');
      LocalStorage.clear();
      
      toast({
        title: "Data reset successfully",
        description: "All vocabulary cards and progress have been deleted",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Settings</CardTitle>
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="icon"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Study Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-gray-700">Daily Goal</Label>
                  <p className="text-sm text-gray-600">Number of cards to review per day</p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.dailyGoal}
                  onChange={(e) => handleInputChange("dailyGoal", parseInt(e.target.value))}
                  className="w-20 text-center"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-gray-700">New Cards per Day</Label>
                  <p className="text-sm text-gray-600">Maximum new cards to introduce</p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.newCardsPerDay}
                  onChange={(e) => handleInputChange("newCardsPerDay", parseInt(e.target.value))}
                  className="w-20 text-center"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-gray-700">Auto-play Audio</Label>
                  <p className="text-sm text-gray-600">Automatically play pronunciation</p>
                </div>
                <Switch
                  checked={formData.autoPlayAudio}
                  onCheckedChange={(checked) => handleInputChange("autoPlayAudio", checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Spaced Repetition */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spaced Repetition</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Level 0 → 1</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.level0Interval}
                  onChange={(e) => handleInputChange("level0Interval", parseInt(e.target.value))}
                  className="text-center mt-2"
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Level 1 → 2</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.level1Interval}
                  onChange={(e) => handleInputChange("level1Interval", parseInt(e.target.value))}
                  className="text-center mt-2"
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Level 2 → 3</Label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.level2Interval}
                  onChange={(e) => handleInputChange("level2Interval", parseInt(e.target.value))}
                  className="text-center mt-2"
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Level 3 Review</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.level3Interval}
                  onChange={(e) => handleInputChange("level3Interval", parseInt(e.target.value))}
                  className="text-center mt-2"
                />
                <span className="text-xs text-gray-500">days</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* API Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Integration</h3>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium text-gray-700">Dictionary API</Label>
                <p className="text-sm text-gray-600">Enable Merriam-Webster integration</p>
              </div>
              <Switch
                checked={formData.enableDictionaryApi}
                onCheckedChange={(checked) => handleInputChange("enableDictionaryApi", checked)}
              />
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Export Data</h4>
                  <p className="text-sm text-gray-600">Download your vocabulary and progress</p>
                </div>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="bg-primary hover:bg-blue-600"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Import Data</h4>
                  <p className="text-sm text-gray-600">Upload vocabulary from file</p>
                </div>
                <Button
                  onClick={handleImport}
                  className="bg-primary hover:bg-blue-600"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <h4 className="font-medium text-red-900">Reset All Progress</h4>
                  <p className="text-sm text-red-600">This will delete all your vocabulary and progress</p>
                </div>
                <Button
                  onClick={handleReset}
                  disabled={isResetting}
                  variant="destructive"
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending}
              className="bg-primary hover:bg-blue-600"
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
