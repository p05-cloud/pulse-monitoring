import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { PulseLogo } from '@/components/PulseLogo';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border/40">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <PulseLogo className="scale-75 opacity-50" />
            <span className="text-[10px] font-medium tracking-wide uppercase">Pulse</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="mailto:pushpak.patil@acc.ltd?subject=PULSE Support"
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Support
            </a>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-[10px] text-muted-foreground/50">
              &copy; {new Date().getFullYear()} ACC
            </span>
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
