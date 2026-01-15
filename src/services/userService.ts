import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { UserProfile } from '../types/user';
import { INITIAL_STATS } from '../types/user';
import { addUserToBox, removeUserFromBox as removeUserFromBoxService } from './userBoxService';

const db = getFirestore();
const auth = getAuth();

/**
 * Ensures a user document exists in Firestore.
 */
export async function syncUserProfile(): Promise<UserProfile | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
    } else {
        const newProfile: UserProfile = {
            ...INITIAL_STATS,
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Member',
            createdAt: new Date().toISOString(),
            currentMonth: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7)
        };
        await setDoc(userRef, newProfile);
        return newProfile;
    }
}

/**
 * Updates a user's role and box assignment (using user_boxes).
 */
export async function updateUserBoxAndRole(
    userId: string,
    boxId: string | null,
    role: 'admin' | 'coach' | 'member' | 'visitor'
): Promise<void> {
    if (!boxId) {
        // Technically "Removing from box" if boxId is null, though interface implies update.
        // If boxId is null, strictly speaking usage should be removeUserFromBox.
        // But for backward compat, let's assume it means remove from context?
        // Actually, let's throw or handle removal if user intended to clear box.
        // But in multi-box, clearing one box doesn't mean clearing all.
        // This function signature is slightly legacy.
        // Let's assume if boxId is provided, we ADD/UPDATE that box membership.
        return;
    }

    // Use userBoxService to manage membership
    await addUserToBox(userId, boxId, role);

    // Legacy support: We might NOT want to update the root user.role/boxId anymore, but skipping for now.
}

/**
 * Searches users by email
 */
export async function searchUsers(searchTerm: string): Promise<any[]> {
    const usersRef = collection(db, 'users');
    const emailQuery = query(usersRef, where('email', '>=', searchTerm), where('email', '<=', searchTerm + '\uf8ff'));
    const emailSnapshot = await getDocs(emailQuery);

    return emailSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

/**
 * Gets all users in a specific BOX using user_boxes collection
 */
export async function getUsersByBox(boxId: string): Promise<any[]> {
    // 1. Get memberships for this box
    const userBoxesRef = collection(db, 'user_boxes');
    const q = query(userBoxesRef, where('boxId', '==', boxId));
    const membershipSnap = await getDocs(q);

    if (membershipSnap.empty) return [];

    const memberships = membershipSnap.docs.map(d => d.data());
    const userIds = memberships.map(m => m.userId);

    // 2. Fetch user profiles (Firestore "in" query updates limits to 30 usually, so batch if large)
    // For now, simple implementation using Promise.all or chunks.
    // "in" query only supports up to 30 items.

    const users: any[] = [];

    // Fetching individually for simplicity and to avoid limit issues for now (caching helps).
    // Optimization: Use batches if performance hit.

    await Promise.all(userIds.map(async (uid) => {
        const uDoc = await getDoc(doc(db, 'users', uid));
        if (uDoc.exists()) {
            const uData = uDoc.data();
            const membership = memberships.find(m => m.userId === uid);
            users.push({
                ...uData,
                id: uid,
                role: membership?.role // Override global role with box role for display
            });
        }
    }));

    return users;
}

/**
 * Removes a user from a BOX
 */
export async function removeUserFromBox(userId: string, boxId?: string): Promise<void> {
    // In new system, we MUST know which box to remove from.
    // If boxId is not provided (legacy call?), we might fail or need global context.
    // Assuming the caller now passes boxId or we can't safe-delete.
    if (!boxId) throw new Error("BoxID required to remove user");

    await removeUserFromBoxService(userId, boxId);
}
