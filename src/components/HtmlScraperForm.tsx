
"use client";

import { useState, useTransition, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileCode, Loader2, X, AlertCircle } from 'lucide-react';
import type { ScrapedItemData } from '@/types';
import { scrapeHtmlContent } from '@/app/actions';

interface HtmlScraperFormProps {
  onScrapeStart: () => void;
  onScrapeSuccess: (data: ScrapedItemData, source: string) => void;
  onScrapeError: (error: string) => void;
  onBatchComplete: (successCount: number, errorCount: number, source: string) => void;
  isLoading: boolean;
}

export const HtmlScraperForm = forwardRef<{ clear: () => void }, HtmlScraperFormProps>(
  ({ onScrapeStart, onScrapeSuccess, onScrapeError, onBatchComplete, isLoading }, ref) => {
    const [htmlFiles, setHtmlFiles] = useState<File[]>([]);
    const [fileError, setFileError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = event.target.files;
      if (newFiles) {
        let allValid = true;
        const newFileList = Array.from(newFiles);

        for(const file of newFileList) {
          if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setFileError(`File "${file.name}" is too large. Please select files under 10MB.`);
            allValid = false;
            break;
          }
        }
        
        if (allValid) {
            setFileError(null);
            // Append new files, avoiding duplicates based on name and size
            setHtmlFiles(prevFiles => {
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
    
    const handleClearFiles = () => {
        setHtmlFiles([]);
        setFileError(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    
    const handleRemoveFile = (indexToRemove: number) => {
        setHtmlFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
    };

    useImperativeHandle(ref, () => ({
      clear: handleClearFiles,
    }));

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (htmlFiles.length === 0) {
        onScrapeError("Please select one or more HTML or HTM files first.");
        return;
      }

      onScrapeStart();
      
      startTransition(async () => {
        let successCount = 0;
        let errorCount = 0;

        for (const file of htmlFiles) {
          try {
            const content = await file.text();
            const result = await scrapeHtmlContent(content, file.name);
            if (result.data) {
                onScrapeSuccess(result.data, `File: ${file.name}`);
                successCount++;
            } else if (result.error) {
                onScrapeError(result.error);
                errorCount++;
            }
          } catch (e: any) {
            onScrapeError(e.message || `An unknown error occurred while parsing ${file.name}.`);
            errorCount++;
          }
        }
        onBatchComplete(successCount, errorCount, 'File Upload(s)');
      });
    };

    const currentIsLoading = isLoading || isPending;

    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Scrape from HTML File(s)</CardTitle>
          <CardDescription>
            Upload one or more .html or .htm files to extract their data in a batch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="htmlUpload"
              type="file"
              accept=".html,.htm"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              disabled={currentIsLoading}
              multiple
            />
           
            {htmlFiles.length === 0 && (
               <label htmlFor="htmlUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileCode className="w-10 h-10 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">HTML or HTM files (MAX. 10MB each)</p>
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

            {htmlFiles.length > 0 && !fileError && (
              <div className="relative w-full p-2 border-2 border-dashed rounded-lg">
                 <div className="flex justify-between items-center mb-2 px-2">
                    <p className="text-sm font-medium">{htmlFiles.length} file(s) selected</p>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleClearFiles}
                        type="button"
                        aria-label="Remove all files"
                        >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <ScrollArea className="h-60 w-full">
                    <div className="space-y-2 p-2">
                    {htmlFiles.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-md bg-muted/50 group">
                            <div className="flex items-center gap-3">
                                <FileCode className="w-6 h-6 text-primary" />
                                <div>
                                    <p className="font-medium text-foreground text-sm truncate max-w-xs">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => handleRemoveFile(i)}
                                type="button"
                                aria-label={`Remove ${file.name}`}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <div className="p-2 text-center mt-2">
                    <label htmlFor="htmlUpload" className="text-sm text-primary font-medium cursor-pointer hover:underline">
                        Add more files...
                    </label>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={htmlFiles.length === 0 || !!fileError || currentIsLoading}>
              {currentIsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {currentIsLoading ? `Parsing ${htmlFiles.length} File(s)...` : `Extract Data from ${htmlFiles.length} File(s)`}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }
);
HtmlScraperForm.displayName = 'HtmlScraperForm';
