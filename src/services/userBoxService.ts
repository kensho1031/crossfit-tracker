import { getFirestore, collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { UserBoxMembership, UserRole } from '../types/user';

const db = getFirestore();

/**
 * Gets all boxes a user belongs to.
 */
export async function getUserMemberships(userId: string): Promise<UserBoxMembership[]> {
    const membershipsRef = collection(db, 'user_boxes');
    const q = query(membershipsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data() as UserBoxMembership);
}

/**
 * Adds a user to a box with a specific role.
 * ID structure: {userId}_{boxId}
 */
export async function addUserToBox(userId: string, boxId: string, role: UserRole = 'member'): Promise<void> {
    const membershipId = `${userId}_${boxId}`;
    const membershipRef = doc(db, 'user_boxes', membershipId);

    const membershipData: UserBoxMembership = {
        id: membershipId,
        userId,
        boxId,
        role,
        joinedAt: new Date().toISOString()
    };

    await setDoc(membershipRef, membershipData);
}

/**
 * Removes a user from a box.
 */
export async function removeUserFromBox(userId: string, boxId: string): Promise<void> {
    const membershipId = `${userId}_${boxId}`;
    const membershipRef = doc(db, 'user_boxes', membershipId);
    await deleteDoc(membershipRef);
}

/**
 * Updates a user's role within a specific box.
 */
export async function updateUserBoxRole(userId: string, boxId: string, newRole: UserRole): Promise<void> {
    const membershipId = `${userId}_${boxId}`;
    const membershipRef = doc(db, 'user_boxes', membershipId);

    // Ensure existence before update to prevent orphaned records (optional safeguard)
    const snapshot = await getDoc(membershipRef);
    if (snapshot.exists()) {
        await setDoc(membershipRef, { role: newRole }, { merge: true });
    }
}
