import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { googleSignIn, auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface LoginViewProps {
  onLogin: (user: any) => void;
  onEnterGuest: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onEnterGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Premade account backdoor
    if (email === 'admin@mark.com' && password === 'mark123') {
      onLogin({
        uid: 'premade-admin-123',
        email: 'admin@mark.com',
        displayName: 'Admin Mark'
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        onLogin(userCredential.user);
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account already exists with this email.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password sign-in is not enabled in your Firebase Console. Please enable it in Firebase Authentication settings, or use Google Sign-In.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for OAuth operations. You need to add this app's URL to the 'Authorized domains' list in your Firebase Console (Authentication > Settings > Authorized domains).");
      } else {
        setError(err.message || 'Failed to authenticate.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result?.user) {
        onLogin(result.user);
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for OAuth. You need to add this app's URL to the 'Authorized domains' list in your Firebase Console (Authentication > Settings > Authorized domains).");
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
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
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                   <Mail className="w-5 h-5 text-white/40" />
                 </div>
                 <input
                   type="email"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required
                   className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-brand-indigo/50 transition-all placeholder:text-white/30 relative z-0"
                   placeholder="student@university.edu"
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-medium text-white/70 ml-1">Password</label>
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                   <Lock className="w-5 h-5 text-white/40" />
                 </div>
                 <input
                   type={showPassword ? "text" : "password"}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   required
                   className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-brand-indigo/50 focus:border-brand-indigo/50 transition-all placeholder:text-white/30 relative z-0"
                   placeholder="••••••••"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition-colors z-10"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
             </div>

             <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-indigo hover:bg-indigo-600 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(90,75,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
             >
               {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
             </button>
             
             <div className="text-center text-sm text-white/50 pt-2">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  onClick={() => setIsLogin(!isLogin)} 
                  className="text-brand-indigo hover:text-indigo-400 font-medium transition-colors ml-1"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
             </div>
          </form>

          <div className="mt-6 flex flex-col gap-4">
             <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/30 text-xs tracking-wider">OR</span>
                <div className="flex-grow border-t border-white/10"></div>
             </div>

             <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
             >
                {loading ? 'Processing...' : (
                  <>
                    <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                    Continue with Google
                  </>
                )}
             </button>

             <button
               onClick={onEnterGuest}
               className="w-full flex items-center justify-center gap-2 py-3 bg-transparent hover:bg-white/5 text-white/70 hover:text-white rounded-xl font-medium transition-all group"
             >
               <User className="w-4 h-4 text-white/50 group-hover:text-white/80" />
               Continue as Guest
               <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:translate-x-2 transition-all text-white/50" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
