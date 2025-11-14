'use client';

import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useFirebase } from '@/firebase';

import { Header } from '@/components/header';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoPlayer } from '@/components/room/video-player';
import { Users } from 'lucide-react';
import { RoomIdDisplay } from '@/components/room/room-id-display';
import { useCollection } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useMemoFirebase } from '@/firebase/provider';

export default function RoomPage({ params }: { params: { id: string } }) {
  const { auth, firestore, user } = useFirebase();

  const roomRef = useMemoFirebase(() => doc(firestore, 'rooms', params.id), [firestore, params.id]);
  const [room, loadingRoom] = useDocumentData(roomRef);

  const roomUsersRef = useMemoFirebase(() => roomRef && collection(roomRef, 'roomUsers'), [roomRef]);
  const { data: roomUsers, isLoading: loadingUsers } = useCollection(roomUsersRef);

  // Sign in anonymously if not authenticated
  useEffect(() => {
    if (!user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user]);

  // Handle user joining/leaving room
  useEffect(() => {
    if (user && firestore && params.id) {
      const userRef = doc(firestore, 'rooms', params.id, 'roomUsers', user.uid);
      setDocumentNonBlocking(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        photoURL: user.photoURL,
        joinedAt: new Date(),
      }, { merge: true });

      // TODO: Add onDisconnect logic for presence
    }
  }, [user, firestore, params.id]);


  const isHost = user && room ? room.hostId === user.uid : false;

  return (
    <div className="flex flex-col h-dvh bg-background">
      <Header>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{roomUsers?.length || 1}</span>
          </div>
          <RoomIdDisplay roomId={params.id} />
        </div>
      </Header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        <div className="lg:col-span-3 h-full min-h-0">
          <VideoPlayer roomId={params.id} isHost={isHost} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0">
          <ChatPanel roomId={params.id} />
        </div>
      </main>
    </div>
  );
}
