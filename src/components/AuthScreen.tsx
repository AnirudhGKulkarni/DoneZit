import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, firstName.trim() || undefined, lastName.trim() || undefined);
      }
      toast({ title: isLogin ? 'Welcome back!' : 'Account created!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Background video (place your file as public/loginbg.mp4 or loginbg.webm) */}
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/loginbg.mp4" type="video/mp4" />
        <source src="/loginbg.webm" type="video/webm" />
        {/* Fallback text */}
        Your browser does not support the video tag.
      </video>

      {/* Dim overlay to keep form readable */}
      <div className="absolute inset-0 bg-black/40 z-0" />

      <div className="absolute inset-0 z-10 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg relative z-20 flex flex-col items-center"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto mb-4"
            >
              <Logo className="w-30 h-24" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">DoneZit</h1>
            <p className="text-white/90 mt-2 drop-shadow-sm">Organize your life beautifully</p>
          </div>

          <div className="rounded-2xl shadow-xl border p-8 w-full bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex mb-6 bg-white/5 rounded-lg p-1">
            {['Login', 'Sign Up'].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setIsLogin(i === 0)}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  (i === 0 ? isLogin : !isLogin)
                    ? 'bg-white/20 shadow-sm text-white'
                    : 'text-white/70'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border-2 border-white/10 bg-white/5 text-white placeholder:text-white/70 focus:border-white/30 focus:outline-none transition-colors"
                  required={!isLogin}
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border-2 border-white/10 bg-white/5 text-white placeholder:text-white/70 focus:border-white/30 focus:outline-none transition-colors"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-lg border-2 border-white/10 bg-white/5 text-white placeholder:text-white/70 focus:border-white/30 focus:outline-none transition-colors"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-lg border-2 border-white/10 bg-white/5 text-white placeholder:text-white/70 focus:border-white/30 focus:outline-none transition-colors"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full py-4 bg-white text-gray-800 hover:bg-white/95"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>
        </div>

      </motion.div>
    </div>
    </div>
  );
};
