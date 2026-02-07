import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, Users, Wrench, Plug, ChevronDown, Tv, Menu, X, LayoutDashboard, Activity, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { PulseLogo } from '@/components/PulseLogo';

export function Header() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isSettingsActive = ['/team', '/maintenance', '/integrations', '/tv-dashboard'].some(p => location.pathname.startsWith(p));

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/monitors', label: 'Monitors', icon: Activity },
    { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { path: '/projects', label: 'Clients', icon: Building2 },
  ];

  const settingsLinks = [
    { path: '/team', label: 'Team Members', icon: Users },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/integrations', label: 'Integrations', icon: Plug },
    { path: '/tv-dashboard', label: 'TV Dashboard', icon: Tv },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3">
            <img src="/logo.png" alt="Company" className="h-6 sm:h-8 w-auto" />
            <div className="flex items-center space-x-1 sm:space-x-2">
              <PulseLogo />
              <span className="font-bold text-lg sm:text-xl">PULSE</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium">
          {navLinks.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-3 py-2 rounded-md transition-colors ${
                isActive(path)
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted text-foreground/60 hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}

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
                  {settingsLinks.map(({ path, label, icon: Icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setShowSettings(false)}
                      className={`flex items-center px-4 py-2 text-sm transition-colors ${
                        isActive(path)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Desktop User Menu */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="hidden xl:block">{user?.email}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={closeMobileMenu} />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 h-full w-72 bg-background z-50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-semibold">Menu</span>
            <button onClick={closeMobileMenu} className="p-2 rounded-md hover:bg-muted">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile User Info */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Logged in</p>
              </div>
            </div>
          </div>

          {/* Mobile Nav Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMobileMenu}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground/80'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            ))}

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </p>
            </div>

            {settingsLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMobileMenu}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground/80'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile Logout */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
