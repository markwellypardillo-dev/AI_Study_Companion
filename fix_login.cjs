const fs = require('fs');
let loginContent = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

// replace the entire handleEmailAuth block
loginContent = loginContent.replace(
  /const handleEmailAuth = async \(e: React\.FormEvent\) => \{[\s\S]*?const handleGoogleLogin = async \(\) => \{/,
  `const handleEmailAuth = async (e: React.FormEvent) => {
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

  const handleGoogleLogin = async () => {`
);

fs.writeFileSync('src/components/LoginView.tsx', loginContent);
