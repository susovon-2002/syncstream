'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '../ui/label';
import { Film, Monitor, UploadCloud } from 'lucide-react';

interface AddMediaTabsProps {
  onUrlSelect: (url: string | MediaStream, title: string, source: 'youtube' | 'file' | 'screen') => void;
}

export function AddMediaTabs({ onUrlSelect }: AddMediaTabsProps) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const isYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    return youtubeRegex.test(url);
  }

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    const source = isYoutubeUrl(url) ? 'youtube' : 'file';
    const title = url.split('/').pop() || 'Direct Media';
    onUrlSelect(url, title, source);
  };
  
  const handleShareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      onUrlSelect(stream, "Screen Share", 'screen');
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      onUrlSelect(fileUrl, file.name, 'file');
    }
  };

  return (
    <Tabs defaultValue="url" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="url">From URL</TabsTrigger>
        <TabsTrigger value="screen">Share Screen</TabsTrigger>
        <TabsTrigger value="upload">Upload File</TabsTrigger>
      </TabsList>
      <TabsContent value="url">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Add from URL</CardTitle>
            <CardDescription>Enter a video or audio URL to start watching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddUrl} className="space-y-4">
              <Input name="url" placeholder="https://example.com/video.mp4" required onChange={(e) => setUrl(e.target.value)} value={url} />
              <Button type="submit" className="w-full">
                <Film className="mr-2"/> Watch
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="screen">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Share Your Screen</CardTitle>
            <CardDescription>Share a window, tab, or your entire screen with the room.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleShareScreen} className="w-full">
              <Monitor className="mr-2" /> Start Screen Share
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="upload">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Upload your own video or audio file. (Visible only to you)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="flex items-center justify-center w-full">
                  <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                          {file ? (
                            <p className="font-semibold text-sm">{file.name}</p>
                          ) : (
                            <>
                              <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                              <p className="text-xs text-muted-foreground">MP4, WEBM, MP3, etc.</p>
                            </>
                          )}
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
                  </Label>
              </div>
              <Button type="submit" className="w-full" disabled={!file}>Upload and Play</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
