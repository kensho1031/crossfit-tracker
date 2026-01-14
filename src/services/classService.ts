import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import type { DailyClass } from '../types/class';

const db = getFirestore();

/**
 * Saves or updates a DailyClass document.
 * ID should be the date string YYYY-MM-DD.
 */
/**
 * Saves or updates a DailyClass document.
 * ID should be the date string YYYY-MM-DD.
 */
export async function saveDailyClass(dailyClass: DailyClass, boxId?: string | null): Promise<void> {
    let docRef;

    if (boxId) {
        docRef = doc(db, 'boxes', boxId, 'classes', dailyClass.id);
    } else {
        // Legacy or Fallback (maybe restricted in rules later)
        docRef = doc(db, 'classes', dailyClass.id);
    }

    const dataToSave = {
        ...dailyClass,
        updatedAt: serverTimestamp(),
        boxId: boxId || null // redundancy but useful
    };

    // Use setDoc with merge: true to update existing or create new
    await setDoc(docRef, dataToSave, { merge: true });
}

/**
 * Fetches a DailyClass by ID (YYYY-MM-DD).
 * Returns null if not found.
 */
export async function getDailyClass(dateId: string, boxId?: string | null): Promise<DailyClass | null> {
    let docRef;

    if (boxId) {
        docRef = doc(db, 'boxes', boxId, 'classes', dateId);
    } else {
        // Legacy fallback
        docRef = doc(db, 'classes', dateId);
    }

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return data as DailyClass;
    }

    // If we looked in box and didn't find it, should we look in legacy?
    // Maybe not, strict separation is better.
    // However, for data migration period, maybe check root if not found in box?
    // User requested "Absolute isolation": "他BOXのデータは絶対に参照できないようにする"
    // So NO fallback if boxId is provided.

    return null;
}
