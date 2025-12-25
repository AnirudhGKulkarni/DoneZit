import { useAuthContext } from '@/contexts/AuthContext';
import { Dashboard } from '@/components/Dashboard';
import { AuthScreen } from '@/components/AuthScreen';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthScreen />;
};

const Index = () => {
  return <AppContent />;
};

export default Index;
