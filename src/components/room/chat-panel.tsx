"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const participants = [
  { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
  { name: 'Mia', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d' },
  { name: 'You', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d' },
];

const initialMessages = [
  { user: 'Alex', text: 'Hey everyone! Ready for this movie?' },
  { user: 'Mia', text: 'Yesss, I have my popcorn ready! 🍿' },
];

type Message = {
  user: string;
  text: string;
};

export function ChatPanel({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([...messages, { user: 'You', text: newMessage }]);
      setNewMessage('');
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card/80">
      <CardHeader>
        <CardTitle className="text-lg">Participants</CardTitle>
        <div className="flex items-center gap-3 pt-2">
          {participants.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-1">
              <Avatar>
                <AvatarImage src={p.avatar} />
                <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Live Chat</h3>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-2 ${msg.user === 'You' ? 'justify-end' : ''}`}>
                <div className={`flex flex-col ${msg.user === 'You' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-lg px-3 py-2 ${msg.user === 'You' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">{msg.user}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Say something..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
