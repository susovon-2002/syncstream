'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Send, Video, VideoOff, Smile } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFirebase } from '@/firebase';
import { useCollection, useDoc } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
import { UserVideo } from './user-video';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';


export function ChatPanel({ roomId }: { roomId: string }) {
  const { firestore, user } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const roomRef = useMemoFirebase(() => doc(firestore, 'rooms', roomId), [firestore, roomId]);
  const { data: room, isLoading: loadingRoom } = useDoc(roomRef);

  const messagesRef = useMemoFirebase(() => collection(firestore, 'rooms', roomId, 'chatMessages'), [firestore, roomId]);
  const messagesQuery = useMemoFirebase(() => query(messagesRef, orderBy('timestamp', 'asc'), limit(50)), [messagesRef]);
  const { data: messages, isLoading: loadingMessages } = useCollection(messagesQuery);
  
  const roomUsersRef = useMemoFirebase(() => collection(firestore, 'rooms', roomId, 'roomUsers'), [firestore, roomId]);
  const { data: participants, isLoading: loadingParticipants } = useCollection(roomUsersRef);

  const isHost = user && room ? room.hostId === user.uid : false;

  const handleMakeHost = (newHostId: string) => {
    if (!isHost || !user) return;
    const oldHostId = user.uid;

    const updatedMembers = {
      ...room.members,
      [newHostId]: 'host',
      [oldHostId]: 'participant',
    };

    updateDocumentNonBlocking(roomRef, {
      hostId: newHostId,
      members: updatedMembers,
    });
  };

  const getUsername = (userId: string) => {
    const participant = participants?.find(p => p.uid === userId);
    return participant?.displayName || 'Anonymous';
  }
  
  const getUserAvatar = (userId: string) => {
    const participant = participants?.find(p => p.uid === userId);
    return participant?.photoURL;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      addDocumentNonBlocking(messagesRef, {
        userId: user.uid,
        message: newMessage,
        timestamp: new Date(),
      });
      setNewMessage('');
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prevMessage => prevMessage + emojiData.emoji);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        // @ts-ignore
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const toggleCamera = () => {
    setIsCameraOn(prev => !prev);
  }

  return (
    <Card className="h-full flex flex-col bg-card/80">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Participants</CardTitle>
            <Button variant="ghost" size="icon" onClick={toggleCamera}>
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
        </div>

        {isCameraOn && user && (
            <div className="pt-2">
                <UserVideo user={user} />
            </div>
        )}
        
        <div className="flex items-center gap-3 pt-2 overflow-x-auto">
          {!loadingParticipants && participants?.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={!isHost || p.uid === user?.uid}>
                  <div className="relative cursor-pointer">
                    <Avatar>
                      <AvatarImage src={p.photoURL} />
                      <AvatarFallback>{p.displayName?.charAt(0) || 'A'}</AvatarFallback>
                    </Avatar>
                    {room?.hostId === p.uid && (
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                        <Crown className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleMakeHost(p.uid)}>
                    Make Host
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-xs text-muted-foreground w-16 truncate">{p.uid === user?.uid ? 'You' : p.displayName}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Live Chat</h3>
        </div>
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {loadingMessages && <p className="text-center text-muted-foreground">Loading chat...</p>}
            {messages?.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2 ${msg.userId === user?.uid ? 'justify-end' : ''}`}>
                <div className={`flex flex-col ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-lg px-3 py-2 ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{getUsername(msg.userId)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <Input
              placeholder={user ? "Say something..." : "Sign in to chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!user}
              className="flex-1"
            />
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!user}>
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </PopoverContent>
            </Popover>
            <Button type="submit" size="icon" disabled={!user}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
