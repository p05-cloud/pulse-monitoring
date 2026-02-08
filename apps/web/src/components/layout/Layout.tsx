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
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container grid grid-cols-3 items-center py-3">
          {/* Left - Logo */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <PulseLogo className="scale-75 opacity-70" />
            <span className="text-[11px] font-semibold tracking-wide uppercase opacity-80">Pulse</span>
          </div>

          {/* Center - Copyright */}
          <p className="text-[11px] text-center">
            <span className="text-muted-foreground">&copy; {new Date().getFullYear()}</span>{' '}
            <span className="font-medium bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Applied Cloud Computing
            </span>
          </p>

          {/* Right - Support */}
          <div className="flex justify-end">
            <a
              href="mailto:pushpak.patil@acc.ltd?subject=PULSE Support"
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Headphones className="h-3.5 w-3.5" />
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
