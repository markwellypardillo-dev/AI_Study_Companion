const fs = require('fs');

const code = `import { collection, query, where, getDocs, setDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const customEmailSignUp = async (email: string, password: string): Promise<any> => {
  const accountsRef = collection(db, "app_accounts");
  const q = query(accountsRef, where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const error: any = new Error("This email is already registered. Please log in instead.");
    error.code = 'auth/email-already-in-use';
    throw error;
  }
  
  // Try to find if this email already exists in the main 'users' collection from a previous Google Login
  const usersRef = collection(db, "users");
  const usersQ = query(usersRef, where("email", "==", email.toLowerCase()));
  const usersSnapshot = await getDocs(usersQ);
  
  let uid = "custom_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  // If we found their Google account data, sync the UID so they share the exact same history!
  if (!usersSnapshot.empty) {
    uid = usersSnapshot.docs[0].id;
  }
  
  // Create new custom user document
  await setDoc(doc(db, "app_accounts", uid), {
    uid,
    email: email.toLowerCase(),
    password,
    role: email === 'pmarkwelly@gmail.com' ? 'admin' : 'student',
    createdAt: new Date().toISOString()
  });
  
  const user = { uid, email: email.toLowerCase(), isCustom: true };
  localStorage.setItem('custom_user', JSON.stringify(user));
  return user;
};

export const customEmailSignIn = async (email: string, password: string): Promise<any> => {
  const accountsRef = collection(db, "app_accounts");
  const q = query(accountsRef, where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    const error: any = new Error("Invalid email or password.");
    error.code = 'auth/user-not-found';
    throw error;
  }
  
  const accountDoc = querySnapshot.docs[0];
  const accountData = accountDoc.data();
  
  if (accountData.password !== password) {
    const error: any = new Error("Invalid email or password.");
    error.code = 'auth/wrong-password';
    throw error;
  }
  
  let finalUid = accountDoc.id;

  // Let's force-sync their UID with their Google account if it exists, to restore history
  const usersRef = collection(db, "users");
  const usersQ = query(usersRef, where("email", "==", email.toLowerCase()));
  const usersSnapshot = await getDocs(usersQ);
  
  if (!usersSnapshot.empty) {
    const googleUid = usersSnapshot.docs[0].id;
    if (finalUid !== googleUid) {
      // Migrate their custom account to the Google UID so they perfectly sync
      finalUid = googleUid;
      await setDoc(doc(db, "app_accounts", googleUid), {
        ...accountData,
        uid: googleUid
      });
    }
  }
  
  const user = { uid: finalUid, email: accountData.email, isCustom: true };
  localStorage.setItem('custom_user', JSON.stringify(user));
  return user;
};

export const customSignOut = () => {
  localStorage.removeItem('custom_user');
};

export const getCustomUser = () => {
  const stored = localStorage.getItem('custom_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};
`;

fs.writeFileSync('src/lib/customAuth.ts', code);
