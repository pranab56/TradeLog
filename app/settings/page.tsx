"use client";

import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock,
  Database,
  Monitor,
  Moon,
  Save,
  Shield,
  Sun,
  Trash2,
  User
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  if (!mounted) return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl animate-pulse">
        <div className="h-10 bg-accent/20 w-48 rounded-lg" />
        <div className="h-6 bg-accent/20 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-accent/10 rounded-xl" />
          <div className="h-64 bg-accent/10 rounded-xl" />
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-8 ">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Configuration</h1>
            <p className="text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-2 opacity-50" />
              Last updated: Feb 24, 2026
            </p>
          </div>
          <Button className="rounded-xl px-8 h-12 shadow-lg cursor-pointer shadow-primary/20 font-bold">
            <Save className="w-5 h-5 mr-2" />
            Save All Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Info Card */}
          <Card className="border-border bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="p-8 border-b border-border/50 bg-accent/5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                  <CardDescription>Personal identification and capital settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 flex-1">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trader-name" className="text-sm font-semibold text-muted-foreground">TRADER NAME</Label>
                  <Input
                    id="trader-name"
                    type="text"
                    defaultValue="Prop Trader"
                    className="bg-accent/20 border-border h-12 rounded-xl focus-visible:ring-primary/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capital" className="text-sm font-semibold text-muted-foreground">STARTING CAPITAL ($)</Label>
                  <Input
                    id="capital"
                    type="number"
                    defaultValue="50000"
                    className="bg-accent/20 border-border h-12 rounded-xl focus-visible:ring-primary/30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Card */}
          <Card className="border-border bg-card/50 backdrop-blur-sm rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="p-8 border-b border-border/50 bg-accent/5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl">Visual Preferences</CardTitle>
                  <CardDescription>Customize the application theme and feel.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`group p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${theme === 'light' ? 'border-primary bg-primary/5 active:scale-95' : 'border-border bg-accent/10 hover:border-primary/50 hover:bg-accent/20'}`}
                >
                  <Sun className={`w-8 h-8 transition-transform group-hover:rotate-12 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-xs uppercase tracking-wider ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Light</span>
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`group p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${theme === 'dark' ? 'border-primary bg-primary/5 active:scale-95' : 'border-border bg-accent/10 hover:border-primary/50 hover:bg-accent/20'}`}
                >
                  <Moon className={`w-8 h-8 transition-transform group-hover:-rotate-12 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Dark</span>
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`group p-5 rounded-xl border-2 transition-all flex flex-col items-center justify-center space-y-3 cursor-pointer ${theme === 'system' ? 'border-primary bg-primary/5 active:scale-95' : 'border-border bg-accent/10 hover:border-primary/50 hover:bg-accent/20'}`}
                >
                  <Monitor className={`w-8 h-8 transition-transform group-hover:scale-110 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-bold text-xs uppercase tracking-wider ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`}>System</span>
                </button>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "The theme will automatically adjust to provide the best contrast for your trading environment."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Management Card */}
        <Card className="border-red-500/20 bg-red-500/5 rounded-xl overflow-hidden shadow-lg shadow-red-500/5">
          <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start space-x-6 gap-3 text-center md:text-left">
              <div className="p-4 rounded-2xl bg-red-500 text-white shadow-xl shadow-red-500/30 shrink-0 mx-auto md:mx-0">
                <Database className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl text-red-500 font-bold">Data Management</CardTitle>
                <CardDescription className="text-red-500/70 max-w-md text-base">
                  Purge all your trading logs and performance analytics. This action is irreversible and will reset your entire dashboard.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="destructive"
              className="h-12 px-10 rounded-xl font-medium text-base shadow-xl cursor-pointer w-full md:w-auto"
            >
              <Trash2 className="w-6 h-6 mr-2" />
              PURGE ALL DATA
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

