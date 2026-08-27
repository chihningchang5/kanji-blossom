import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PenTool, BookCheck, Settings, LogOut, CalendarDays, Menu, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { to: '/', label: '首頁', icon: Home, adminOnly: false },
  { to: '/quiz', label: '測驗', icon: PenTool, adminOnly: false },
  { to: '/learned', label: '已習得', icon: BookCheck, adminOnly: false },
  { to: '/calendar', label: '集點', icon: CalendarDays, adminOnly: false },
  { to: '/admin', label: '管理', icon: Settings, adminOnly: true },
];

export default function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="text-xl font-bold tracking-tight transition-opacity hover:opacity-80 sm:text-2xl">
          <span className="text-primary">日</span>本語の単語
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <Button key={item.to} variant={isActive ? 'secondary' : 'ghost'} size="sm" asChild>
                <Link to={item.to}>
                  <Icon className="mr-1 h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-1 h-4 w-4" aria-hidden="true" />
              登出
            </Button>
          )}
        </nav>

        <div className="md:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="開啟選單">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm px-5">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left font-serif text-xl">日文單字學習</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <Button
                      key={item.to}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="h-12 justify-start text-base"
                      asChild
                    >
                      <Link to={item.to} onClick={() => setMenuOpen(false)}>
                        <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}

                {user && (
                  <Button
                    variant="ghost"
                    className="mt-3 h-12 justify-start text-base text-destructive hover:text-destructive"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                  >
                    <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
                    登出
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
