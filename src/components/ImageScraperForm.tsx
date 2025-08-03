
"use client";

import { useState, useTransition, useRef, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Image as ImageIcon, Loader2, X, AlertCircle } from 'lucide-react';
import type { ScrapedItemData } from '@/types';
import { extractBookInfoFromImage } from '@/ai/flows/extract-book-info-flow';

interface ImageScraperFormProps {
  onScrapeStart: () => void;
  onScrapeSuccess: (data: ScrapedItemData, source: string) => void;
  onScrapeError: (error: string) => void;
  onBatchComplete: (successCount: number, errorCount: number, source: string) => void;
  isLoading: boolean;
}

// Helper to read file as data URI
const toDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageScraperForm = forwardRef<{ clear: () => void }, ImageScraperFormProps>(
  ({ onScrapeStart, onScrapeSuccess, onScrapeError, onBatchComplete, isLoading }, ref) => {
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files;
      if (newFiles) {
        let allValid = true;
        const newFileList = Array.from(newFiles);

        for (const file of newFileList) {
          if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setFileError(`File "${file.name}" is too large. Please select images under 4MB.`);
            allValid = false;
            break;
          }
        }
        
        if (allValid) {
            setFileError(null);
            // Append new files, avoiding duplicates based on name and size
            setImageFiles(prevFiles => {
                const existingFiles = new Set(prevFiles.map(f => `${f.name}-${f.size}`));
                const filteredNewFiles = newFileList.filter(f => !existingFiles.has(`${f.name}-${f.size}`));
                return [...prevFiles, ...filteredNewFiles];
            });
        }
      }
      // Reset the file input to allow selecting the same file again if removed
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    
    const handleClearImages = () => {
        setImageFiles([]);
        setFileError(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    
    const handleRemoveImage = (indexToRemove: number) => {
        setImageFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    useImperativeHandle(ref, () => ({
      clear: handleClearImages,
    }));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (imageFiles.length === 0) {
        onScrapeError("Please select one or more image files first.");
        return;
      }

      onScrapeStart();
      startTransition(async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const file of imageFiles) {
           try {
              const dataUri = await toDataURL(file);
              const result = await extractBookInfoFromImage({ photoDataUri: dataUri });
              onScrapeSuccess({
                  ...result,
                  imageUrl: dataUri,
                  sourceUrl: `Image Upload: ${file.name}`,
                  printLength: '', // Not available from image
                  fileSize: '', // Not available from image
              }, `Image: ${file.name}`);
              successCount++;
            } catch(e: any) {
              onScrapeError(e.message || `An unknown error occurred while analyzing ${file.name}.`);
              errorCount++;
            }
        }
        onBatchComplete(successCount, errorCount, 'Image Upload(s)');
      });
    };

    const currentIsLoading = isLoading || isPending;

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Scrape from Image(s)</CardTitle>
          <CardDescription>
            Upload one or more book cover images. The AI will attempt to extract details for each.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="imageUpload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              disabled={currentIsLoading}
              multiple
            />
           
            {imageFiles.length === 0 && (
               <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 4MB each)</p>
                  </div>
              </label>
            )}

            {fileError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>File Error</AlertTitle>
                    <AlertDescription>{fileError}</AlertDescription>
                </Alert>
            )}

            {imageFiles.length > 0 && !fileError && (
              <div className="relative w-full p-2 border-2 border-dashed rounded-lg">
                 <div className="flex justify-between items-center mb-2 px-2">
                    <p className="text-sm font-medium">{imageFiles.length} image(s) selected</p>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleClearImages}
                        type="button"
                        aria-label="Remove all files"
                        >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <ScrollArea className="h-40 w-full">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-2">
                    {imageFiles.map((file, i) => (
                        <div key={i} className="relative aspect-[2/3] rounded-md overflow-hidden group">
                           <Image
                            src={URL.createObjectURL(file)}
                            alt={`Preview of ${file.name}`}
                            fill
                            className="object-cover"
                            />
                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button 
                                    variant="destructive" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-full" 
                                    onClick={() => handleRemoveImage(i)}
                                    type="button"
                                    aria-label={`Remove ${file.name}`}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <div className="p-2 text-center mt-2">
                    <label htmlFor="imageUpload" className="text-sm text-primary font-medium cursor-pointer hover:underline">
                        Add more images...
                    </label>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={imageFiles.length === 0 || !!fileError || currentIsLoading}>
              {currentIsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {currentIsLoading ? `Analyzing ${imageFiles.length} Image(s)...` : `Extract Data from ${imageFiles.length} Image(s)`}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);
ImageScraperForm.displayName = 'ImageScraperForm';
