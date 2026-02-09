'use client';

import { useEffect, use } from 'react';
import { doc, collection, updateDoc } from 'firebase/firestore';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { useFirebase } from '@/firebase';

import { Header } from '@/components/header';
import { ChatPanel } from '@/components/room/chat-panel';
import { VideoPlayer } from '@/components/room/video-player';
import { Users, AlertCircle } from 'lucide-react';
import { RoomIdDisplay } from '@/components/room/room-id-display';
import { useCollection } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useMemoFirebase } from '@/firebase/provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserVideo } from '@/components/room/user-video';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { firestore, user, isUserLoading } = useFirebase();

  const roomRef = useMemoFirebase(() => firestore ? doc(firestore, 'rooms', id) : null, [firestore, id]);
  const [room, loadingRoom, roomError] = useDocumentData(roomRef);

  const roomUsersRef = useMemoFirebase(
    () => (firestore && user && !isUserLoading && roomRef) ? collection(roomRef, 'roomUsers') : null, 
    [firestore, user, isUserLoading, roomRef]
  );
  const { data: roomUsers, isLoading: loadingUsers } = useCollection(roomUsersRef);

  // Handle user joining room
  useEffect(() => {
    if (user && firestore && id && roomRef) {
      // 1. Add user to the main room's members map for authorization
      setDocumentNonBlocking(roomRef, {
        members: {
          [user.uid]: 'participant'
        }
      }, { merge: true });

      // 2. Add user to the roomUsers subcollection for presence
      const userPresenceRef = doc(firestore, 'rooms', id, 'roomUsers', user.uid);
      setDocumentNonBlocking(userPresenceRef, {
        uid: user.uid,
        displayName: user.displayName || `Guest_${user.uid.substring(0, 4)}`,
        photoURL: user.photoURL,
        joinedAt: new Date(),
        isCameraOn: false,
      }, { merge: true });
    }
  }, [user, firestore, id, roomRef]);

  // Handle user leaving room (cleanup)
  useEffect(() => {
    if (!user || !firestore || !id) return;

    const handleBeforeUnload = () => {
      const userRef = doc(firestore, 'rooms', id, 'roomUsers', user.uid);
      updateDoc(userRef, { isCameraOn: false }); 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user, firestore, id]);

  const videoParticipants = roomUsers?.filter(p => p.isCameraOn);

  if (roomError) {
      return (
          <div className="flex flex-col h-dvh bg-background">
              <Header />
              <main className="flex-1 flex flex-col items-center justify-center p-4">
                  <Alert variant="destructive" className="max-w-md">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Access Denied</AlertTitle>
                      <AlertDescription>
                          We couldn't connect to this room. Please check the ID or your connection.
                      </AlertDescription>
                  </Alert>
                  <Button asChild className="mt-4">
                      <Link href="/">Back to Home</Link>
                  </Button>
              </main>
          </div>
      )
  }

  if (isUserLoading || loadingRoom || !user) {
    return (
      <div className="flex flex-col h-dvh bg-background">
         <Header />
         <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Joining room...</p>
            </div>
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
            <div className="flex -space-x-2 ml-2">
              <TooltipProvider>
                {roomUsers?.map((u) => (
                  <Tooltip key={u.id}>
                    <TooltipTrigger>
                      <Avatar className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={u.photoURL} />
                        <AvatarFallback className="text-[10px]">{u.displayName?.charAt(0) || 'G'}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{u.displayName}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
          <RoomIdDisplay roomId={id} />
        </div>
      </Header>
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-4 p-4 overflow-hidden">
        <div className="lg:col-span-1 h-full min-h-0 flex flex-col gap-4">
            <VideoPlayer roomId={id} />
        </div>
        <div className="lg:col-span-1 h-full min-h-0 flex flex-col gap-4 overflow-y-auto">
          {videoParticipants && videoParticipants.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                  {videoParticipants.map(p => (
                      <UserVideo key={p.id} user={p} isLocalUser={p.uid === user?.uid} />
                  ))}
              </div>
          )}
          <ChatPanel roomId={id} />
        </div>
      </main>
    </div>
  );
}
