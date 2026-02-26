"use client";

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useDeleteFromGalleryMutation,
  useGetGalleryQuery
} from '@/features/gallery/galleryApi';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  FileVideo,
  Filter,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Play,
  Search,
  Trash2,
  Upload,
  Video as VideoIcon,
  X
} from 'lucide-react';
import { useRef, useState } from 'react';

interface GalleryItem {
  _id: string;
  url: string;
  type: 'image' | 'video';
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export default function GalleryPage() {
  const { data: items = [], isLoading, refetch } = useGetGalleryQuery(undefined);
  const [deleteItem] = useDeleteFromGalleryMutation();

  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (1GB limit)
    if (file.size > 1024 * 1024 * 1024) {
      setMessage({ text: 'File size exceeds 1GB limit.', type: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      await axios.post('/api/gallery', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        }
      });

      setMessage({ text: 'Uploaded successfully!', type: 'success' });
      refetch();
    } catch (error: any) {
      console.error('Upload failed:', error);
      setMessage({ text: error.response?.data?.error || 'Upload failed.', type: 'error' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      await deleteItem(id).unwrap();
      setMessage({ text: 'Deleted successfully.', type: 'success' });
    } catch (error: any) {
      setMessage({ text: 'Failed to delete.', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const filteredItems = items.filter((item: GalleryItem) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = item.fileName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">

        {/* Header Visuals */}
        <div className="relative p-8 rounded-[40px] bg-card border border-border shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Maximize2 className="w-48 h-48 text-primary" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tighter uppercase italic text-primary">Media Vault</h1>
              <p className="text-muted-foreground font-bold flex items-center uppercase text-xs tracking-[0.2em]">
                <Play className="w-4 h-4 mr-2 text-primary" />
                Capture your evolution. Store your legacy.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleUpload}
                accept="image/*,video/*"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-2xl h-14 px-8 shadow-xl shadow-primary/20 font-black uppercase tracking-widest active:scale-95 transition-all text-white"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Upload className="w-5 h-5 mr-2" />
                )}
                Upload Media
              </Button>
            </div>
          </div>

          {/* Upload Progress Overlay */}
          {uploading && uploadProgress !== null && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent/20">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by filename..."
              className="pl-12 h-12 rounded-2xl bg-card/60 border-border/50 focus:border-primary/50 transition-all font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                onClick={() => setFilter(cat.id as any)}
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

        {/* Message Toast */}
        {message && (
          <div className={cn(
            "fixed bottom-8 right-8 z-50 flex items-center space-x-3 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5",
            message.type === 'success' ? 'bg-profit/10 text-profit border border-profit/20' : 'bg-loss/10 text-loss border border-loss/20'
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-black uppercase text-xs tracking-widest">{message.text}</span>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 opacity-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="font-black uppercase tracking-[0.3em]">Loading Vault...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-20 bg-card/40 border-4 border-dashed border-border/40 rounded-[40px] flex flex-col items-center justify-center text-center space-y-6 opacity-40">
              <div className="p-8 rounded-full bg-accent/20">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Vault is Empty</h3>
                <p className="text-sm font-bold italic">No media found matching your criteria.</p>
              </div>
            </div>
          ) : (
            filteredItems.map((item: GalleryItem) => (
              <div
                key={item._id}
                onClick={() => setPreviewItem(item)}
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
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={(e) => handleDelete(item._id, e)}
                        className="rounded-xl h-8 w-8 bg-loss/80 hover:bg-loss transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Icon Badge */}
                  <div className="absolute top-4 left-4 p-2 rounded-xl bg-background/60 backdrop-blur-md border border-white/10 group-hover:bg-primary group-hover:text-white transition-all">
                    {item.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Lightbox Preview */}
        {previewItem && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
              <div className="relative w-full h-full flex items-center justify-center">
                {previewItem.type === 'image' ? (
                  <img src={previewItem.url} alt={previewItem.fileName} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                ) : (
                  <video src={previewItem.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                )}
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">{previewItem.fileName}</h3>
                <p className="text-white/40 font-bold uppercase text-[10px] tracking-widest">
                  Type: {previewItem.mimeType} • Size: {formatSize(previewItem.size)} • Created: {new Date(previewItem.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}