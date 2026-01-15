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

/**
 * Save a score to both class leaderboard and user history.
 * If boxId is provided, stores under boxes/{boxId}/classes/{classId}/scores
 * Otherwise uses legacy path daily_classes/{classId}/scores
 */
export const saveScore = async (data: ScoreData, boxId?: string | null) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Must be logged in to save score");

    const timestamp = serverTimestamp();

    // 1. Save to Class Leaderboard
    let classScoreRef;
    if (boxId) {
        classScoreRef = doc(db, 'boxes', boxId, 'classes', data.classId, 'scores', user.uid);
    } else {
        // Legacy path
        classScoreRef = doc(db, 'daily_classes', data.classId, 'scores', user.uid);
    }

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

    // 3. Save to Calendar Entries (for Monthly Calendar Integration)
    // ID: wod-{classId}-{userId}
    const calendarRef = doc(db, 'calendar_entries', `wod-${data.classId}-${user.uid}`);
    await setDoc(calendarRef, {
        uid: user.uid,
        date: new Date().toISOString().split('T')[0], // or use class date if available, but usually today
        type: 'wod',
        title: data.title || data.wodName || 'WOD',
        raw_text: `${data.wodName || 'WOD'}: ${data.scoreValue} ${data.isRx ? '(Rx)' : ''}\n${data.note || ''}`,
        photoUrl: null,
        boxId: boxId || null,
        createdAt: timestamp,
        updatedAt: timestamp
    }, { merge: true });

    return scoreDoc;
};

/**
 * Get all scores for a specific class.
 * If boxId is provided, fetches from boxes/{boxId}/classes/{classId}/scores
 */
export const getScores = async (classId: string, boxId?: string | null) => {
    let scoresRef;
    if (boxId) {
        scoresRef = collection(db, 'boxes', boxId, 'classes', classId, 'scores');
    } else {
        // Legacy path
        scoresRef = collection(db, 'daily_classes', classId, 'scores');
    }

    const q = query(scoresRef);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as any));
};

/**
 * Get user's history for a specific WOD name.
 * User history is stored per-user, not per-box.
 */
export const getUserHistory = async (userId: string, wodName: string) => {
    if (!userId || !wodName) return [];

    const historyRef = collection(db, 'users', userId, 'history');

    const q = query(
        historyRef,
        where('wodName', '==', wodName),
        orderBy('timestamp', 'desc'),
        limit(5)
    );

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
