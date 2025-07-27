"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Download, PlusCircle, Save, RefreshCw } from 'lucide-react';
import type { ScrapedItemData } from '@/types';

interface ScrapedItemEditorProps {
  itemData: ScrapedItemData | null;
  onUpdateItem: (updatedData: ScrapedItemData) => void;
  onAddItemToCollection: (itemToAdd: ScrapedItemData) => void;
  onDownloadCurrentItem: (itemToDownload: ScrapedItemData) => void;
  onResetToScraped: () => void;
  isEditingExisting: boolean;
}

export function ScrapedItemEditor({
  itemData,
  onUpdateItem,
  onAddItemToCollection,
  onDownloadCurrentItem,
  onResetToScraped,
  isEditingExisting,
}: ScrapedItemEditorProps) {
  const [editableData, setEditableData] = useState<ScrapedItemData | null>(null);
  const [jsonPreview, setJsonPreview] = useState<string>('');

  useEffect(() => {
    setEditableData(itemData);
    if (itemData) {
      setJsonPreview(JSON.stringify(itemData, null, 2));
    } else {
      setJsonPreview('');
    }
  }, [itemData]);

  const handleInputChange = (field: keyof ScrapedItemData, value: string) => {
    if (editableData) {
      const updated = { ...editableData, [field]: value };
      setEditableData(updated);
      onUpdateItem(updated); // Update parent state for live changes
      setJsonPreview(JSON.stringify(updated, null, 2));
    }
  };

  if (!editableData) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Item Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <AlertCircle className="w-10 h-10 mb-2" />
            <p>No data scraped yet, or item cleared.</p>
            <p>Scrape a URL to see and edit data here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{isEditingExisting ? "Edit Collected Item" : "Scraped Data Editor"}</CardTitle>
        <CardDescription>
          Review and modify the scraped data below. The JSON preview will update automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="inline-block mb-1">Title</Label>
              <Input id="title" value={editableData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
            <div>
              <Label htmlFor="author" className="inline-block mb-1">Author</Label>
              <Input id="author" value={editableData.author || ''} onChange={(e) => handleInputChange('author', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
            <div>
              <Label htmlFor="year" className="inline-block mb-1">Publication Date/Year</Label>
              <Input id="year" value={editableData.year || ''} onChange={(e) => handleInputChange('year', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
            <div>
              <Label htmlFor="imageUrl" className="inline-block mb-1">Image URL</Label>
              <Input id="imageUrl" value={editableData.imageUrl || ''} onChange={(e) => handleInputChange('imageUrl', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
             <div>
              <Label htmlFor="printLength" className="inline-block mb-1">Print Length</Label>
              <Input id="printLength" value={editableData.printLength || ''} onChange={(e) => handleInputChange('printLength', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
            <div>
              <Label htmlFor="fileSize" className="inline-block mb-1">File Size</Label>
              <Input id="fileSize" value={editableData.fileSize || ''} onChange={(e) => handleInputChange('fileSize', e.target.value)} className="bg-background border-border focus:ring-primary" />
            </div>
             {editableData.imageUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="mt-2 cursor-pointer border border-border rounded-md overflow-hidden hover:opacity-80 transition-opacity">
                       <Image
                        src={editableData.imageUrl}
                        alt={editableData.title || "Scraped image"}
                        width={300}
                        height={200}
                        className="object-contain w-full max-h-48"
                        data-ai-hint="product photo"
                        unoptimized={editableData.imageUrl.startsWith('http')} // only for external images
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] p-0">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle className="font-headline">Image Preview</DialogTitle>
                        <DialogDescription>{editableData.title}</DialogDescription>
                    </DialogHeader>
                    <div className="p-4">
                    <Image
                        src={editableData.imageUrl}
                        alt={editableData.title || "Scraped image"}
                        width={800}
                        height={600}
                        className="object-contain w-full max-h-[70vh] rounded-md"
                        data-ai-hint="product photo"
                        unoptimized={editableData.imageUrl.startsWith('http')}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
          </div>
          <div className="flex flex-col space-y-4 min-h-[400px]">
            <div className="flex-grow flex flex-col">
              <Label htmlFor="description" className="inline-block mb-1">Description</Label>
              <ScrollArea className="flex-1 rounded-md border border-border bg-background" style={{ display: 'flex' }}>
                 <Textarea
                  id="description"
                  value={editableData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="h-full w-full flex-1 focus-visible:ring-primary resize-none border-0 focus-visible:ring-inset"
                />
              </ScrollArea>
            </div>
            <div className="flex-grow flex flex-col">
              <Label htmlFor="jsonPreview" className="inline-block mb-1">JSON Preview</Label>
              <ScrollArea className="flex-1 rounded-md border border-border bg-muted/50" style={{ display: 'flex' }}>
                 <Textarea
                  id="jsonPreview"
                  value={jsonPreview}
                  readOnly
                  className="h-full w-full flex-1 font-code text-xs resize-none border-0 bg-muted/50 text-muted-foreground focus-visible:ring-inset"
                />
              </ScrollArea>
            </div>
          </div>
        </div>
        <div>
            <Label htmlFor="sourceUrl" className="inline-block mb-1">Source URL</Label>
            <Input id="sourceUrl" value={editableData.sourceUrl} readOnly className="bg-muted/50 border-border text-muted-foreground" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-end">
         <Button variant="outline" onClick={onResetToScraped} className="text-foreground border-foreground/50 hover:bg-muted hover:text-foreground">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Original Scraped
        </Button>
        <Button variant="outline" onClick={() => onDownloadCurrentItem(editableData)} className="text-accent-foreground border-accent hover:bg-accent/80">
          <Download className="mr-2 h-4 w-4" />
          Download Current JSON
        </Button>
        <Button onClick={() => onAddItemToCollection(editableData)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {isEditingExisting ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isEditingExisting ? 'Update in Collection' : 'Add to Collection'}
        </Button>
      </CardFooter>
    </Card>
  );
}
