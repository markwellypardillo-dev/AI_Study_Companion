import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import appLogo from '../assets/images/app_logo.png';
import { googleSignIn, auth } from '../lib/firebase';
import { customEmailSignIn, customEmailSignUp } from '../lib/customAuth';
import { logGlobalActivity } from '../lib/db';

interface LoginViewProps {
  onLogin: (user: any) => void;
  onEnterGuest: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onEnterGuest }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);



  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (isRegistering && !username) {
      setError("Please enter a username.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let user;
      if (isRegistering) {
        user = await customEmailSignUp(email, password, username);
      } else {
        user = await customEmailSignIn(email, password);
      }
      if (user) {
        setTimeout(() => logGlobalActivity("login"), 1000);
        onLogin(user);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
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
        setTimeout(() => logGlobalActivity("login"), 1000);
        onLogin(result.user);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError(null);
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign-in popup was blocked by your browser. Please allow pop-ups for this site and try again.");
      } else if (err.code === 'auth/unauthorized-domain') {
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
        background: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)' 
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 dark:bg-black/25 border border-white/10 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-6 sm:mb-8">
             <div className="inline-flex items-center justify-center mb-3 sm:mb-4 rounded-2xl overflow-hidden shadow-lg border border-white/20 bg-white/10">
               <img src={appLogo} alt="AI Study Companion Logo" className="w-14 h-14 sm:w-16 sm:h-16 object-cover" />
             </div>
             <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome
             </h1>
             <p className="text-white/60 mt-1.5 sm:mt-2 text-sm">
                Focus on your studies with our intelligent assistant
             </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm backdrop-blur-md text-center mb-4">
              {error}
            </div>
          )}

          
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-4">
                         {isRegistering && (
             <input
               type="text"
               placeholder="Username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
             />
            )}
             <input type="email"
               placeholder="Email Address"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
             />
             <input
               type="password"
               placeholder="Password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
             />
             <button
               type="submit"
               disabled={loading}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
             >
               {loading ? 'Processing...' : (isRegistering ? 'Register Account' : 'Login with Email')}
             </button>
             <button
               type="button"
               onClick={() => setIsRegistering(!isRegistering)}
               className="text-sm text-white/60 hover:text-white transition-colors"
             >
               {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
             </button>
          </form>

          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-white/40 text-sm">or</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
             <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 sm:py-4 bg-white hover:bg-zinc-100 text-black border border-white/80 shadow-[0_4px_12px_rgba(255,255,255,0.05)] rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
