const fs = require('fs');

// 1. Update LoginView.tsx
let loginContent = fs.readFileSync('src/components/LoginView.tsx', 'utf8');

if (!loginContent.includes('const [username, setUsername]')) {
  loginContent = loginContent.replace(
    /const \[email, setEmail\] = useState\(''\);/,
    `const [email, setEmail] = useState('');\n  const [username, setUsername] = useState('');`
  );

  loginContent = loginContent.replace(
    /if \(!email \|\| !password\) \{/,
    `if (!email || !password) {\n      setError("Please enter both email and password.");\n      return;\n    }\n    if (isRegistering && !username) {\n      setError("Please enter a username.");\n      return;\n    }\n    // Skip redundant check`
  );

  loginContent = loginContent.replace(
    /user = await customEmailSignUp\(email, password\);/,
    `user = await customEmailSignUp(email, password, username);`
  );

  const usernameInput = `            {isRegistering && (
             <input
               type="text"
               placeholder="Username"
               value={username}
               onChange={(e) => setUsername(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-colors"
             />
            )}`;
  
  loginContent = loginContent.replace(
    /<input\s*type="email"/,
    `${usernameInput}\n             <input type="email"`
  );

  fs.writeFileSync('src/components/LoginView.tsx', loginContent);
}

// 2. Update customAuth.ts
let authContent = fs.readFileSync('src/lib/customAuth.ts', 'utf8');

if (!authContent.includes('customEmailSignUp = async (email: string, password: string, username?: string)')) {
  authContent = authContent.replace(
    /customEmailSignUp = async \(email: string, password: string\): Promise<any> => \{/,
    `customEmailSignUp = async (email: string, password: string, username?: string): Promise<any> => {`
  );

  authContent = authContent.replace(
    /email: email\.toLowerCase\(\),\n\s*password,\n\s*role:/,
    `email: email.toLowerCase(),
    password,
    username: username || email.split('@')[0],
    role:`
  );
  
  authContent = authContent.replace(
    /const user = \{ uid, email: email\.toLowerCase\(\), isCustom: true \};/,
    `const user = { uid, email: email.toLowerCase(), username: username || email.split('@')[0], isCustom: true };`
  );

  // When finding an existing google account, also sync the username to the users collection if needed, 
  // but it's okay, we can just save it to app_accounts.
  
  fs.writeFileSync('src/lib/customAuth.ts', authContent);
}
