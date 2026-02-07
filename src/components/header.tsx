'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type HeaderProps = HTMLAttributes<HTMLElement>;

const Logo = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
    >
        <path
            d="M21 14L10.5 21V7L21 14Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M17.5 14L7 21V7L17.5 14Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.5 }}
        />
    </svg>
);


export function Header({ className, children, ...props }: HeaderProps) {
  const { user, isUserLoading } = useFirebase();

  return (
    <header className={cn("py-4 px-4 sm:px-6 lg:px-8 border-b border-border/50", className)} {...props}>
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Logo />
          <span className="font-headline">SyncStream</span>
        </Link>
        <div className="flex items-center gap-4">
          {children}
          {!isUserLoading && user && (
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="text-[10px]">{user.uid.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </header>
  );
}
