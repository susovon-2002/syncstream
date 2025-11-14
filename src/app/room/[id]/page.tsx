import { Header } from '@/components/header';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoPlayer } from '@/components/room/video-player';
import { Copy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RoomPage({ params }: { params: { id: string } }) {
  return (
    <TooltipProvider>
      <div className="flex flex-col h-dvh bg-background">
        <Header>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">3</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-secondary/50 p-2 font-code text-sm">
              <span>Room ID: {params.id}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigator.clipboard.writeText(params.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy Room ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </Header>
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
          <div className="lg:col-span-3 h-full min-h-0">
            <VideoPlayer roomId={params.id} />
          </div>
          <div className="lg:col-span-1 h-full min-h-0">
            <ChatPanel roomId={params.id} />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
