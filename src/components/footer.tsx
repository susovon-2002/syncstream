import Link from 'next/link';
import { Clapperboard, Facebook, Instagram, Linkedin, Send, Twitter, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-card/20 text-foreground/80 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
        <div className="col-span-1 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Clapperboard className="h-7 w-7 text-primary" />
                <span className="font-headline">SyncStream</span>
            </Link>
            <div className='mt-4 space-y-2 text-sm'>
                <p className='font-semibold'>Contact Us</p>
                <p>support@syncstream.app</p>
            </div>
            <div className='mt-4 space-y-2 text-sm'>
                <p className='font-semibold'>Follow Us</p>
                <div className='flex space-x-4 mt-2'>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Facebook size={20}/></Link>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Instagram size={20}/></Link>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Twitter size={20}/></Link>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Linkedin size={20}/></Link>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Youtube size={20}/></Link>
                    <Link href="#" className="text-foreground/60 hover:text-primary"><Send size={20}/></Link>
                </div>
            </div>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-4">Company</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-4">Resources</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-primary transition-colors">Community</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Support</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Events</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground mb-4">Legal</h3>
          <ul className="space-y-2">
            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Statement</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Use</Link></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto text-center mt-10 border-t border-border/50 pt-6">
        <p className="text-sm text-foreground/60">
            Made with ❤️ in the Cloud
        </p>
      </div>
    </footer>
  );
}
