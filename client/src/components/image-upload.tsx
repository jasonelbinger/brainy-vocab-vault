import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  onImagesChange?: (urls: string[]) => void;
  initialImageUrls?: string[];
  className?: string;
  searchTerm?: string;
  maxImages?: number;
}

export function ImageUpload({ 
  onImagesChange, 
  initialImageUrls = [],
  className = "",
  searchTerm = "",
  maxImages = 3
}: ImageUploadProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  

  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with initial URLs and update when they change
  useEffect(() => {
    // Always update when initialImageUrls changes, including when cleared
    if (JSON.stringify(imageUrls) !== JSON.stringify(initialImageUrls)) {
      setImageUrls(initialImageUrls);
    }
  }, [initialImageUrls]); // React to changes in initialImageUrls

  const [isImageAreaFocused, setIsImageAreaFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle paste functionality only when image area is focused
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if the image upload area is focused
      if (!isImageAreaFocused) return;
      

      const items = e.clipboardData?.items;
      if (items && imageUrls.length < maxImages) {
        console.log('Items found:', items.length);
        
        // Check for image files first
        for (let i = 0; i < items.length; i++) {
          console.log('Item type:', items[i].type);
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              console.log('Image blob found, size:', blob.size);
              e.preventDefault();
              
              // Create a FileReader to convert blob to data URL for persistence
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                if (dataUrl) {
                  console.log('Data URL created successfully, length:', dataUrl.length);
                  setImageUrls(prevUrls => {
                    const updatedUrls = [...prevUrls, dataUrl];
                    console.log('Updated image URLs count:', updatedUrls.length);
                    // Use setTimeout to avoid React warning about setState during render
                    setTimeout(() => onImagesChange?.(updatedUrls), 0);
                    return updatedUrls;
                  });
                }
              };
              reader.onerror = () => {
                console.error('Error reading image file');
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
        
        // Check for text URLs
        for (let i = 0; i < items.length; i++) {
          if (items[i].type === 'text/plain') {
            items[i].getAsString((text) => {
              console.log('Pasted text:', text);
              const trimmedText = text.trim();
              // Check if the text is a valid URL or data URL that might be an image
              if (trimmedText.startsWith('data:image/') ||
                  trimmedText.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i) ||
                  trimmedText.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                  trimmedText.includes('images.google.com') ||
                  trimmedText.includes('googleapis.com') ||
                  trimmedText.includes('imgur.com') ||
                  trimmedText.includes('unsplash.com') ||
                  trimmedText.includes('pixabay.com') ||
                  trimmedText.includes('pexels.com')) {
                console.log('Valid image URL detected, adding:', trimmedText.substring(0, 50) + '...');
                setImageUrls(prevUrls => {
                  const updatedUrls = [...prevUrls, trimmedText];
                  console.log('Image URLs now:', updatedUrls.length);
                  // Use setTimeout to avoid React warning about setState during render
                  setTimeout(() => onImagesChange?.(updatedUrls), 0);
                  return updatedUrls;
                });
              } else {
                console.log('Text is not a valid image URL');
              }
            });
            e.preventDefault();
            break;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [imageUrls, maxImages, onImagesChange, isImageAreaFocused]);

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const availableSlots = maxImages - imageUrls.length;
    const filesToProcess = fileArray.slice(0, availableSlots);
    
    let processedCount = 0;
    const newUrls: string[] = [];
    
    filesToProcess.forEach(file => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            newUrls.push(dataUrl);
            processedCount++;
            
            // Update URLs when all files are processed
            if (processedCount === filesToProcess.length) {
              const updatedUrls = [...imageUrls, ...newUrls];
              setImageUrls(updatedUrls);
              setTimeout(() => onImagesChange?.(updatedUrls), 0);
            }
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (indexToRemove: number) => {
    const updatedUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    setImageUrls(updatedUrls);
    onImagesChange?.(updatedUrls);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    if (imageUrls.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const openGoogleImages = () => {
    const searchQuery = encodeURIComponent(searchTerm || "vocabulary");
    console.log('Opening Google Images for:', searchQuery); // Debug log
    const googleImagesUrl = `https://www.google.com/search?q=${searchQuery}&tbm=isch`;
    window.open(googleImagesUrl, '_blank');
  };

  const handleUrlAdd = () => {
    if (urlInput.trim() && imageUrls.length < maxImages) {
      const updatedUrls = [...imageUrls, urlInput.trim()];
      setImageUrls(updatedUrls);
      onImagesChange?.(updatedUrls);
      setUrlInput("");
    }
  };

  const canAddMore = imageUrls.length < maxImages;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div 
          className="space-y-3"
          ref={containerRef}
          onMouseEnter={() => setIsImageAreaFocused(true)}
          onMouseLeave={() => setIsImageAreaFocused(false)}
          onFocus={() => setIsImageAreaFocused(true)}
          onBlur={() => setIsImageAreaFocused(false)}
          tabIndex={0}
        >
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-900">
              Visual Aid (up to {maxImages} images)
            </label>
            <span className="text-sm text-gray-500">
              {imageUrls.length}/{maxImages}
            </span>
          </div>

          {/* Display current images */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-80 hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload area */}
          {canAddMore && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? "border-blue-500 bg-blue-50" 
                  : isImageAreaFocused 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-300 hover:border-gray-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                Drop images, click to browse, or hover here and paste from clipboard
              </p>
              <p className="text-xs text-gray-400">
                Support JPG, PNG, GIF files and image URLs
              </p>
              {isImageAreaFocused && (
                <p className="text-xs text-green-600 font-medium">
                  Ready to paste! Use Ctrl+V (or Cmd+V on Mac)
                </p>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* URL input */}
          {canAddMore && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Or paste image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                />
                <Button
                  type="button"
                  onClick={handleUrlAdd}
                  disabled={!urlInput.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>
              
              <Button
                type="button"
                onClick={openGoogleImages}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Search Google Images
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}