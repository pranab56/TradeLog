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
import axios from 'axios';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function TradesPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (action === 'add') {
      setIsModalOpen(true);
    }
  }, [action]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/trades');
      setRecords(res.data);
    } catch (error) {
      console.error("Failed to fetch records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r =>
      format(new Date(r.date), 'yyyy-MM-dd').includes(search) ||
      r.notes?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
    );
  }, [records, search]);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await axios.delete(`/api/trades/${deleteConfirmId}`);
      fetchRecords();
      setDeleteConfirmId(null);
    } catch (error) {
      alert('Failed to delete record');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRecord) {
        await axios.put(`/api/trades/${editingRecord._id}`, data);
      } else {
        await axios.post('/api/trades', data);
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      fetchRecords();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save record');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Trade History</h1>
            <p className="text-muted-foreground">Manage and analyze your daily trading performance.</p>
          </div>
          <Button
            onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}
            className="rounded-2xl px-8 py-3.5 h-auto font-medium shadow-sm cursor-pointer shadow-primary/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Record
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl">
          <div className="p-6 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Search date(12-01-2026), notes or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-accent/30 border-none rounded-xl"
              />
            </div>
          </div>

          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-accent/20 hover:bg-accent/20 border-border">
                  <TableHead className="px-8 py-4 font-semibold text-muted-foreground h-auto">Date</TableHead>
                  <TableHead className="px-6 py-4 font-semibold text-muted-foreground text-right h-auto">Net Profit</TableHead>
                  <TableHead className="px-6 py-4 font-semibold text-muted-foreground text-right h-auto">Trades (W/L)</TableHead>
                  <TableHead className="px-6 py-4 font-semibold text-muted-foreground text-center h-auto">R:R</TableHead>
                  <TableHead className="px-6 py-4 font-semibold text-muted-foreground h-auto">Tags</TableHead>
                  <TableHead className="px-6 py-4 font-semibold text-muted-foreground text-right h-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-8 py-20 text-center text-muted-foreground">Loading records...</TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-8 py-20 text-center text-muted-foreground">No records found.</TableCell>
                  </TableRow>
                ) : filteredRecords.map((record) => {
                  const net = record.profit - record.loss;
                  return (
                    <TableRow key={record._id} className="hover:bg-accent/10 border-border group">
                      <TableCell className="px-8 py-5">
                        <div className="font-bold">{format(new Date(record.date), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{record.notes || 'No notes'}</div>
                      </TableCell>
                      <TableCell className={`px-6 py-5 text-right font-bold ${net >= 0 ? 'text-profit' : 'text-loss'}`}>
                        <div className="flex items-center justify-end space-x-1">
                          {net >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{net >= 0 ? '+' : ''}{net.toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] opacity-70">P: {record.profit} / L: {record.loss}</div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="font-medium">{record.totalTrades}</div>
                        <div className="text-[10px] text-muted-foreground font-bold">
                          <span className="text-profit">{record.winningTrades}W</span> / <span className="text-loss">{record.losingTrades}L</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-center">
                        <span className="bg-accent/50 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">1:{record.riskRewardRatio}</span>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-wrap gap-1">
                          {record.tags?.map((tag: string) => (
                            <span key={tag} className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md border border-primary/10 uppercase">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                            className="h-8 w-8 hover:bg-primary/10 cursor-pointer text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(record._id)}
                            className="h-8 w-8 hover:bg-loss/10 cursor-pointer text-loss"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="p-6 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing {filteredRecords.length} records</p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-xl disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 border-border rounded-xl disabled:opacity-30"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full bg-card border-border rounded-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 md:p-8 border-b border-border text-left">
            <DialogTitle className="text-2xl font-bold">
              {editingRecord ? 'Edit Daily Record' : 'Add Single Record'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Input your trading data for the single trade.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] scrollbar-thin">
            <DailyRecordForm
              initialData={editingRecord}
              onSubmit={handleFormSubmit}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-card border-border rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your trading record for this day.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="rounded-xl hover:text-red-500 hover:bg-red-500/10 cursor-pointer border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer rounded-xl shadow-lg shadow-red-500/20"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}

