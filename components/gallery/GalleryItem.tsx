"use client";

import { Button } from '@/components/ui/button';
import { GalleryItem as GalleryItemType } from '@/features/gallery/galleryApi';
import { Download, Image as ImageIcon, Play, Trash2, Video as VideoIcon } from 'lucide-react';

interface GalleryItemProps {
  item: GalleryItemType;
  onPreview: (item: GalleryItemType) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onDownload: (url: string, fileName: string, e?: React.MouseEvent) => void;
  formatSize: (bytes: number) => string;
}

export default function GalleryItem({ item, onPreview, onDelete, onDownload, formatSize }: GalleryItemProps) {
  return (
    <div
      onClick={() => onPreview(item)}
      className="group relative bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/50 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
    >
      {/* Media Component */}
      <div className="aspect-square relative flex items-center justify-center bg-black">
        {item.type === 'image' ? (
          <img
            src={item.url}
            alt={item.fileName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full relative">
            <video
              src={item.url}
              className="w-full h-full object-cover opacity-80"
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              muted
              loop
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 opacity-100 group-hover:opacity-0 transition-opacity">
                <Play className="w-8 h-8 fill-current" />
              </div>
            </div>
          </div>
        )}

        {/* Overlay Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-end">
          <p className="text-white font-black uppercase text-[10px] tracking-widest truncate mb-1">
            {item.fileName}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-white/60 font-bold text-[8px] uppercase">{formatSize(item.size)}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => onDownload(item.url, item.fileName, e)}
                className="rounded-xl h-8 w-8 bg-white/20 hover:bg-white/40 text-white transition-all border-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => onDelete(item._id, e)}
                className="rounded-xl h-8 w-8 bg-loss/80 hover:bg-loss transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Icon Badge */}
        <div className="absolute top-4 left-4 p-2 rounded-xl bg-background/60 backdrop-blur-md border border-white/10 group-hover:bg-primary group-hover:text-white transition-all">
          {item.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
