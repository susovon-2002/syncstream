'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFirebase } from '@/firebase';
import { useCollection } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';

export function ChatPanel({ roomId }: { roomId: string }) {
  const { firestore, user } = useFirebase();
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const messagesRef = useMemoFirebase(() => collection(firestore, 'rooms', roomId, 'chatMessages'), [firestore, roomId]);
  const messagesQuery = useMemoFirebase(() => query(messagesRef, orderBy('timestamp', 'asc'), limit(50)), [messagesRef]);
  const { data: messages, isLoading: loadingMessages } = useCollection(messagesQuery);
  
  const roomUsersRef = useMemoFirebase(() => collection(firestore, 'rooms', roomId, 'roomUsers'), [firestore, roomId]);
  const { data: participants, isLoading: loadingParticipants } = useCollection(roomUsersRef);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      addDocumentNonBlocking(messagesRef, {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        avatar: user.photoURL,
        message: newMessage,
        timestamp: new Date(),
      });
      setNewMessage('');
    }
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

  return (
    <Card className="h-full flex flex-col bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Participants</CardTitle>
        <div className="flex items-center gap-3 pt-2">
          {!loadingParticipants && participants?.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <Avatar>
                <AvatarImage src={p.photoURL} />
                <AvatarFallback>{p.displayName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{p.uid === user?.uid ? 'You' : p.displayName}</span>
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
                  <span className="text-xs text-muted-foreground mt-1">{msg.username}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder={user ? "Say something..." : "Sign in to chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!user}
            />
            <Button type="submit" size="icon" disabled={!user}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
