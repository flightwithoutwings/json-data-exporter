
"use client";

import { useState, useTransition, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileCode, Loader2, X, AlertCircle } from 'lucide-react';
import type { ScrapedItemData } from '@/types';
import { scrapeHtmlContent } from '@/app/actions';

interface HtmlScraperFormProps {
  onScrapeStart: () => void;
  onScrapeSuccess: (data: ScrapedItemData) => void;
  onScrapeError: (error: string) => void;
  isLoading: boolean;
}

export function HtmlScraperForm({ onScrapeStart, onScrapeSuccess, onScrapeError, isLoading }: HtmlScraperFormProps) {
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for HTML files
        setFileError("File is too large. Please select a file under 10MB.");
        return;
      }
      setFileError(null);
      setHtmlFile(file);
    }
  };
  
  const handleClearFile = () => {
      setHtmlFile(null);
      setFileError(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!htmlFile) {
      onScrapeError("Please select an HTML or HTM file first.");
      return;
    }

    onScrapeStart();
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) {
            onScrapeError("Could not read file content.");
            return;
        }

        startTransition(async () => {
          try {
            const result = await scrapeHtmlContent(content, htmlFile.name);
            if (result.data) {
                onScrapeSuccess(result.data);
            } else if (result.error) {
                onScrapeError(result.error);
            }
          } catch(e: any) {
            onScrapeError(e.message || "An unknown error occurred while parsing the HTML file.");
          }
        });
    };
    reader.onerror = () => {
        onScrapeError("Failed to read the selected file.");
    };
    reader.readAsText(htmlFile);
  };

  const currentIsLoading = isLoading || isPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Scrape from HTML File</CardTitle>
        <CardDescription>
          Upload an .html or .htm file saved from a website to extract its data.
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
          />
         
          {!htmlFile && (
             <label htmlFor="htmlUpload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileCode className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">HTML or HTM (MAX. 10MB)</p>
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

          {htmlFile && !fileError && (
            <div className="relative w-full p-4 border-2 border-dashed rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCode className="w-8 h-8 text-primary" />
                <div>
                    <p className="font-medium text-foreground">{htmlFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(htmlFile.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleClearFile}
                  type="button"
                  aria-label="Remove file"
                  >
                  <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!htmlFile || !!fileError || currentIsLoading}>
            {currentIsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {currentIsLoading ? 'Parsing File...' : 'Extract Data from File'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
