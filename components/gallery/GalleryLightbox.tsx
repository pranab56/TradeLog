"use client";

import { Button } from '@/components/ui/button';
import { GalleryItem } from '@/features/gallery/galleryApi';
import { Download, X } from 'lucide-react';

interface GalleryLightboxProps {
  item: GalleryItem;
  onClose: () => void;
  onDownload: (url: string, fileName: string) => void;
  formatSize: (bytes: number) => string;
}

export default function GalleryLightbox({ item, onClose, onDownload, formatSize }: GalleryLightboxProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
        <div className="relative w-full h-full flex items-center justify-center">
          {item.type === 'image' ? (
            <img src={item.url} alt={item.fileName} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          ) : (
            <video src={item.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          )}
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{item.fileName}</h3>
          <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
            Type: {item.mimeType} • Size: {formatSize(item.size)} • Created: {new Date(item.createdAt).toLocaleDateString()}
          </p>
          <div className="pt-4">
            <Button
              onClick={() => onDownload(item.url, item.fileName)}
              className="rounded-2xl h-12 px-8 bg-primary text-white font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Original
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
