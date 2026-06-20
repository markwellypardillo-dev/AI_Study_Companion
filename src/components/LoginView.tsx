import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertTriangle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: any) => void;
  onEnterGuest: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onEnterGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables to enable authentication.");
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (data.user) onLogin(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        if (data.user) {
            onLogin(data.user);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ 
        background: 'linear-gradient(135deg, #1b1b2f 0%, #162447 50%, #1f4068 100%)' 
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-indigo/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center p-3 bg-brand-indigo/20 rounded-2xl mb-4 border border-brand-indigo/30 backdrop-blur-md">
               <Sparkles className="w-8 h-8 text-brand-indigo drop-shadow-[0_0_8px_rgba(90,75,255,0.8)]" />
             </div>
             <h1 className="text-3xl font-bold text-white tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
             </h1>
             <p className="text-white/60 mt-2 text-sm">
                Focus on your studies with our intelligent assistant
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
             {error && (
               <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm backdrop-blur-md text-center">
                 {error}
               </div>
             )}
             
             <div className="space-y-1">
               <label className="text-xs font-medium text-white/70 ml-1">Email</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Mail className="w-5 h-5 text-white/40" />
                 </div>
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-brand-indigo/50 transition-all placeholder:text-white/30"
                   placeholder="student@university.edu"
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-medium text-white/70 ml-1">Password</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Lock className="w-5 h-5 text-white/40" />
                 </div>
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-brand-indigo/50 transition-all placeholder:text-white/30"
                   placeholder="••••••••"
                 />
               </div>
             </div>

             <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-indigo hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(90,75,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
             >
               {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
             </button>
          </form>

          <div className="mt-6 flex flex-col gap-4">
             <div className="text-center text-sm text-white/50">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-brand-indigo hover:text-indigo-400 font-medium transition-colors"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
             </div>

             <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-xs">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
             </div>

             <button
               onClick={onEnterGuest}
               className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium transition-all group"
             >
               <User className="w-4 h-4 text-white/60 group-hover:text-white" />
               Continue as Guest
               <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-white/60" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
