import { Link } from 'react-router-dom';
import { Activity, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';

export function Header() {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">PULSE</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            to="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
          <Link
            to="/monitors"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Monitors
          </Link>
          <Link
            to="/incidents"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Incidents
          </Link>
          <Link
            to="/projects"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Projects
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
