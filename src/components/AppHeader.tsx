import { ScanLine } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center">
        <ScanLine className="h-8 w-8 text-primary mr-3" />
        <h1 className="text-2xl font-headline font-semibold text-foreground">
          JSON Data Exporter
        </h1>
      </div>
    </header>
  );
}
