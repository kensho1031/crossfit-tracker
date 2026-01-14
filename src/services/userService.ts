import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { UserProfile, UserRole } from '../types/user';
import { INITIAL_STATS } from '../types/user';

const db = getFirestore();
const auth = getAuth();

/**
 * Ensures a user document exists in Firestore.
 * Call this on login.
 */
export async function syncUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        // Create new user profile with default 'member' role
        const newProfile: UserProfile = {
            ...INITIAL_STATS,
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Member',
            role: 'member',
            createdAt: new Date().toISOString(),
            currentMonth: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7)
        };
        await setDoc(userRef, newProfile);
        return newProfile;
    }
}

/**
 * Updates the user's role.
 * Only accessible if security rules allow (or for dev/admin).
 */
export async function setUserRole(role: UserRole): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { role });
}

/**
 * Gets the current user's role.
 */
export async function getCurrentUserRole(): Promise<UserRole> {
    const user = auth.currentUser;
    if (!user) return 'member';

    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return (docSnap.data() as UserProfile).role;
    }
    return 'member';
}
