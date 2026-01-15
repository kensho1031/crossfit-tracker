import {
    addDoc,
    collection,
    doc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    where,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { PR, ExerciseMaster } from '../types/pr';
import { EXERCISE_MASTER_DATA } from '../data/exercises';

export const PRService = {
    // --- Exercise Master ---

    // Initialize master data (run once or check on load)
    async initializeMasterData() {
        // This is a simplified approach. Ideally, check if exists, if not, batch create.
        const batch = writeBatch(db);
        for (const ex of EXERCISE_MASTER_DATA) {
            const ref = doc(db, 'exercise_master', ex.id);
            // using set with merge to update definition if changed
            batch.set(ref, ex, { merge: true });
        }
        await batch.commit();
    },

    async searchExercises(searchText: string): Promise<ExerciseMaster[]> {
        // Client-side filtering for simplicity given small dataset
        // In real app, might want to cache this list
        const lower = searchText.toLowerCase();
        return EXERCISE_MASTER_DATA.filter(ex =>
            ex.name.toLowerCase().includes(lower) ||
            ex.aliases.some(a => a.toLowerCase().includes(lower))
        );
    },

    getAllExercises(): ExerciseMaster[] {
        return EXERCISE_MASTER_DATA;
    },

    getExerciseById(id: string): ExerciseMaster | undefined {
        return EXERCISE_MASTER_DATA.find(ex => ex.id === id);
    },

    // --- PRs ---

    async addPR(pr: Omit<PR, 'id' | 'createdAt'>): Promise<string> {
        const collectionRef = collection(db, 'prs');
        const docRef = await addDoc(collectionRef, {
            ...pr,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async getHistory(uid: string, exerciseId: string, boxId?: string | null): Promise<PR[]> {
        const constraints: any[] = [
            where('uid', '==', uid),
            where('exerciseId', '==', exerciseId),
            orderBy('date', 'desc'),
            orderBy('createdAt', 'desc')
        ];

        if (boxId) {
            constraints.splice(2, 0, where('boxId', '==', boxId));
        }

        const q = query(collection(db, 'prs'), ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PR));
    },

    async getPersonalBest(uid: string, exerciseId: string, boxId?: string | null): Promise<PR | null> {
        const constraints: any[] = [
            where('uid', '==', uid),
            where('exerciseId', '==', exerciseId),
            orderBy('value', 'desc'),
            limit(1)
        ];

        if (boxId) {
            constraints.splice(2, 0, where('boxId', '==', boxId));
        }

        const q = query(collection(db, 'prs'), ...constraints);
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PR;
    },

    // Get personal bests for a list of exercises efficiently
    async getAllUserPRs(uid: string, boxId?: string | null): Promise<PR[]> {
        const constraints: any[] = [
            where('uid', '==', uid),
            orderBy('date', 'desc')
        ];

        if (boxId) {
            constraints.splice(1, 0, where('boxId', '==', boxId));
        }

        const q = query(collection(db, 'prs'), ...constraints);
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PR));
    }
};
