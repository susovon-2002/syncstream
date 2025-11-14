"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export function RoomIdDisplay({ roomId }: { roomId: string }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 rounded-md border bg-secondary/50 p-2 font-code text-sm">
        <span>Room ID: {roomId}</span>
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
      </div>
    </TooltipProvider>
  );
}
