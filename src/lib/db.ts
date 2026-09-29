import { getCustomUser } from './customAuth';
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, deleteDoc, serverTimestamp, getCountFromServer } from "firebase/firestore";
import { UserProgress } from "../types";

export const subscribeToMaintenanceMode = (setMaintenance: (isMaintenance: boolean) => void) => {
  const ref = doc(db, "config/system");
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        setMaintenance(snap.data().maintenanceMode === true);
      } else {
        setMaintenance(false);
      }
    },
    (error) => {
      console.warn("Firestore maintenance listener info (operating in offline cache mode):", error.message);
    }
  );
};

export const setMaintenanceMode = async (enabled: boolean) => {
  try {
    await setDoc(doc(db, "config/system"), { maintenanceMode: enabled }, { merge: true });
  } catch (error) {
    console.error("Failed to set maintenance mode", error);
  }
};

export const fetchAllPublicGuidesForModeration = async () => {
  // To avoid needing a collectionGroup index, we'll fetch users and then their guides.
  // Alternatively, since we can't do collectionGroup without an index, and creating an index takes time, 
  // we can just fetch all users and their studyGuides.
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const allGuides: any[] = [];
    for (const userDoc of usersSnap.docs) {
      const guidesSnap = await getDocs(collection(db, `users/${userDoc.id}/studyGuides`));
      guidesSnap.forEach(g => {
        allGuides.push({ id: g.id, userId: userDoc.id, ...g.data() });
      });
    }
    // Sort descending by created at
    allGuides.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
    return allGuides;
  } catch(error) {
    console.error("Failed to fetch all guides", error);
    return [];
  }
};

export const deleteUserGuide = async (userId: string, guideId: string) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/studyGuides/${guideId}`));
  } catch(error) {
    console.error("Failed to delete guide", error);
  }
};

export const banUser = async (userId: string) => {
  try {
    await setDoc(doc(db, "banned_users", userId), { bannedAt: serverTimestamp() });
  } catch (error) {
    console.error("Failed to ban user:", error);
  }
};

export const unbanUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "banned_users", userId));
  } catch (error) {
    console.error("Failed to unban user:", error);
  }
};

export const checkIfBanned = async (userId: string) => {
  try {
    const snap = await getDoc(doc(db, "banned_users", userId));
    return snap.exists();
  } catch (error) {
    console.error("Failed to check if user is banned:", error);
    return false;
  }
};

export const getBannedUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "banned_users"));
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Failed to fetch banned users:", error);
    return [];
  }
};

export const updateUserProgressRemote = async (userId: string, updates: Partial<UserProgress>) => {
  try {
    await setDoc(doc(db, "users", userId), updates, { merge: true });
  } catch (error) {
    console.error("Failed to update user progress remotely:", error);
  }
};

export const logGlobalActivity = async (action: string, metadata: any = {}) => {
  let userId = "guest";
  let email = "Guest User";
  let username = "Guest User";
  
  const currentUser = auth.currentUser || getCustomUser();
  if (currentUser) {
    userId = currentUser.uid;
    email = currentUser.email || "";
    username = currentUser.username || currentUser.displayName || currentUser.email?.split('@')[0] || "";
  } else if (!metadata.isGuest) {
    // If not authenticated and not explicitly a guest action, we might skip, but let's allow explicit guests.
    if (action !== "login" && action !== "guest_login") {
      // return; 
    }
  }

  if (metadata.isGuest) {
    userId = metadata.guestId || "guest";
    email = metadata.guestName || "Guest User";
    username = metadata.guestName || "Guest User";
  }

  try {
    const actRef = doc(collection(db, "activities"));
    await setDoc(actRef, {
      userId,
      email,
      username,
      action,
      metadata,
      timestamp: serverTimestamp()
    });
  } catch(e) {
    console.error("Failed to log global activity:", e);
  }
};

export const logGuestLogin = async (guestName: string) => {
  try {
    const actRef = doc(collection(db, "guests"));
    await setDoc(actRef, {
      name: guestName,
      timestamp: serverTimestamp()
    });
  } catch(e) {
    console.error("Failed to log guest login:", e);
  }
};

export const getGlobalAnalytics = async () => {
  try {
    // Total users and their data
    const usersSnap = await getDocs(collection(db, "users"));
    const totalUsers = usersSnap.size;
    const registeredUsersList = usersSnap.docs.map(doc => doc.data());

    // Guests
    const guestsSnap = await getDocs(collection(db, "guests"));
    const totalGuests = guestsSnap.size;
    const guestsList = guestsSnap.docs.map(doc => doc.data());

    // Total documents received
    const activitiesRef = collection(db, "activities");
    const docsQ = query(activitiesRef, where("action", "==", "generate_guide"));
    const docsSnap = await getCountFromServer(docsQ);
    const totalDocuments = docsSnap.data().count;

    return { totalUsers, totalDocuments, registeredUsersList, totalGuests, guestsList };
  } catch (error) {
    console.error("Failed to fetch global analytics:", error);
    return { totalUsers: 0, totalDocuments: 0, registeredUsersList: [], totalGuests: 0, guestsList: [] };
  }
};

export const subscribeToGlobalActivities = (setActivities: (acts: any[]) => void, limitCount = 50) => {
  // We can't order by timestamp without an index, so we might just fetch and sort in memory if the collection is small,
  // but let's query all or recent, actually without orderBy it might return in any order. Let's just fetch all and sort in memory for now (MVP).
  const q = collection(db, "activities");
  return onSnapshot(
    q,
    (snapshot) => {
      const activities: any[] = [];
      snapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      // Sort descending by timestamp
      activities.sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA;
      });
      setActivities(activities.slice(0, limitCount));
    },
    (error) => {
      console.warn("Firestore activities listener info (operating in offline cache mode):", error.message);
    }
  );
};

export const saveProgressToFirestore = async (progress: UserProgress) => {
  const currentUser = auth.currentUser || getCustomUser();
  if (!currentUser) return;
  const userId = currentUser.uid;
  const userRef = doc(db, "users", userId);
  try {
    // Only save the non-collection properties
    const data = {
      uid: userId,
      email: currentUser.email || "",
      username: currentUser.username || currentUser.displayName || currentUser.email?.split('@')[0] || "",
      level: progress.level || 1,
      xp: progress.xp || 0,
      xpToNextLevel: progress.xpToNextLevel || 100,
      totalFocusSeconds: progress.totalFocusSeconds || 0,
      dailyStreak: progress.dailyStreak || 0,
      lastActiveDate: progress.lastActiveDate || "",
      masteredTermsCount: progress.masteredTermsCount || 0,
      completedStudiesCount: progress.completedStudiesCount || 0,
      photoURL: progress.photoURL || "",
      unlockedAchievements: progress.unlockedAchievements || [],
      quizHistory: progress.quizHistory || [],
    };
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
};

export const loadProgressFromFirestore = async (): Promise<Partial<UserProgress> | null> => {
  const currentUser = auth.currentUser || getCustomUser();
  if (!currentUser) return null;
  const userId = currentUser.uid;
  const userRef = doc(db, "users", userId);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as Partial<UserProgress>;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
};

export const syncJournalEntries = (setEntries: (entries: any[]) => void) => {
  const currentUser = auth.currentUser || getCustomUser();
  if (!currentUser) return () => {};
  const userId = currentUser.uid;
  const q = collection(db, `users/${userId}/journalEntries`);
  return onSnapshot(q, (snapshot) => {
    const entries: any[] = [];
    snapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    // Sort by date descending
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(entries);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `users/${userId}/journalEntries`);
  });
};

export const addJournalEntry = async (entry: any) => {
  const currentUser = auth.currentUser || getCustomUser();
  if (!currentUser) return;
  const userId = currentUser.uid;
  const ref = doc(db, `users/${userId}/journalEntries`, entry.id);
  try {
    await setDoc(ref, {
      ...entry,
      userId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/journalEntries/${entry.id}`);
  }
};

export const deleteJournalEntry = async (id: string) => {
  const currentUser = auth.currentUser || getCustomUser();
  if (!currentUser) return;
  const userId = currentUser.uid;
  const ref = doc(db, `users/${userId}/journalEntries`, id);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/journalEntries/${id}`);
  }
};
