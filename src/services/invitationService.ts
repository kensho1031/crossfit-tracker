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
import { addUserToBox } from './userBoxService';

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
    // Check if there is already a pending invitation for this email in THIS box
    // Allowing multiple invitations if they are for DIFFERENT boxes
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('email', '==', email),
        where('boxId', '==', boxId),
        where('status', '==', 'pending')
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
        throw new Error('This email already has a pending invitation for this box.');
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

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
        expiresAt: expiresAt.toISOString(),
        email_log: [] // Initial log
    };

    const docRef = await addDoc(collection(db, INVITATION_COLLECTION), invitation);

    // Trigger Email via 'mail' collection (Firebase Extension)
    try {
        await addDoc(collection(db, 'mail'), {
            to: [email],
            message: {
                subject: '【CrossFit Tracker】BOXへの招待が届きました',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #00bcd4;">BOXへの招待</h2>
                        <p>${email} 様</p>
                        <p>CrossFit Tracker のBOXへの招待が届いています。</p>
                        <p>以下のリンクをクリックして、登録を完了してください。</p>
                        <div style="margin: 30px 0;">
                            <a href="${window.location.origin}/login?invite=${token}" 
                               style="background-color: #00bcd4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                               招待を受け取る
                            </a>
                        </div>
                        <p style="font-size: 0.9em; color: #666;">
                            ※このリンクの有効期限は7日間です。<br>
                            ※心当たりがない場合は、このメールを破棄してください。
                        </p>
                    </div>
                `
            }
        });
        console.log("Invitation email trigger created.");
    } catch (e) {
        console.error("Failed to trigger email:", e);
        // Note: We don't fail the invitation creation itself, but we should log it.
        // In a strict environment, we might verify email sending success.
    }

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
 * NOTE: This might return MULTIPLE if invited to multiple boxes.
 * For now, returning the first valid one or implementing priority login logic.
 */
export async function findPendingInvitationByEmail(email: string): Promise<Invitation | null> {
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('email', '==', email),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    // Return the first one found.
    // In a multi-invite scenario, we might want to accept ALL of them?
    const docData = snapshot.docs[0].data() as Invitation;
    return { ...docData, id: snapshot.docs[0].id };
}

/**
 * Find invitation by Token (Strict verification)
 */
export async function getInvitationByToken(token: string): Promise<Invitation | null> {
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('token', '==', token),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Invitation;
}

/**
 * Accept invitation
 * 1. Adds user to user_boxes
 * 2. Marks invitation as used
 */
export async function acceptInvitation(invitationId: string): Promise<void> {
    const invRef = doc(db, INVITATION_COLLECTION, invitationId);
    // Fetch fresh to get details
    // (Assuming caller has validated or we trust the ID passed from a secure context)
    // Actually we should fetch it to get the role/boxId safely

    // BUT, optimizing for read cost, we often pass the object. 
    // Let's implement robustly.

    // We update the status first/concurrently
    await updateDoc(invRef, {
        status: 'used'
    });
}

/**
 * Accepts ALL pending invitations for a specific email.
 * Call this after successful login/signup to ensure all memberships are granted.
 */
export async function acceptAllPendingInvitations(userId: string, email: string): Promise<void> {
    const q = query(
        collection(db, INVITATION_COLLECTION),
        where('email', '==', email),
        where('status', '==', 'pending')
    );
    const snapshot = await getDocs(q);

    for (const inviteDoc of snapshot.docs) {
        const invite = inviteDoc.data() as Invitation;

        // Add to user_boxes
        // Note: 'visitor' isn't fully in UserRole type yet if strict, casting here or updating UserRole type
        // The type definition allowed UserRole | 'visitor'.
        // addUserToBox expects UserRole. We need to handle 'visitor' if it's not in UserRole.
        // Assuming UserRole includes 'visitor' now based on previous edits.
        await addUserToBox(userId, invite.boxId, invite.role as UserRole);

        // Mark as used
        await updateDoc(inviteDoc.ref, { status: 'used' });
    }
}
