const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
content = content.replace(
  `import { onAuthStateChanged } from "firebase/auth";`,
  `import { onAuthStateChanged } from "firebase/auth";\nimport { getCustomUser, customSignOut } from "./lib/customAuth";`
);

// Modify useEffect for auth
const newAuthEffect = `
  useEffect(() => {
    // Check for custom local user first
    const customUser = getCustomUser();
    if (customUser) {
      setUser(customUser);
      setIsGuestMode(false);
      loadProgressFromFirestore().then(storedProgress => {
        const photo = localStorage.getItem("ai_study_companion_photo_url") || (storedProgress && storedProgress.photoURL) || "";
        if (storedProgress) {
          setProgress(prev => ({
            ...prev,
            ...storedProgress,
            photoURL: photo || storedProgress.photoURL || prev.photoURL || ""
          }));
        } else {
          if (photo) {
            setProgress(prev => ({ ...prev, photoURL: photo }));
          }
        }
        setAuthInitialized(true);
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const isBanned = await checkIfBanned(currentUser.uid);
        if (isBanned) {
          await logout();
          alert("Your account has been permanently banned.");
          setUser(null);
          setAuthInitialized(true);
          return;
        }
      }
      setUser(currentUser);
      if (currentUser) {
        setIsGuestMode(false);
        const storedProgress = await loadProgressFromFirestore();
        const photo = localStorage.getItem("ai_study_companion_photo_url") || (storedProgress && storedProgress.photoURL) || currentUser.photoURL || "";
        if (storedProgress) {
          setProgress(prev => ({
            ...prev,
            ...storedProgress,
            photoURL: photo || storedProgress.photoURL || prev.photoURL || ""
          }));
        } else {
          if (photo) {
            setProgress(prev => ({ ...prev, photoURL: photo }));
          }
        }
      }
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);
`;

// Replace the old useEffect
content = content.replace(/useEffect\(\(\) => \{\n\s*const unsubscribe = onAuthStateChanged\(auth, async \(currentUser\) => \{[\s\S]*?return \(\) => unsubscribe\(\);\n\s*\}, \[\]\);/, newAuthEffect.trim());

fs.writeFileSync('src/App.tsx', content);
