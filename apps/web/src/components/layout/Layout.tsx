import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from 'sonner';
import { Mail } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="flex-1 container py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="container flex flex-col sm:flex-row items-center justify-between py-5 gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PULSE Monitoring. Created by Pushpak Patil. All rights reserved.
          </p>
          <a
            href="mailto:pushpak.patil@acc.ltd?subject=PULSE Support"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Need help? Contact Support
          </a>
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
