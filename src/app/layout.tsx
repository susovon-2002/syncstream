import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Footer } from '@/components/footer';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'SyncStream',
  description: 'Watch videos with friends in perfect sync.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-site-verification" content="V5sCe7J225esi-GxkmnvB159xb5B_UucIeeQrCv9zTw" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 10C22 10 18 7 12 7C6 7 4 11 4 11L18 15C18 15 22 13 22 10Z' fill='%23FF9933' /%3E%3Cpath d='M24 14C24 14 20 11 14 11C8 11 6 15 6 15L20 19C20 19 24 17 24 14Z' fill='%23FF9933' style='opacity: 0.8' /%3E%3Cpath d='M22 18C22 18 18 15 12 15C6 15 4 19 4 19L18 23C18 23 22 21 22 18Z' fill='%23FF9933' style='opacity: 0.6' /%3E%3C/svg%3E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
        {/* Google tag (gtag.js) */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-TZWPNW1JNJ"></Script>
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-TZWPNW1JNJ');
          `}
        </Script>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen" suppressHydrationWarning={true}>
        <FirebaseClientProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
