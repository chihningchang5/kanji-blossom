import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}${window.location.pathname}`,
    });
    if (error) {
      console.error('Login error:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">載入中...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 animate-fade-in">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold">
          <span className="text-primary">日</span>本語の単語
        </h1>
        <p className="text-muted-foreground text-lg">每日五詞，輕鬆學日語</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        <Button
          onClick={handleGoogleLogin}
          className="w-full h-12 text-base gap-3"
          size="lg"
        >
          <LogIn className="w-5 h-5" />
          使用 Google 帳號登入
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          首次登入將自動建立帳號
        </p>
      </div>
    </div>
  );
}
