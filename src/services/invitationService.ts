import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Invitation } from '../types/invitation';
import type { UserRole } from '../types/user';

const INVITATION_COLLECTION = 'invitations';

/**
 * Create a new invitation (Admin only)
 */
export async function createInvitation(
    email: string,
    boxId: string,
    role: UserRole | 'visitor',
    invitedBy: string,
    visitorExpiresInDays?: number
): Promise<string> {
    // Check if there is already a pending invitation for this email
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('email', '==', email),
        where('status', '==', 'pending')
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error('This email already has a pending invitation.');
    }

    // Generate a simple token (in production, use a more secure method or just rely on email matching)
    // For this flow (Email Match), the token is less critical for auth, but good for direct links.
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Expires in 7 days by default
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation: Omit<Invitation, 'id'> = {
        email,
        boxId,
        role,
        token,
        status: 'pending',
        invitedBy,
        visitorExpiresInDays,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
    };

    const docRef = await addDoc(collection(db, INVITATION_COLLECTION), invitation);
    return docRef.id;
}

/**
 * Get all invitations for a specific BOX (Admin view)
 */
export async function getBoxInvitations(boxId: string): Promise<Invitation[]> {
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('boxId', '==', boxId)
    );
    const snapshot = await getDocs(q);

    // Sort logic handled in client or by index
    const invitations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Invitation));

    return invitations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Find a pending invitation by Email (Used during Login/SignUp)
 */
export async function findPendingInvitationByEmail(email: string): Promise<Invitation | null> {
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('email', '==', email),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Return the most recent one if multiple (though create prevents duplicates)
    const docData = snapshot.docs[0].data() as Invitation;
    return { ...docData, id: snapshot.docs[0].id };
}

/**
 * Accept invitation
 * This should be called when usage is confirmed (e.g. successful login)
 */
export async function acceptInvitation(invitationId: string, userId: string): Promise<void> {
    const invRef = doc(db, INVITATION_COLLECTION, invitationId);

    // 1. Mark invitation as used
    await updateDoc(invRef, {
        status: 'used'
    });

    // 2. We don't update user profile here directly generally, 
    // strictly speaking `syncUserProfile` or specific logic in AuthContext handles the user update
    // using the invitation data. 
    // BUT, for convenience, let's allow this function to do it if we pass the invitation object.
    // For now, simpler to jusrt mark used.
}
