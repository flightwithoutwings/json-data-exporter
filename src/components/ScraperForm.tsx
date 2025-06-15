"use client";

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import type { ScrapedItemData } from '@/types';

interface ScraperFormProps {
  onScrapeStart: () => void;
  onScrapeSuccess: (data: ScrapedItemData) => void;
  onScrapeError: (error: string) => void;
  isLoading: boolean;
}

export function ScraperForm({ onScrapeStart, onScrapeSuccess, onScrapeError, isLoading }: ScraperFormProps) {
  const [url, setUrl] = useState<string>('https://www.amazon.com/Before-Watchmen-Nite-Owl-Manhattan-ebook/dp/B00CXY58EO/ref=tmm_kin_swatch_0');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url) {
      onScrapeError("Please enter a URL.");
      return;
    }
    onScrapeStart();
    startTransition(async () => {
      // Dynamically import server action
      const { scrapeUrl } = await import('@/app/actions');
      const result = await scrapeUrl(url);
      if (result.data) {
        onScrapeSuccess(result.data);
      } else if (result.error) {
        onScrapeError(result.error);
      } else {
        onScrapeError("An unknown error occurred during scraping.");
      }
    });
  };

  const currentIsLoading = isLoading || isPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Scrape Website Data</CardTitle>
        <CardDescription>
          Enter a URL to scrape its metadata. For best results, use product pages similar to the example.
          The current scraper is optimized for Amazon book pages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="urlInput" className="block text-sm font-medium text-foreground mb-1">
              Website URL
            </label>
            <Input
              id="urlInput"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product-page"
              required
              className="bg-background border-border focus:ring-primary"
              aria-describedby="url-description"
            />
            <p id="url-description" className="text-xs text-muted-foreground mt-1">
              Example: https://www.amazon.com/Before-Watchmen-Nite-Owl-Manhattan-ebook/dp/B00CXY58EO
            </p>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={currentIsLoading}>
            {currentIsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {currentIsLoading ? 'Scraping...' : 'Scrape Data'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
