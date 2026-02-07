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
            d="M22 10C22 10 18 7 12 7C6 7 4 11 4 11L18 15C18 15 22 13 22 10Z"
            fill="currentColor"
        />
        <path
            d="M24 14C24 14 20 11 14 11C8 11 6 15 6 15L20 19C20 19 24 17 24 14Z"
            fill="currentColor"
            style={{ opacity: 0.8 }}
        />
        <path
            d="M22 18C22 18 18 15 12 15C6 15 4 19 4 19L18 23C18 23 22 21 22 18Z"
            fill="currentColor"
            style={{ opacity: 0.6 }}
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
