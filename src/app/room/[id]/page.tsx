'use client';

import { useEffect, use } from 'react';
import { doc, collection } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useFirebase } from '@/firebase';

import { Header } from '@/components/header';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoPlayer } from '@/components/room/video-player';
import { Users } from 'lucide-react';
import { RoomIdDisplay } from '@/components/room/room-id-display';
import { useCollection } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useMemoFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';

export default function RoomPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
  const { auth, firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'rooms', id) : null, [firestore, id]);
  const [room, loadingRoom] = useDocumentData(roomRef);

  const roomUsersRef = useMemoFirebase(
    () => (firestore && user && !isUserLoading) ? collection(roomRef, 'roomUsers') : null, 
    [firestore, user, isUserLoading, roomRef]
  );
  const { data: roomUsers, isLoading: loadingUsers } = useCollection(roomUsersRef);

  // Handle user joining/leaving room
  useEffect(() => {
    if (user && firestore && id) {
      const userRef = doc(firestore, 'rooms', id, 'roomUsers', user.uid);
      setDocumentNonBlocking(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email || 'Anonymous',
        photoURL: user.photoURL,
        joinedAt: new Date(),
      }, { merge: true });

      // TODO: Add onDisconnect logic for presence
    }
  }, [user, firestore, id]);

  if (isUserLoading || loadingRoom || !user) {
    return (
      <div className="flex flex-col h-dvh bg-background">
         <Header />
         <main className="flex-1 flex items-center justify-center">
            <p>Loading room...</p>
         </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-background">
      <Header>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">{roomUsers?.length || 1}</span>
          </div>
          <RoomIdDisplay roomId={id} />
        </div>
      </Header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-4 p-4 overflow-hidden">
        <div className="lg:col-span-1 h-full min-h-0">
          <VideoPlayer roomId={id} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0">
          <ChatPanel roomId={id} />
        </div>
      </main>
    </div>
  );
}
