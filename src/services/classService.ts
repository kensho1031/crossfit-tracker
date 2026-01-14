import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { DailyClass } from '../types/class';

const db = getFirestore();

/**
 * Saves or updates a DailyClass document.
 * ID should be the date string YYYY-MM-DD.
 */
export async function saveDailyClass(dailyClass: DailyClass): Promise<void> {
    const docRef = doc(db, 'classes', dailyClass.id);

    const dataToSave = {
        ...dailyClass,
        updatedAt: serverTimestamp(),
        // If creating new, ensure createdAt is set (handled by merge? no, explicit check better or just overwrite)
    };

    // Use setDoc with merge: true to update existing or create new
    await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Fetches a DailyClass by ID (YYYY-MM-DD).
 * Returns null if not found.
 */
export async function getDailyClass(dateId: string): Promise<DailyClass | null> {
    const docRef = doc(db, 'classes', dateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        // Convert Timestamps to dates/strings if needed, but for now just pass through
        // We might need to serialize Timestamps for non-serializable checks if using Redux etc, but here is fine.
        return data as DailyClass;
    }
    return null;
}
