"use client";

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetTradesQuery } from '@/features/trades/tradesApi';
import { format } from 'date-fns';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Settings as SettingsIcon
} from 'lucide-react';

export default function ReportsPage() {
  const { data: records = [], isLoading } = useGetTradesQuery(undefined);

  const exportToCSV = () => {
    if (!records || records.length === 0) return;

    const headers = ["Date", "Profit", "Loss", "Net Profit", "RR Ratio", "Notes", "Tags"];
    const rows = records.map((r: any) => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.profit,
      r.loss,
      (r.profit || 0) - (r.loss || 0),
      r.riskRewardRatio,
      `"${r.notes?.replace(/"/g, '""')}"`,
      `"${r.tags?.join(', ')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TradeLog_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-1 uppercase">Reports & Data Factory</h1>
          <p className="text-muted-foreground font-medium">Extract your isolated trading intelligence for external synthesis.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-10 rounded-[2rem] flex flex-col items-center text-center shadow-sm hover:shadow-primary/5 transition-all">
            <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-8 animate-pulse">
              <FileSpreadsheet className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Legacy CSV Export</h3>
            <p className="text-muted-foreground mb-10 text-sm max-w-[280px] font-medium leading-relaxed">
              Generate a raw data blueprint of every single record in your isolated database for Excel or Sheets.
            </p>
            <Button
              onClick={exportToCSV}
              disabled={isLoading || records.length === 0}
              className="w-full h-auto py-5 rounded-2xl font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-2xl shadow-primary/20 flex items-center justify-center space-x-3 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-6 h-6" />}
              <span>Download .CSV Data</span>
            </Button>
            {records.length === 0 && !isLoading && (
              <p className="text-[10px] uppercase font-black text-destructive mt-4">No records found to export</p>
            )}
          </div>

          <div className="bg-card border border-border p-10 rounded-[2rem] flex flex-col items-center text-center opacity-40 grayscale">
            <div className="w-24 h-24 bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground mb-8">
              <FileText className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black uppercase mb-3">Enterprise PDF</h3>
            <p className="text-muted-foreground mb-10 text-sm max-w-[280px] font-medium leading-relaxed">
              Create a visualized performance audit for investors or personal reviews.
            </p>
            <Button disabled className="w-full py-5 rounded-2xl font-black uppercase tracking-widest bg-muted text-muted-foreground cursor-not-allowed h-auto">
              Vault Locked
            </Button>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/10 p-10 rounded-[2rem]">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-2 bg-primary rounded-lg text-white">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <h4 className="font-black text-xl uppercase tracking-tight">Factory Filters</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Temporal Range</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-card border-border px-6 h-auto py-5 rounded-2xl text-sm font-black focus:ring-primary/20 cursor-pointer shadow-sm">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="all">ALL TIME HORIZON</SelectItem>
                  <SelectItem value="30days">LAST 30 CYCLES</SelectItem>
                  <SelectItem value="thismonth">CURRENT MONTH</SelectItem>
                  <SelectItem value="thisyear">FISCAL YEAR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Contextual Tags</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-card border-border px-6 h-auto rounded-2xl py-5 text-sm font-black focus:ring-primary/20 cursor-pointer shadow-sm">
                  <SelectValue placeholder="Select Tags" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-xl">
                  <SelectItem value="all">EVERY TAG MATCH</SelectItem>
                  <SelectItem value="scalp">SCALPING ONLY</SelectItem>
                  <SelectItem value="swing">SWING ONLY</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
