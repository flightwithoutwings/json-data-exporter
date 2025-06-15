export interface ScrapedItemData {
  title: string;
  author: string;
  year: string; // Represents publication date or year
  description: string;
  imageUrl: string;
  sourceUrl: string;
  printLength: string;
  fileSize: string;
}

export interface ScrapedItem extends ScrapedItemData {
  id: string; // Unique identifier for the item in the collection
}
