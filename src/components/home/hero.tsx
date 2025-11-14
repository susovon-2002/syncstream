'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

export function Hero() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();
  const { user, firestore } = useFirebase();

  const handleCreateRoom = () => {
    if (!user) return;
    const newRoomId = Math.random().toString(36).substring(2, 8);
    
    const roomRef = doc(firestore, 'rooms', newRoomId);
    setDocumentNonBlocking(roomRef, {
      id: newRoomId,
      hostId: user.uid,
      createdAt: new Date(),
      members: {
        [user.uid]: 'host',
      }
    }, { merge: true });

    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && user) {
       const roomRef = doc(firestore, 'rooms', roomId.trim());
        setDocumentNonBlocking(roomRef, {
            members: {
                [user.uid]: 'participant'
            }
        }, { merge: true });
      router.push(`/room/${roomId.trim()}`);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-8 py-10 md:py-20 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl font-headline uppercase">
        SyncStream
      </h1>
      <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
        WE LIVE IN A TWILIGHT WORLD.
      </p>
      
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-border/20">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Get Started</CardTitle>
          <CardDescription>Create a new room or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <Button size="lg" className="w-full font-bold text-lg uppercase tracking-wider" onClick={handleCreateRoom}>
                <PartyPopper className="mr-2" /> Create Room
              </Button>

              <div className="flex items-center gap-4">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">OR</span>
                <Separator className="flex-1" />
              </div>
              
              <form onSubmit={handleJoinRoom} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="ENTER ROOM ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="font-code text-center tracking-widest placeholder:text-muted-foreground/50"
                  aria-label="Room ID to join"
                />
                <Button type="submit" size="icon" variant="secondary" aria-label="Join Room">
                  <ArrowRight />
                </Button>
              </form>
            </>
          ) : (
             <Button size="lg" className="w-full" asChild>
                <Link href="/login">Login to Get Started</Link>
             </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
