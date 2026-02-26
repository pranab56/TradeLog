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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetMeQuery, useUpdateProfileMutation } from '@/features/auth/authApi';
import { cn } from '@/lib/utils';
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns';
import {
  AlertCircle,
  AtSign,
  Camera,
  CheckCircle2,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clock,
  FileText,
  Hash,
  Image as ImageIcon,
  Key,
  Loader2,
  Save,
  ShieldCheck,
  User,
  Wallet
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useGetMeQuery(undefined);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  // Profile States
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Capital States
  const [initialCapital, setInitialCapital] = useState<string>('0');
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date());

  // Security States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUploading, setIsUploading] = useState<'profile' | 'cover' | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update name state when data is loaded
  useEffect(() => {
    if (data?.user) {
      if (!name) setName(data.user.name || '');
      if (!username) setUsername(data.user.username || '');
      if (!bio) setBio(data.user.bio || '');
      if (!profileImage) setProfileImage(data.user.profileImage || '');
      if (!coverImage) setCoverImage(data.user.coverImage || '');

      if (initialCapital === '0' && data.user.initialCapital !== undefined) {
        setInitialCapital(data.user.initialCapital.toString());
      }
      if (data.user.capitalUpdateDate) {
        setSessionDate(new Date(data.user.capitalUpdateDate));
      }
    }
  }, [data]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.url) {
        if (type === 'profile') setProfileImage(result.url);
        else setCoverImage(result.url);
        setMessage({ text: `${type === 'profile' ? 'Profile' : 'Cover'} image uploaded!`, type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to upload image.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsUploading(null);
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name,
        username,
        bio,
        profileImage,
        coverImage,
        initialCapital: parseFloat(initialCapital) || 0,
        capitalUpdateDate: sessionDate?.toISOString(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      }).unwrap();

      setMessage({ text: 'Settings updated successfully!', type: 'success' });
      // Reset passwords after save
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.data?.error || 'Failed to update settings.', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!mounted) return null;

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        {/* Header with Visuals */}
        <div className="relative">
          {/* Cover Photo */}
          <div className="h-48 md:h-64 rounded-3xl overflow-hidden relative group bg-accent/20 border border-border">
            {coverImage ? (
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  disabled={!!isUploading}
                />
                <Button variant="secondary" asChild className="rounded-full h-10 px-4 font-bold shadow-xl">
                  <span>
                    {isUploading === 'cover' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                    Change Cover
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Profile Photo Overlap */}
          <div className="absolute -bottom-16 left-8 flex items-end space-x-6">
            <div className="relative group">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-card overflow-hidden shadow-2xl relative">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <User className="w-16 h-16 text-primary" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'profile')}
                      disabled={!!isUploading}
                    />
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
                      {isUploading === 'profile' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4 hidden md:block">
              <h2 className="text-2xl font-black">{name || 'Your Name'}</h2>
              <p className="text-muted-foreground font-bold flex items-center">
                <AtSign className="w-4 h-4 mr-1 opacity-50" /> {username || 'username'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-20 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-16">
          <div className="md:hidden pt-4">
            <h2 className="text-2xl font-black">{name || 'Your Name'}</h2>
            <p className="text-muted-foreground font-bold flex items-center">
              <AtSign className="w-4 h-4 mr-1 opacity-50" /> {username || 'username'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-bold flex items-center bg-accent/10 px-4 py-2 rounded-full w-fit">
              <Clock className="w-4 h-4 mr-2" />
              Session Data: {sessionDate ? format(sessionDate, 'MMMM yyyy') : 'N/A'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {message && (
              <div className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black animate-in fade-in slide-in-from-right-4",
                message.type === 'success' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
              )}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{message.text}</span>
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className="rounded-2xl px-8 h-12 shadow-xl cursor-pointer shadow-primary/20 font-black active:scale-95 transition-transform disabled:opacity-50 text-white"
            >
              {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Commit Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Identity & Bio</CardTitle>
                    <CardDescription className="font-bold">How other's see you in the trade network.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase flex items-center">
                      <Hash className="w-3.5 h-3.5 mr-1" /> Full Display Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase flex items-center">
                      <AtSign className="w-3.5 h-3.5 mr-1" /> Trading Alias
                    </Label>
                    <Input
                      placeholder="trader_name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-muted-foreground uppercase flex items-center">
                    <FileText className="w-3.5 h-3.5 mr-1" /> Professional Bio
                  </Label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about your trading philosophy..."
                    className="w-full bg-accent/5 border border-border p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium resize-none shadow-inner"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card className="border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm border-l-4 border-l-amber-500/50">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">Security Protocol</CardTitle>
                    <CardDescription className="font-bold">Manage your access and encryption.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase flex items-center">
                      <Key className="w-3.5 h-3.5 mr-1" /> Current Password
                    </Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase flex items-center">
                      <Key className="w-3.5 h-3.5 mr-1" /> New Security Key
                    </Label>
                    <Input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground font-bold italic leading-relaxed">
                    Leave password fields empty if you don't wish to change your credentials. Updating password will require the correct current password.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Capital Session (Sidebar) */}
          <div className="space-y-8">
            <Card className="border-border bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-black">Capital Config</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase">Initial Capital ($)</Label>
                    <Input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(e.target.value)}
                      className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-black text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase">Session Month</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full h-12 justify-start text-left font-black rounded-2xl border-border bg-accent/5 hover:bg-accent/10 transition-colors",
                            !sessionDate && "text-muted-foreground"
                          )}
                        >
                          <Clock className="mr-2 h-4 w-4 opacity-50 text-primary" />
                          {sessionDate ? format(sessionDate, "MMMM yyyy") : <span>Pick month</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 rounded-2xl border-border shadow-2xl bg-card/95 backdrop-blur-xl" align="start">
                        <div className="flex items-center justify-between mb-4 px-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sessionDate && setSessionDate(setYear(sessionDate, getYear(sessionDate) - 1))}
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                          >
                            <ChevronLeftIcon className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-black uppercase tracking-widest text-primary">
                            {sessionDate ? getYear(sessionDate) : getYear(new Date())}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => sessionDate && setSessionDate(setYear(sessionDate, getYear(sessionDate) + 1))}
                            className="h-8 w-8 rounded-full hover:bg-primary/10"
                          >
                            <ChevronRightIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {MONTHS.map((month: string, index: number) => {
                            const isSelected = sessionDate && getMonth(sessionDate) === index;
                            return (
                              <button
                                key={month}
                                onClick={() => {
                                  const baseDate = sessionDate || new Date();
                                  const newDate = setMonth(setYear(new Date(baseDate), getYear(baseDate)), index);
                                  newDate.setDate(1);
                                  setSessionDate(newDate);
                                }}
                                className={cn(
                                  "py-2.5 px-1 text-[10px] font-black uppercase rounded-xl transition-all border",
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                    : "bg-accent/5 border-transparent hover:border-primary/30 hover:bg-accent/10 text-muted-foreground"
                                )}
                              >
                                {month.substring(0, 3)}
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] uppercase font-black text-primary/60 mb-1">Calculation Advice</p>
                  <p className="text-xs text-muted-foreground font-bold italic leading-relaxed shadow-sm">
                    Changing capital values will instantly recalibrate your dashboard metrics and ROI curves.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
