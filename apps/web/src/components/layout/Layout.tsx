import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Toaster } from 'sonner';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      <footer className="border-t py-4">
        <div className="container flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <p>&copy; {new Date().getFullYear()} PULSE Monitoring. Created by Pushpak Patil. All rights reserved.</p>
          <a
            href="mailto:pushpak.patil@acc.ltd?subject=PULSE Support"
            className="text-primary hover:underline"
          >
            Need help? Contact Support
          </a>
        </div>
      </footer>
      <Toaster position="top-right" />
    </div>
  );
}
