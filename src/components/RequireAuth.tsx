import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-destructive">權限不足</h2>
      <p className="text-muted-foreground">您沒有管理員權限。</p>
      <a href="/" className="text-primary underline">返回首頁</a>
    </div>
  );

  return <>{children}</>;
}
