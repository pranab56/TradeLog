"use client";

import { Button } from '@/components/ui/button';
import { GalleryItem } from '@/features/gallery/galleryApi';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

interface GalleryLightboxProps {
  item: GalleryItem;
  onClose: () => void;
  onDownload: (url: string, fileName: string) => void;
  formatSize: (bytes: number) => string;
}

export default function GalleryLightbox({ item, onClose, onDownload, formatSize }: GalleryLightboxProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 md:top-8 md:right-8 p-2.5 md:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-[110] cursor-pointer border border-white/10"
      >
        <X className="w-6 h-6 md:w-8 md:h-8" />
      </button>

      <div className="w-full h-full flex flex-col items-center justify-center space-y-6 md:space-y-8 max-w-6xl mx-auto">
        <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
          {item.type === 'image' ? (
            <Image
              fill
              src={item.url}
              alt={item.fileName}
              className="max-w-full max-h-full object-contain rounded-xl md:rounded-3xl shadow-2xl"
            />
          ) : (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-xl md:rounded-3xl shadow-2xl"
            />
          )}
        </div>

        <div className="text-center space-y-2 md:space-y-3 pb-4 md:pb-0">
          <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter italic truncate max-w-[90vw] mx-auto">
            {item.fileName}
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-white/40 font-black uppercase text-[8px] md:text-[10px] tracking-widest">
            <span>Type: {item.mimeType}</span>
            <span className="hidden md:inline">•</span>
            <span>Size: {formatSize(item.size)}</span>
            <span className="hidden md:inline">•</span>
            <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="pt-4 md:pt-6">
            <Button
              onClick={() => onDownload(item.url, item.fileName)}
              className="rounded-2xl h-11 md:h-14 px-8 md:px-12 bg-primary text-white font-black uppercase tracking-widest active:scale-95 transition-all text-xs md:text-sm shadow-2xl shadow-primary/20 cursor-pointer"
            >
              <Download className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3" />
              Download Original
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
