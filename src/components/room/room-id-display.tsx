
"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);


export function RoomIdDisplay({ roomId }: { roomId: string }) {

  const handleShare = () => {
    const roomUrl = window.location.href;
    const message = `Join me on SyncStream! 🚀\n\nRoom ID: ${roomId}\n\nJoin here: ${roomUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 rounded-md border bg-secondary/50 p-2 font-code text-sm">
        <span>Room ID: {roomId}</span>
        <div className="flex items-center">
            <Tooltip>
            <TooltipTrigger asChild>
                <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => navigator.clipboard.writeText(roomId)}
                >
                <Copy className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Copy Room ID</p>
            </TooltipContent>
            </Tooltip>
            <Tooltip>
            <TooltipTrigger asChild>
                <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleShare}
                >
                <WhatsAppIcon />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Share on WhatsApp</p>
            </TooltipContent>
            </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
