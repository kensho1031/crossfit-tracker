
import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export interface Movement {
    id?: string;
    uid?: string; // If null, it's a system default
    name: string;
    category: 'Weightlifting' | 'Gymnastics' | 'Cardio' | 'Girl WOD' | 'Hero WOD' | 'Other';
    type: 'Weight' | 'Reps' | 'Time' | 'Other';
    isDefault?: boolean;
}

const COLLECTION_NAME = 'movements';

export const getMovements = async (uid: string): Promise<Movement[]> => {
    // Get system defaults
    const defaultsQuery = query(collection(db, COLLECTION_NAME), where('isDefault', '==', true));
    const defaultsSnapshot = await getDocs(defaultsQuery);
    const defaults = defaultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));

    // Get user custom movements
    const userQuery = query(collection(db, COLLECTION_NAME), where('uid', '==', uid));
    const userSnapshot = await getDocs(userQuery);
    const userMovements = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));

    // Merge and sort by name
    return [...defaults, ...userMovements].sort((a, b) => a.name.localeCompare(b.name));
};

export const addMovement = async (movement: Omit<Movement, 'id'>) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
        ...movement,
        createdAt: serverTimestamp()
    });
};

export const updateMovement = async (id: string, movement: Partial<Movement>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, { ...movement, updatedAt: serverTimestamp() });
};

export const deleteMovement = async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
};

// Seeding function (to be run once or via admin tool)
export const seedDefaultMovements = async () => {
    const defaults: Omit<Movement, 'id'>[] = [
        { name: 'Back Squat', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Front Squat', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Deadlift', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Bench Press', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Snatch', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Clean & Jerk', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Overhead Press', category: 'Weightlifting', type: 'Weight', isDefault: true },
        { name: 'Pull-ups', category: 'Gymnastics', type: 'Reps', isDefault: true },
        { name: 'Muscle-ups', category: 'Gymnastics', type: 'Reps', isDefault: true },
        { name: 'Handstand Push-ups', category: 'Gymnastics', type: 'Reps', isDefault: true },
        { name: 'Fran', category: 'Girl WOD', type: 'Time', isDefault: true },
        { name: 'Grace', category: 'Girl WOD', type: 'Time', isDefault: true },
        { name: 'Helen', category: 'Girl WOD', type: 'Time', isDefault: true },
        { name: 'Murph', category: 'Hero WOD', type: 'Time', isDefault: true },
        { name: 'DT', category: 'Hero WOD', type: 'Time', isDefault: true },
        { name: 'Run 5km', category: 'Cardio', type: 'Time', isDefault: true },
        { name: 'Row 2000m', category: 'Cardio', type: 'Time', isDefault: true },
    ];

    // Get existing defaults to avoid duplicates (Client-side filtering to avoid index requirements)
    // Get existing defaults to avoid duplicates (Client-side filtering to avoid index requirements)
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingNames = new Set(snapshot.docs.map(doc => doc.data().name));

    for (const mov of defaults) {
        if (!existingNames.has(mov.name)) {
            await addDoc(collection(db, COLLECTION_NAME), mov);
            console.log(`Added default: ${mov.name}`);
        }
    }
};
