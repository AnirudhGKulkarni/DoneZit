import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { Plus, LogOut, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import Logo from '@/components/Logo';

const TopNav: React.FC = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Theme handling (local to nav)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
    } catch (e) {}
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    }
  }, [isDark]);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button aria-label="Go to dashboard" onClick={() => navigate('/')} className="flex items-center">
                <Logo className="w-24 h-10 object-contain" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-foreground">DoneZit</h1>
                <p className="text-xs text-muted-foreground">
                  {(() => {
                    const name = user?.displayName || user?.email || '';
                    if (!name) return '';
                    if (user?.displayName) return name.split(' ')[0];
                    return name.split('@')[0];
                  })()}
                </p>
              </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} aria-label="Home">Home</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')} aria-label="Settings">Settings</Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">Logout</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark((v) => !v)}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-accent">
                <Avatar className="h-8 w-8">
                  {user?.photoURL ? (
                    <AvatarImage src={user.photoURL} />
                  ) : (
                    <AvatarFallback>{(user?.displayName || user?.email || 'U')[0]}</AvatarFallback>
                  )}
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  {(() => {
                    const name = user?.displayName || user?.email || 'User';
                    return name.split(' ')[0];
                  })()}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-4 py-3">
                <div className="text-sm font-semibold">{user?.displayName || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
