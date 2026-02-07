import Link from 'next/link';

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

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card/20 text-foreground/80 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Logo />
                <span className="font-headline">SyncStream</span>
            </Link>
            <div className='mt-4 space-y-2 text-sm'>
                <p className='font-semibold'>Contact Us</p>
                <p>susovonsantra4@gmail.com</p>
            </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-4">Company</h3>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-4">Resources</h3>
          <ul className="space-y-2">
            <li><Link href="/support" className="hover:text-primary transition-colors">Support</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Statement</Link></li>
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto text-center mt-10 border-t border-border/50 pt-6">
        <p className="text-sm text-foreground/60">
            &copy; {currentYear} SyncStream. All Rights Reserved.
        </p>
        <p className="text-sm text-foreground/60 mt-2">
            Made with ❤️ in the India
        </p>
      </div>
    </footer>
  );
}
