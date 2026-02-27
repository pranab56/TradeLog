"use client";

import GalleryFilter from '@/components/gallery/GalleryFilter';
import GalleryHeader from '@/components/gallery/GalleryHeader';
import GalleryItem from '@/components/gallery/GalleryItem';
import GalleryLightbox from '@/components/gallery/GalleryLightbox';
import MainLayout from '@/components/layout/MainLayout';
import {
  GalleryItem as GalleryItemType,
  useDeleteFromGalleryMutation,
  useGetGalleryQuery,
  useUploadToGalleryMutation
} from '@/features/gallery/galleryApi';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import Loading from '../../components/Loading/Loading';

export default function GalleryPage() {
  const { data: items = [], isLoading, refetch } = useGetGalleryQuery(undefined);
  const [deleteItem] = useDeleteFromGalleryMutation();
  const [uploadToGallery] = useUploadToGalleryMutation();

  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{ current: number; total: number } | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItemType | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = useCallback((text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadInfo({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadInfo({ current: i + 1, total: files.length });

      // Check size (1GB limit)
      if (file.size > 1024 * 1024 * 1024) {
        showMessage(`File ${file.name} exceeds 1GB limit.`, 'error');
        continue;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        await uploadToGallery(formData).unwrap();
      } catch (error: any) {
        console.error(`Upload failed for ${file.name}:`, error);
        showMessage(`Failed to upload ${file.name}`, 'error');
      }
    }

    await refetch();
    showMessage('All files processed!', 'success');
    setUploading(false);
    setUploadInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this?')) return;

    try {
      await deleteItem(id).unwrap();
      showMessage('Deleted successfully.', 'success');
    } catch (error: any) {
      showMessage('Failed to delete.', 'error');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item: GalleryItemType) => {
      const matchesFilter = filter === 'all' || item.type === filter;
      const matchesSearch = item.fileName.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [items, filter, search]);

  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleDownload = async (url: string, fileName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      showMessage('Download failed.', 'error');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <GalleryHeader
          uploading={uploading}
          uploadInfo={uploadInfo}
          uploadProgress={null} // Progress tracking removed as axios is removed
          onUploadClick={() => fileInputRef.current?.click()}
          fileInputRef={fileInputRef}
          handleUpload={handleUpload}
        />

        <GalleryFilter
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
        />

        {message && (
          <div className={cn(
            "fixed bottom-8 right-8 z-50 flex items-center space-x-3 p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5",
            message.type === 'success' ? 'bg-profit/10 text-profit border border-profit/20' : 'bg-loss/10 text-loss border border-loss/20'
          )}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-black uppercase text-xs tracking-widest">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div className="col-span-full">
              <Loading />
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
            filteredItems.map((item: GalleryItemType) => (
              <GalleryItem
                key={item._id}
                item={item}
                onPreview={setPreviewItem}
                onDelete={handleDelete}
                onDownload={handleDownload}
                formatSize={formatSize}
              />
            ))
          )}
        </div>

        {previewItem && (
          <GalleryLightbox
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onDownload={handleDownload}
            formatSize={formatSize}
          />
        )}
      </div>
    </MainLayout>
  );
}
