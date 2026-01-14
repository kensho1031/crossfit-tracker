import {
    collection,
    doc,
    setDoc,
    getDocs,
    query,
    serverTimestamp,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { ScoreType } from '../types/class';

export interface ScoreData {
    classId: string;
    scoreType: ScoreType;
    scoreValue: string;
    isRx: boolean;
    note?: string;
    title?: string; // e.g. "Murph", "Back Squat"
    wodName?: string; // standardized name for querying
}

export const saveScore = async (data: ScoreData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in to save score");

    const timestamp = serverTimestamp();

    // 1. Save to Class Leaderboard
    // Path: daily_classes/{classId}/scores/{userId}
    const classScoreRef = doc(db, 'daily_classes', data.classId, 'scores', user.uid);
    const scoreDoc = {
        userId: user.uid,
        userName: user.displayName || 'Unknown Athlete',
        result: data.scoreValue,
        scoreType: data.scoreType,
        isRx: data.isRx,
        comment: data.note || '',
        createdAt: timestamp,
        updatedAt: timestamp
    };
    await setDoc(classScoreRef, scoreDoc, { merge: true });

    // 2. Save to User History (if searchable title/wodName is provided)
    // Path: users/{userId}/history/{autoId}
    if (data.title || data.wodName) {
        // ID: `${classId}_${wodName || title}` (sanitized)
        const safeName = (data.wodName || data.title || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
        const historyId = `${data.classId}_${safeName}`;
        const userHistoryRef = doc(db, 'users', user.uid, 'history', historyId);

        await setDoc(userHistoryRef, {
            classId: data.classId,
            wodName: data.wodName || null,
            title: data.title || null,
            result: data.scoreValue,
            scoreType: data.scoreType,
            isRx: data.isRx,
            note: data.note || '',
            date: new Date().toISOString().split('T')[0],
            timestamp: timestamp
        }, { merge: true });
    }

    return scoreDoc;
};

export const getScores = async (classId: string) => {
    // Path: daily_classes/{date}/scores
    const scoresRef = collection(db, 'daily_classes', classId, 'scores');
    const q = query(scoresRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as any));
};

export const getUserHistory = async (userId: string, wodName: string) => {
    if (!userId || !wodName) return [];

    const historyRef = collection(db, 'users', userId, 'history');

    const q = query(
        historyRef,
        where('wodName', '==', wodName),
        orderBy('timestamp', 'desc'),
        limit(5)
    );
    // Note: Creating index might be required for where+orderBy

    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as any));
    } catch (e) {
        console.warn("History query failed (likely index missing):", e);
        return [];
    }
};
