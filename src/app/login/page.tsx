'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Login page is no longer used. Redirects to home.
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
