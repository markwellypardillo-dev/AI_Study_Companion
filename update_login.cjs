const fs = require('fs');

let content = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

const importsToAdd = `import { emailPasswordSignIn, emailPasswordSignUp } from '../lib/firebase';\n`;
if (!content.includes('emailPasswordSignIn')) {
    content = content.replace(`import { googleSignIn, auth } from '../lib/firebase';`, `import { googleSignIn, auth, emailPasswordSignIn, emailPasswordSignUp } from '../lib/firebase';`);
}

const stateToAdd = `
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
`;
content = content.replace(`  const [error, setError] = useState<string | null>(null);`, `  const [error, setError] = useState<string | null>(null);${stateToAdd}`);

const methodsToAdd = `
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let user;
      if (isRegistering) {
        user = await emailPasswordSignUp(email, password);
      } else {
        user = await emailPasswordSignIn(email, password);
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
`;
content = content.replace(`  const handleGoogleLogin = async () => {`, `${methodsToAdd}\n  const handleGoogleLogin = async () => {`);

const formToAdd = `
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-4">
             <input
               type="email"
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
`;

content = content.replace(`<div className="flex flex-col gap-3 sm:gap-4">`, `${formToAdd}\n          <div className="flex flex-col gap-3 sm:gap-4">`);

fs.writeFileSync('src/components/LoginView.tsx', content);
