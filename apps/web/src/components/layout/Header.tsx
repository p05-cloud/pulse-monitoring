import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, Users, Wrench, Plug, ChevronDown, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { PulseLogo } from '@/components/PulseLogo';

export function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isSettingsActive = ['/team', '/maintenance', '/integrations', '/tv-dashboard'].some(p => location.pathname.startsWith(p));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-3">
            <img src="/logo.png" alt="Company" className="h-8 w-auto" />
            <div className="flex items-center space-x-2">
              <PulseLogo />
              <span className="font-bold text-xl">PULSE</span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center space-x-1 text-sm font-medium flex-1">
          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/dashboard')
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-foreground/60 hover:text-foreground'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/monitors"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/monitors')
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-foreground/60 hover:text-foreground'
            }`}
          >
            Monitors
          </Link>
          <Link
            to="/incidents"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/incidents')
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-foreground/60 hover:text-foreground'
            }`}
          >
            Incidents
          </Link>
          <Link
            to="/projects"
            className={`px-3 py-2 rounded-md transition-colors ${
              isActive('/projects')
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-foreground/60 hover:text-foreground'
            }`}
          >
            Clients
          </Link>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                isSettingsActive
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground/60 hover:text-foreground'
              }`}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {showSettings && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-48 bg-background border rounded-lg shadow-lg z-50 py-1">
                  <Link
                    to="/team"
                    onClick={() => setShowSettings(false)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive('/team')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Team Members
                  </Link>
                  <Link
                    to="/maintenance"
                    onClick={() => setShowSettings(false)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive('/maintenance')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Maintenance
                  </Link>
                  <Link
                    to="/integrations"
                    onClick={() => setShowSettings(false)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive('/integrations')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Plug className="h-4 w-4 mr-2" />
                    Integrations
                  </Link>
                  <div className="border-t my-1" />
                  <Link
                    to="/tv-dashboard"
                    onClick={() => setShowSettings(false)}
                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                      isActive('/tv-dashboard')
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Tv className="h-4 w-4 mr-2" />
                    TV Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden md:block">{user?.email}</span>
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
