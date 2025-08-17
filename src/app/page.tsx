
"use client";

import { useState, useEffect, useRef } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { ScraperForm } from '@/components/ScraperForm';
import { ImageScraperForm } from '@/components/ImageScraperForm';
import { HtmlScraperForm } from '@/components/HtmlScraperForm';
import { ScrapedItemEditor } from '@/components/ScrapedItemEditor';
import { CollectedItemsDisplay } from '@/components/CollectedItemsDisplay';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadJson, generateId } from '@/lib/utils';
import type { ScrapedItemData, ScrapedItem } from '@/types';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [currentItemData, setCurrentItemData] = useState<ScrapedItemData | null>(null); // Data as scraped or being edited
  const [originalScrapedData, setOriginalScrapedData] = useState<ScrapedItemData | null>(null); // Holds the pristine scraped data for reset

  const [collectedItems, setCollectedItems] = useState<ScrapedItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // ID of item from collection being edited

  const { toast } = useToast();

  const imageScraperRef = useRef<{ clear: () => void }>(null);
  const htmlScraperRef = useRef<{ clear: () => void }>(null);


  // Load collected items from localStorage on mount
  useEffect(() => {
    const storedItems = localStorage.getItem('webScraperCollectedItems');
    if (storedItems) {
      try {
        setCollectedItems(JSON.parse(storedItems));
      } catch (e) {
        console.error("Failed to parse stored items:", e);
        localStorage.removeItem('webScraperCollectedItems');
      }
    }
  }, []);

  // Save collected items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('webScraperCollectedItems', JSON.stringify(collectedItems));
  }, [collectedItems]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleScrapeStart = () => {
    setIsLoading(true);
    clearMessages();
    setCurrentItemData(null);
    setOriginalScrapedData(null);
    setEditingItemId(null);
  };

  const handleScrapeSuccess = (data: ScrapedItemData, source: string = "URL", isBatch: boolean = false) => {
    if (isBatch) {
       const newItem: ScrapedItem = { ...data, id: generateId() };
       setCollectedItems(prevItems => [newItem, ...prevItems]);
       // Don't show in editor, but give a toast
       toast({
         title: "Item Added",
         description: `"${data.title.substring(0,30)}..." added to collection.`,
         variant: "default",
       });
    } else {
      setIsLoading(false);
      const dataWithSource = { ...data, sourceUrl: data.sourceUrl || source };
      setCurrentItemData(dataWithSource);
      setOriginalScrapedData(dataWithSource); // Store original for reset
      setSuccessMessage(`Data extracted from ${source} successfully! You can now edit it below.`);
      toast({
        title: "Extraction Successful",
        description: `Data for "${data.title.substring(0,30)}..." has been loaded.`,
        variant: "default",
      });
    }
  };

  const handleBatchComplete = (successCount: number, errorCount: number, source: string) => {
    setIsLoading(false);
    setSuccessMessage(`${successCount} item(s) successfully extracted and added to your collection from ${source}.`);
    if (errorCount > 0) {
      setError(`${errorCount} file(s) failed to process. See console for details.`);
    }
    toast({
      title: "Batch Processing Complete",
      description: `${successCount} processed, ${errorCount} failed.`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
     if (source.includes('Image')) {
        imageScraperRef.current?.clear();
    }
    if (source.includes('File')) {
        htmlScraperRef.current?.clear();
    }
  }


  const handleScrapeError = (errorMessage: string, isBatch: boolean = false) => {
    if (isBatch) {
      console.error("Batch scrape error:", errorMessage);
      // Don't stop the whole batch, just log the error. The summary will be at the end.
    } else {
      setIsLoading(false);
      setError(errorMessage);
      toast({
        title: "Extraction Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCurrentItem = (updatedData: ScrapedItemData) => {
    setCurrentItemData(updatedData);
  };

  const handleResetToScraped = () => {
    if (originalScrapedData) {
      setCurrentItemData(originalScrapedData);
      toast({ title: "Editor Reset", description: "Data has been reset to originally scraped values." });
    }
  };

  const handleAddItemToCollection = (itemDataToAdd: ScrapedItemData) => {
    if (!itemDataToAdd) return;

    if (editingItemId) { // We are updating an existing item
      setCollectedItems(prevItems =>
        prevItems.map(item =>
          item.id === editingItemId ? { ...itemDataToAdd, id: editingItemId } : item
        )
      );
      toast({ title: "Item Updated", description: `"${itemDataToAdd.title}" updated in collection.` });
      setEditingItemId(null);
    } else { // We are adding a new item
      const newItem: ScrapedItem = { ...itemDataToAdd, id: generateId() };
      setCollectedItems(prevItems => [newItem, ...prevItems]);
      toast({ title: "Item Added", description: `"${newItem.title}" added to collection.` });
    }
    
    // Clear current editor
    setCurrentItemData(null);
    setOriginalScrapedData(null);
    clearMessages();
  };

  const handleDownloadCurrentItem = (itemToDownload: ScrapedItemData) => {
    if (!itemToDownload) {
      toast({ title: "No Data", description: "No data to download.", variant: "destructive" });
      return;
    }
    const filename = `${itemToDownload.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scraped.json`;
    downloadJson(itemToDownload, filename);
    toast({ title: "JSON Downloaded", description: `Downloaded data for "${itemToDownload.title}".` });
  };

  const handleEditCollectedItem = (itemToEdit: ScrapedItem) => {
    setCurrentItemData(itemToEdit); // Populate editor
    setOriginalScrapedData(itemToEdit); // Set for reset functionality
    setEditingItemId(itemToEdit.id); // Mark that we are editing an existing item
    clearMessages();
    setSuccessMessage(`Editing "${itemToEdit.title}". Make your changes and click "Update in Collection".`);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top to see editor
  };

  const handleRemoveCollectedItem = (itemIdToRemove: string) => {
    const item = collectedItems.find(i => i.id === itemIdToRemove);
    setCollectedItems(prevItems => prevItems.filter(item => item.id !== itemIdToRemove));
    toast({ title: "Item Removed", description: `"${item?.title}" removed from collection.`, variant: "destructive" });
    if (editingItemId === itemIdToRemove) { // If removing the item currently being edited
      setCurrentItemData(null);
      setOriginalScrapedData(null);
      setEditingItemId(null);
    }
  };

  const handleExportAllCollectedData = () => {
    if (collectedItems.length === 0) {
      toast({ title: "No Data", description: "No collected items to export.", variant: "destructive" });
      return;
    }
    const filename = `web_scraper_collection_${new Date().toISOString().split('T')[0]}.json`;
    downloadJson(collectedItems, filename);
    toast({ title: "Collection Exported", description: `All ${collectedItems.length} items exported and collection cleared.` });
    setCollectedItems([]);
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {error && (
          <Alert variant="destructive" className="shadow-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && !error && (
           <Alert variant="default" className="shadow-md bg-accent/20 border-accent text-accent-foreground">
            <CheckCircle2 className="h-4 w-4 text-accent" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="url">Scrape from URL</TabsTrigger>
                <TabsTrigger value="image">Scrape from Image(s)</TabsTrigger>
                <TabsTrigger value="file">Scrape from File(s)</TabsTrigger>
            </TabsList>
            <TabsContent value="url">
                <ScraperForm
                    onScrapeStart={handleScrapeStart}
                    onScrapeSuccess={(data) => handleScrapeSuccess(data, 'URL')}
                    onScrapeError={handleScrapeError}
                    isLoading={isLoading}
                />
            </TabsContent>
            <TabsContent value="image">
                 <ImageScraperForm
                    ref={imageScraperRef}
                    onScrapeStart={handleScrapeStart}
                    onScrapeSuccess={(data, source) => handleScrapeSuccess(data, source, true)}
                    onScrapeError={(err) => handleScrapeError(err, true)}
                    onBatchComplete={handleBatchComplete}
                    isLoading={isLoading}
                />
            </TabsContent>
            <TabsContent value="file">
                 <HtmlScraperForm
                    ref={htmlScraperRef}
                    onScrapeStart={handleScrapeStart}
                    onScrapeSuccess={(data, source) => handleScrapeSuccess(data, source, true)}
                    onScrapeError={(err) => handleScrapeError(err, true)}
                    onBatchComplete={handleBatchComplete}
                    isLoading={isLoading}
                />
            </TabsContent>
        </Tabs>


        {currentItemData && (
          <ScrapedItemEditor
            itemData={currentItemData}
            onUpdateItem={handleUpdateCurrentItem}
            onAddItemToCollection={handleAddItemToCollection}
            onDownloadCurrentItem={handleDownloadCurrentItem}
            onResetToScraped={handleResetToScraped}
            isEditingExisting={!!editingItemId}
          />
        )}
        
        <CollectedItemsDisplay
          items={collectedItems}
          onEditItem={handleEditCollectedItem}
          onRemoveItem={handleRemoveCollectedItem}
          onExportAll={handleExportAllCollectedData}
        />
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        Web Scraper JSON Exporter &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
