
"use client";

import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit3, Trash2, Package, ListCollapse } from 'lucide-react';
import type { ScrapedItem } from '@/types';

interface CollectedItemsDisplayProps {
  items: ScrapedItem[];
  onEditItem: (item: ScrapedItem) => void;
  onRemoveItem: (itemId: string) => void;
  onExportAll: () => void;
}

export function CollectedItemsDisplay({ items, onEditItem, onRemoveItem, onExportAll }: CollectedItemsDisplayProps) {
  if (items.length === 0) {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Collected Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <ListCollapse className="w-10 h-10 mb-2" />
            <p>No items collected yet.</p>
            <p>Scrape data and add items to see them here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Collected Items ({items.length})</CardTitle>
        <CardDescription>
          Manage your collected data. You can edit, remove, or export all items as a single JSON file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="w-[150px]">Pub. Date/Year</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Image
                      src={item.imageUrl || 'https://placehold.co/50x75.png'}
                      alt={item.title || "Item image"}
                      width={50}
                      height={75}
                      className="object-cover rounded-sm"
                      data-ai-hint="book cover"
                      unoptimized={true}
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate" title={item.title}>{item.title}</TableCell>
                  <TableCell className="max-w-xs truncate" title={item.author}>{item.author}</TableCell>
                  <TableCell>{item.year}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEditItem(item)} aria-label={`Edit ${item.title}`} className="text-primary hover:bg-accent hover:text-white">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)} aria-label={`Remove ${item.title}`} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      {items.length > 0 && (
        <CardFooter className="justify-end">
           <Button onClick={onExportAll} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Package className="mr-2 h-4 w-4" />
            Export All Collected Data
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
