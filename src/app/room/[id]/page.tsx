import { Header } from '@/components/header';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoPlayer } from '@/components/room/video-player';
import { Users } from 'lucide-react';
import { RoomIdDisplay } from '@/components/room/room-id-display';

export default function RoomPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col h-dvh bg-background">
      <Header>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">3</span>
          </div>
          <RoomIdDisplay roomId={params.id} />
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
  );
}
