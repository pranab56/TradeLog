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
import { useGetMeQuery, useUpdateProfileMutation } from '@/features/auth/authApi';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Monitor,
  Moon,
  Save,
  Shield,
  Sun,
  User
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useGetMeQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update name state when data is loaded
  useEffect(() => {
    if (data?.user?.name && !name) {
      setName(data.user.name);
    }
  }, [data]);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleSave = async () => {
    try {
      await updateProfile({ name }).unwrap();
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to update profile.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
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
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {message && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-right-4 ${message.type === 'success' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{message.text}</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isUpdating || !name}
              className="rounded-xl px-8 h-12 shadow-lg cursor-pointer shadow-primary/20 font-bold active:scale-95 transition-transform disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </Button>
          </div>
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
                  <CardDescription>Personal identification.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="trader-name" className="text-sm font-semibold text-muted-foreground">TRADER NAME</Label>
                    <Input
                      id="trader-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-accent/20 border-border h-12 rounded-xl focus-visible:ring-primary/30 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-muted-foreground">EMAIL</Label>
                    <Input
                      id="email"
                      type="text"
                      value={data?.user?.email || ''}
                      readOnly
                      className="bg-accent/10 border-border h-12 rounded-xl opacity-60 cursor-not-allowed font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-1">Email is locked to your account</p>
                  </div>
                </div>
              )}
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
                  <CardDescription>Customize the application theme.</CardDescription>
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
      </div>
    </MainLayout>
  );
}
