import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { Headphones } from 'lucide-react';
import { PulseLogo } from '@/components/PulseLogo';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border/40">
        <div className="container grid grid-cols-3 items-center py-3">
          {/* Left - Logo */}
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <PulseLogo className="scale-75 opacity-50" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Pulse</span>
          </div>

          {/* Center - Copyright */}
          <p className="text-[10px] text-muted-foreground/50 text-center">
            &copy; {new Date().getFullYear()} Applied Cloud Computing
          </p>

          {/* Right - Support */}
          <div className="flex justify-end">
            <a
              href="mailto:pushpak.patil@acc.ltd?subject=PULSE Support"
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <Headphones className="h-3 w-3" />
              <span>Get Help</span>
            </a>
          </div>
        </div>
      </footer>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />
    </div>
  );
}
