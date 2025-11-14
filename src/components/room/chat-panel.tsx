'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Send, Video, VideoOff, Smile, Paperclip, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFirebase } from '@/firebase';
import { useCollection, useDoc } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, query, orderBy, limit, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/provider';
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
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const displayName = participant?.displayName || 'Anonymous';
    if (displayName.includes(' ')) {
      return displayName.split(' ')[0];
    }
    return displayName;
  }
  
  const getUserAvatar = (userId: string) => {
    const participant = participants?.find(p => p.uid === userId);
    return participant?.photoURL;
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((newMessage.trim() || mediaFile) && user) {
        const messageData: any = {
            userId: user.uid,
            message: newMessage,
            timestamp: new Date(),
        };

        if (mediaFile) {
            // In a real app, you'd upload this to a storage service
            // and save the URL. For now, we use a local object URL.
            messageData.mediaUrl = mediaPreview; // Using local object URL
            messageData.mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        }
      
        addDocumentNonBlocking(messagesRef, messageData);
        setNewMessage('');
        setMediaFile(null);
        setMediaPreview(null);
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

 const toggleCamera = async () => {
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'rooms', roomId, 'roomUsers', user.uid);
    const newCameraState = !isCameraOn;
    setIsCameraOn(newCameraState);
    await updateDoc(userRef, { isCameraOn: newCameraState });
  }

  useEffect(() => {
    if(user && participants) {
        const currentUser = participants.find(p => p.uid === user.uid);
        if (currentUser) {
            setIsCameraOn(currentUser.isCameraOn);
        }
    }
  }, [user, participants]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setMediaFile(file);
          setMediaPreview(URL.createObjectURL(file));
      }
  };

  const handleRemoveMedia = () => {
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };

  return (
    <Card className="h-full flex flex-col bg-card/80">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Participants</CardTitle>
            <Button variant="ghost" size="icon" onClick={toggleCamera}>
                {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
        </div>
      </CardHeader>
      
      <div className="flex items-center gap-3 p-2 overflow-x-auto border-t">
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

            <span className="text-xs text-muted-foreground w-16 truncate">{p.uid === user?.uid ? 'You' : getUsername(p.uid)}</span>
          </div>
        ))}
      </div>
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
                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.userId === user?.uid ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-lg px-3 py-2 ${msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {msg.mediaUrl && (
                        <div className="mb-2">
                        {msg.mediaType === 'image' ? (
                            <img src={msg.mediaUrl} alt="chat media" className="rounded-md max-h-48" />
                        ) : (
                            <video src={msg.mediaUrl} controls className="rounded-md max-h-48" />
                        )}
                        </div>
                    )}
                    {msg.message && <p className="text-sm">{msg.message}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{getUsername(msg.userId)}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          {mediaPreview && (
              <div className="relative mb-2 w-24">
                  {mediaFile?.type.startsWith('image/') ? (
                      <img src={mediaPreview} alt="Preview" className="rounded-md h-24 w-24 object-cover" />
                  ) : (
                      <video src={mediaPreview} className="rounded-md h-24 w-24 object-cover" />
                  )}
                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveMedia}>
                      <X className="h-4 w-4" />
                  </Button>
              </div>
          )}
          <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
            <Input
              placeholder={user ? "Say something..." : "Sign in to chat"}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={!user}
              className="flex-1"
            />
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
            <Button variant="ghost" size="icon" type="button" disabled={!user} onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" type="button" disabled={!user}>
                  <Smile className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0">
                <EmojiPicker onEmojiClick={onEmojiClick} />
              </PopoverContent>
            </Popover>
            <Button type="submit" size="icon" disabled={!user || (!newMessage.trim() && !mediaFile)}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
