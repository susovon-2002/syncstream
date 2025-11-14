'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';

export function Hero() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();
  const { auth, user, firestore } = useFirebase();

  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth]);

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
      <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-accent">
        Watch. Chat. Together.
      </h1>
      <p className="max-w-3xl text-lg text-muted-foreground md:text-xl">
        Create a room, share the link, and enjoy videos or music with your friends in perfect sync. Your private watch party awaits.
      </p>
      
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Get Started</CardTitle>
          <CardDescription>Create a new room or join an existing one.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button size="lg" className="w-full font-bold text-lg" onClick={handleCreateRoom} disabled={!user}>
            <PartyPopper className="mr-2" /> Create a New Room
          </Button>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
          </div>
          
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter Room ID..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="font-code text-center tracking-widest"
              aria-label="Room ID to join"
              disabled={!user}
            />
            <Button type="submit" size="icon" variant="secondary" aria-label="Join Room" disabled={!user}>
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
