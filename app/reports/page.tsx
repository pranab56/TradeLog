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
import axios from 'axios';
import { format } from 'date-fns';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReportsPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await axios.get('/api/trades');
        setRecords(res.data);
      } catch (error) {
        console.error("Failed to fetch records", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const exportToCSV = () => {
    const headers = ["Date", "Profit", "Loss", "Net Profit", "Total Trades", "Wins", "Losses", "RR Ratio", "Notes", "Tags"];
    const rows = records.map(r => [
      format(new Date(r.date), 'yyyy-MM-dd'),
      r.profit,
      r.loss,
      r.profit - r.loss,
      r.totalTrades,
      r.winningTrades,
      r.losingTrades,
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
    link.setAttribute("download", `trading_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Reports & Export</h1>
          <p className="text-muted-foreground">Download your trading data for further analysis in Excel or Google Sheets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-10 rounded-xl flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6">
              <FileSpreadsheet className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Export to CSV</h3>
            <p className="text-muted-foreground mb-8 text-sm max-w-[280px]">
              Generate a comprehensive spreadsheet of all your recorded trades and metrics.
            </p>
            <Button
              onClick={exportToCSV}
              className="w-full h-auto py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center space-x-2 transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-5 h-5 mr-2" />
              Download .CSV Report
            </Button>
          </div>

          <div className="bg-card border border-border p-10 rounded-xl flex flex-col items-center text-center opacity-60">
            <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-muted-foreground mb-6">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Export to PDF</h3>
            <p className="text-muted-foreground mb-8 text-sm max-w-[280px]">
              Create a professional PDF summary of your weekly or monthly performance.
            </p>
            <Button disabled className="w-full py-4 rounded-2xl font-bold bg-secondary text-muted-foreground cursor-not-allowed h-auto">
              Coming Soon
            </Button>
          </div>
        </div>

        <div className="bg-accent/20 border border-border p-8 rounded-xl">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-primary" />
            <h4 className="font-bold">Report Settings</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date Range</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-card border-border p-3 h-auto py-6 rounded-xl text-sm font-medium focus:ring-primary/20 cursor-pointer">
                  <SelectValue placeholder="Select Range" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="thismonth">This Month</SelectItem>
                  <SelectItem value="thisyear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tag Filter</label>
              <Select defaultValue="all">
                <SelectTrigger className="w-full bg-card border-border p-3 h-auto rounded-xl py-6 text-sm font-medium focus:ring-primary/20 cursor-pointer">
                  <SelectValue placeholder="Select Tags" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="scalp">Scalp Only</SelectItem>
                  <SelectItem value="swing">Swing Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

