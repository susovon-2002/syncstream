'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { generatePreviewAction } from '@/actions/generate-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '../ui/label';
import { Film, Link as LinkIcon, Loader2, UploadCloud } from 'lucide-react';
import Image from 'next/image';

interface AddMediaTabsProps {
  onUrlSelect: (url: string, title: string, source: 'youtube' | 'file') => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin mr-2" /> : <LinkIcon className="mr-2" />}
      Generate Preview
    </Button>
  );
}

export function AddMediaTabs({ onUrlSelect }: AddMediaTabsProps) {
  const initialState = { success: false, message: '', preview: undefined };
  const [state, formAction] = useActionState(generatePreviewAction, initialState);

  const canWatch = state.success && state.preview && !state.preview.error;
  
  const isYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/;
    return youtubeRegex.test(url);
  }

  const handleWatch = () => {
    if (!state.preview?.imageUrl) return;
    const url = state.preview.imageUrl;
    const title = state.preview.title;
    const source = isYoutubeUrl(url) ? 'youtube' : 'file';
    onUrlSelect(url, title, source);
  };

  return (
    <Tabs defaultValue="url" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="url">From URL</TabsTrigger>
        <TabsTrigger value="upload" disabled>Upload File</TabsTrigger>
      </TabsList>
      <TabsContent value="url">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Add from URL</CardTitle>
            <CardDescription>Enter a video or audio URL to start watching.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canWatch ? (
              <form action={formAction} className="space-y-4">
                <Input name="url" placeholder="https://example.com/video.mp4" required />
                <SubmitButton />
                {state.message && !state.success && <p className="text-sm text-destructive">{state.message}</p>}
              </form>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                    <div className="relative w-full md:w-32 h-24 md:h-full rounded-md overflow-hidden shrink-0">
                      <Image src={state.preview!.imageUrl} alt={state.preview!.title} fill className="object-cover" />
                    </div>
                    <div className="space-y-1 text-left">
                      <h3 className="font-semibold line-clamp-1">{state.preview!.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{state.preview!.description}</p>
                    </div>
                  </CardContent>
                </Card>
                <Button className="w-full" onClick={handleWatch}>
                  <Film className="mr-2"/> Watch this
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="upload">
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Upload your own video or audio file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center w-full">
                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">MP4, WEBM, MP3 (MAX. 500MB)</p>
                    </div>
                    <Input id="dropzone-file" type="file" className="hidden" />
                </Label>
            </div>
            <Button className="w-full" disabled>Upload and Play</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
