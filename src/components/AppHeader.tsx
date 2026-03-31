import { Link } from 'react-router-dom';
import { PenTool, BookCheck, Settings, LogOut, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="border-b border-border">
      <div className="container max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-primary">日</span>本語の単語
        </Link>
        <nav className="flex gap-2 items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/quiz"><PenTool className="w-4 h-4 mr-1" />測驗</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/learned"><BookCheck className="w-4 h-4 mr-1" />已習得</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin"><Settings className="w-4 h-4 mr-1" />管理</Link>
            </Button>
          )}
          {user && (
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-1" />登出
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
