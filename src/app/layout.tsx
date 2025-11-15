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
