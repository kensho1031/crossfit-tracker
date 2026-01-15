import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Box } from '../types/box';

const db = getFirestore();

/**
 * Fetches all boxes (for Super Admin)
 */
export async function getAllBoxes(): Promise<Box[]> {
    const boxesRef = collection(db, 'boxes');
    const snapshot = await getDocs(boxesRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Box));
}

/**
 * Fetches a single box by ID
 */
export async function getBoxById(boxId: string): Promise<Box | null> {
    const boxRef = doc(db, 'boxes', boxId);
    const snapshot = await getDoc(boxRef);

    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Box;
    }
    return null;
}

/**
 * Creates a new BOX
 */
export async function createBox(name: string, ownerUid: string, address?: string): Promise<string> {
    const boxesRef = collection(db, 'boxes');
    const newBoxRef = doc(boxesRef);

    const boxData = {
        name,
        ownerUid,
        address: address || '',
        createdAt: serverTimestamp()
    };

    await setDoc(newBoxRef, boxData);
    return newBoxRef.id;
}

/**
 * Deletes a BOX
 */
export async function deleteBox(boxId: string): Promise<void> {
    const boxRef = doc(db, 'boxes', boxId);
    await deleteDoc(boxRef);
}
