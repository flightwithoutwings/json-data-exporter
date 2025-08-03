
"use client";

import { useState, useTransition, useRef, forwardRef, useImperativeHandle } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, Loader2, X, AlertCircle } from 'lucide-react';
import type { ScrapedItemData } from '@/types';
import { extractBookInfoFromImage } from '@/ai/flows/extract-book-info-flow';

interface ImageScraperFormProps {
  onScrapeStart: () => void;
  onScrapeSuccess: (data: ScrapedItemData) => void;
  onScrapeError: (error: string) => void;
  isLoading: boolean;
}

export const ImageScraperForm = forwardRef<{ clear: () => void }, ImageScraperFormProps>(
  ({ onScrapeStart, onScrapeSuccess, onScrapeError, isLoading }, ref) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setFileError("File is too large. Please select an image under 4MB.");
          return;
        }
        setFileError(null);
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    
    const handleClearImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFileError(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    useImperativeHandle(ref, () => ({
      clear: handleClearImage,
    }));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!imageFile || !imagePreview) {
        onScrapeError("Please select an image file first.");
        return;
      }

      onScrapeStart();
      startTransition(async () => {
        try {
          const result = await extractBookInfoFromImage({ photoDataUri: imagePreview });
          onScrapeSuccess({
              ...result,
              imageUrl: imagePreview,
              sourceUrl: `Image Upload: ${imageFile.name}`,
              printLength: '', // Not available from image
              fileSize: '', // Not available from image
          });
        } catch(e: any) {
          onScrapeError(e.message || "An unknown error occurred while analyzing the image.");
        }
      });
    };

    const currentIsLoading = isLoading || isPending;

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Scrape from Image</CardTitle>
          <CardDescription>
            Upload an image of a book cover. The AI will attempt to extract its details.
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
            />
           
            {!imagePreview && (
               <label htmlFor="imageUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP (MAX. 4MB)</p>
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

            {imagePreview && !fileError && (
              <div className="relative w-full max-w-sm mx-auto p-2 border-2 border-dashed rounded-lg">
                <Image
                  src={imagePreview}
                  alt="Selected preview"
                  width={300}
                  height={450}
                  className="object-contain w-full h-auto max-h-64 rounded-md"
                />
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full"
                    onClick={handleClearImage}
                    type="button"
                    aria-label="Remove image"
                    >
                    <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!imagePreview || !!fileError || currentIsLoading}>
              {currentIsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {currentIsLoading ? 'Analyzing Image...' : 'Extract Data from Image'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);
ImageScraperForm.displayName = 'ImageScraperForm';
