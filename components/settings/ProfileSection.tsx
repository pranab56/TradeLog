"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign, FileText, Hash, User } from 'lucide-react';
import { memo } from 'react';

interface ProfileSectionProps {
  name: string;
  setName: (value: string) => void;
  username: string;
  setUsername: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
}

const ProfileSection = ({
  name,
  setName,
  username,
  setUsername,
  bio,
  setBio
}: ProfileSectionProps) => {
  return (
    <Card className="border-border bg-card/40 backdrop-blur-md rounded-xl overflow-hidden shadow-sm p-0">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <User className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Identity & Bio</CardTitle>
            <CardDescription className="font-semibold">How other's see you in the trade network.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <Hash className="w-3.5 h-3.5 mr-1" /> Full Display Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-semibold"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <AtSign className="w-3.5 h-3.5 mr-1" /> Trading Alias
            </Label>
            <Input
              placeholder="trader_name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-accent/5 border-border h-12 rounded-2xl focus-visible:ring-primary/20 font-semibold"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center">
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
  );
};

export default memo(ProfileSection);
