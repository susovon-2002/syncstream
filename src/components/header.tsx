import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type HeaderProps = HTMLAttributes<HTMLElement>;

export function Header({ className, children, ...props }: HeaderProps) {
  return (
    <header className={cn("py-4 px-4 sm:px-6 lg:px-8 border-b border-border/50", className)} {...props}>
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Clapperboard className="h-7 w-7 text-primary" />
          <span className="font-headline">SyncStream</span>
        </Link>
        {children}
      </div>
    </header>
  );
}
