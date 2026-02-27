"use client";

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FileImage, FileVideo, Filter, Search } from 'lucide-react';

interface GalleryFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: 'all' | 'image' | 'video';
  onFilterChange: (value: 'all' | 'image' | 'video') => void;
}

export default function GalleryFilter({
  search,
  onSearchChange,
  filter,
  onFilterChange
}: GalleryFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by filename..."
          className="pl-12 h-12 rounded-2xl bg-card/60 border-border/50 focus:border-primary/50 transition-all font-bold"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center p-1 bg-accent/10 rounded-2xl border border-border/50">
        {[
          { id: 'all', label: 'All', icon: Filter },
          { id: 'image', label: 'Images', icon: FileImage },
          { id: 'video', label: 'Videos', icon: FileVideo },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => onFilterChange(cat.id as any)}
            className={cn(
              "flex items-center px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              filter === cat.id
                ? "bg-background text-primary shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <cat.icon className="w-4 h-4 mr-2" />
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
