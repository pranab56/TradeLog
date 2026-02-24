"use client";

import DailyRecordForm from '@/components/forms/DailyRecordForm';
import MainLayout from '@/components/layout/MainLayout';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddTradeMutation,
  useDeleteTradeMutation,
  useGetTradesQuery,
  useUpdateTradeMutation
} from '@/features/trades/tradesApi';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const ITEMS_PER_PAGE = 10;

export default function TradesPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const { data: records = [], isLoading: isFetching, refetch } = useGetTradesQuery(undefined);
  const [addTrade, { isLoading: isAdding }] = useAddTradeMutation();
  const [updateTrade, { isLoading: isUpdating }] = useUpdateTradeMutation();
  const [deleteTrade] = useDeleteTradeMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
    }
  }, [action]);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredRecords = useMemo(() => {
    if (!search) return records;

    const searchTerm = search.toLowerCase();

    return records.filter((r: any) => {
      const tradeDate = new Date(r.date);
      const day = tradeDate.getDate().toString().padStart(2, '0');
      const month = (tradeDate.getMonth() + 1).toString().padStart(2, '0');
      const year = tradeDate.getFullYear().toString();

      // Date Search Logic
      const dateParts = searchTerm.split(/[-/]/);
      let dateMatch = false;

      if (dateParts.length === 1 && dateParts[0].length > 0) {
        // Match day or year or month (if specified as MM)
        dateMatch = day === dateParts[0].padStart(2, '0') || year === dateParts[0];
      } else if (dateParts.length === 2) {
        // DD-MM
        dateMatch = day === dateParts[0].padStart(2, '0') && month === dateParts[1].padStart(2, '0');
      } else if (dateParts.length === 3) {
        // DD-MM-YYYY
        dateMatch = day === dateParts[0].padStart(2, '0') && month === dateParts[1].padStart(2, '0') && year === dateParts[2];
      }

      const notesMatch = r.notes?.toLowerCase().includes(searchTerm);
      const tagsMatch = r.tags?.some((t: string) => t.toLowerCase().includes(searchTerm));
      const isoFormatMatch = format(tradeDate, 'yyyy-MM-dd').includes(searchTerm);

      return dateMatch || notesMatch || tagsMatch || isoFormatMatch;
    });
  }, [records, search]);

  // Pagination Logic
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteTrade(deleteConfirmId).unwrap();
      setDeleteConfirmId(null);
    } catch (error) {
      alert('Failed to delete record');
    }
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingRecord) {
        await updateTrade({ id: editingRecord._id, ...formData }).unwrap();
      } else {
        await addTrade(formData).unwrap();
      }
      setIsModalOpen(false);
      setEditingRecord(null);
    } catch (error: any) {
      alert(error.data?.error || 'Failed to save record');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl hidden md:block">
              <FileSpreadsheet size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1 uppercase">Trade Journal</h1>
              <p className="text-muted-foreground font-medium">Every entry here dynamically recalculates your dashboard statistics.</p>
            </div>
          </div>
          <Button
            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
            className="rounded-2xl px-10 py-4 h-auto font-black uppercase tracking-widest shadow-lg cursor-pointer bg-primary text-primary-foreground hover:scale-[1.02] transition-all shadow-primary/20 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-3" />
            Add Single Entry
          </Button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search (e.g., 26 or 26-02-2026)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 bg-background border-border rounded-xl h-11 focus:ring-2 focus:ring-primary/10 font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-3 py-1.5 bg-muted rounded-lg border border-border">
                {filteredRecords.length} LOGS TOTAL
              </span>
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-border">
                  <TableHead className="px-8 py-5 font-black text-foreground h-auto uppercase text-[10px] tracking-[0.2em]">Temporal Key</TableHead>
                  <TableHead className="px-6 py-5 font-black text-foreground text-right h-auto uppercase text-[10px] tracking-[0.2em]">Net Surplus</TableHead>
                  <TableHead className="px-6 py-5 font-black text-foreground text-center h-auto uppercase text-[10px] tracking-[0.2em]">Efficiency (R:R)</TableHead>
                  <TableHead className="px-6 py-5 font-black text-foreground h-auto uppercase text-[10px] tracking-[0.2em]">Contextual Data</TableHead>
                  <TableHead className="px-6 py-5 font-black text-foreground text-right h-auto uppercase text-[10px] tracking-[0.2em]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-primary h-12 w-12" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Accessing Records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="px-8 py-32 text-center text-muted-foreground">
                      <div className="max-w-xs mx-auto space-y-4">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                          <FileSpreadsheet size={40} />
                        </div>
                        <div>
                          <p className="font-black text-foreground uppercase tracking-tight text-lg">No matches found</p>
                          <p className="text-sm font-medium mt-1">Refine your search parameters or add new historical data.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedRecords.map((record: any) => {
                  const net = (record.profit || 0) - (record.loss || 0);
                  const isProfit = net >= 0;
                  const isZeroRR = record.riskRewardRatio === '0:0';

                  return (
                    <TableRow key={record._id} className="hover:bg-accent/5 border-border group transition-colors">
                      <TableCell className="px-8 py-6">
                        <div className="font-black text-lg tracking-tight">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                        <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-2 font-black uppercase tracking-tighter opacity-60">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {record.totalTrades > 0 ? `${record.totalTrades} Trade(s)` : 'Single Record'}
                        </div>
                      </TableCell>
                      <TableCell className={`px-6 py-6 text-right font-black text-lg ${isProfit ? 'text-profit' : 'text-loss'}`}>
                        <div className="flex items-center justify-end space-x-2">
                          {isProfit ? <TrendingUp size={20} className="stroke-[3]" /> : <TrendingDown size={20} className="stroke-[3]" />}
                          <span className="italic">{isProfit ? '+' : '-'}${Math.abs(net).toLocaleString()}</span>
                        </div>
                        <div className="text-[9px] uppercase font-black tracking-widest opacity-40 mt-1">
                          {record.profit > 0 ? `IN: $${record.profit}` : `OUT: $${record.loss}`}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6 text-center">
                        <span className={cn(
                          "px-5 py-1.5 rounded-full text-xs font-black border uppercase tracking-tighter transition-all",
                          isZeroRR
                            ? "bg-loss/10 text-loss border-loss/30 animate-pulse shadow-sm shadow-loss/10"
                            : "bg-primary/5 text-primary border-primary/20 shadow-sm shadow-primary/5"
                        )}>
                          {record.riskRewardRatio}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="max-w-[280px] mb-3">
                          <p className="text-sm line-clamp-2 text-foreground font-bold leading-relaxed italic opacity-80">"{record.notes || 'No contextual notes recorded.'}"</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {record.tags?.map((tag: string) => (
                            <span key={tag} className="bg-muted/50 text-muted-foreground text-[9px] font-black px-2.5 py-1 rounded-lg border border-border uppercase tracking-widest">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                            className="h-10 w-10 hover:bg-primary/20 cursor-pointer text-primary rounded-xl transition-all"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(record._id)}
                            className="h-10 w-10 hover:bg-loss/20 cursor-pointer text-loss rounded-xl transition-all"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between bg-muted/10 gap-4">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Displaying Page {currentPage} of {totalPages} Contexts
              </p>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="h-10 w-10 rounded-xl border-border bg-card shadow-sm disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                        currentPage === i + 1
                          ? "bg-primary text-white shadow-lg shadow-primary/20 ring-2 ring-primary/20"
                          : "bg-card border border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="h-10 w-10 rounded-xl border-border bg-card shadow-sm disabled:opacity-30 cursor-pointer active:scale-95 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) setEditingRecord(null);
      }}>
        <DialogContent className="w-full max-w-2xl bg-card border-border rounded-[2.5rem] p-0 overflow-hidden shadow-2xl outline-none">
          <DialogHeader className="p-8 md:p-10 border-b border-border text-left relative overflow-hidden bg-primary/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
              {editingRecord ? 'Calibrate Log' : 'Initiate New Log'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-bold mt-2 uppercase text-[10px] tracking-widest">
              Synchronization with isolated database in progress.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 md:p-10 overflow-y-auto max-h-[75vh] scrollbar-none">
            <DailyRecordForm
              initialData={editingRecord}
              onSubmit={handleFormSubmit}
              isLoading={isAdding || isUpdating}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal - FIXED COLOR */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-[2.5rem] p-10  shadow-2xl  overflow-hidden outline-none">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-loss" />
          <AlertDialogHeader className="space-y-6">
            <div className="w-20 h-20 bg-loss/10 rounded-[2rem] flex items-center justify-center mx-auto text-loss shadow-inner animate-pulse">
              <Trash2 size={40} />
            </div>
            <div className="text-center space-y-3">
              <AlertDialogTitle className="text-3xl font-black tracking-tighter uppercase">Delete Record?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-bold px-4 text-xs leading-relaxed uppercase tracking-wide">
                Executing this will purge the record from your isolated environment. This action is <span className="text-loss underline underline-offset-4">irreversible</span>.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 flex-col sm:flex-row gap-4">
            <AlertDialogCancel className="w-auto rounded-2xl font-black uppercase tracking-widest py-5 h-auto cursor-pointer border-border hover:text-red-500 hover:bg-muted m-0 transition-all text-[10px]">Cancel Operation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-auto bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-2xl font-black uppercase tracking-widest py-5 h-auto shadow-2xl shadow-loss/40 m-0 transition-all active:scale-[0.98] text-[10px]"
            >
              Confirm Purge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}
