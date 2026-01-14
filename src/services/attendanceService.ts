import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

export interface AttendanceRecord {
    userId: string;
    classId: string;
    checkedInAt: any;
    method: 'qr' | 'manual';
}

/**
 * Check in to a class.
 * If boxId is provided, stores under boxes/{boxId}/attendance
 * Otherwise uses legacy path attendance/
 */
export async function checkInToClass(classId: string, boxId?: string | null): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const attendanceId = `${classId}_${user.uid}`;

    let attendanceRef;
    if (boxId) {
        attendanceRef = doc(db, 'boxes', boxId, 'attendance', attendanceId);
    } else {
        // Legacy path
        attendanceRef = doc(db, 'attendance', attendanceId);
    }

    // Check if already checked in
    const docSnap = await getDoc(attendanceRef);
    if (docSnap.exists()) {
        console.log('Already checked in');
        return;
    }

    await setDoc(attendanceRef, {
        userId: user.uid,
        classId: classId,
        checkedInAt: serverTimestamp(),
        method: 'qr'
    });
}

/**
 * Check if user is checked in to a class.
 * If boxId is provided, checks boxes/{boxId}/attendance
 */
export async function isUserCheckedIn(classId: string, boxId?: string | null): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const attendanceId = `${classId}_${user.uid}`;

    let attendanceRef;
    if (boxId) {
        attendanceRef = doc(db, 'boxes', boxId, 'attendance', attendanceId);
    } else {
        // Legacy path
        attendanceRef = doc(db, 'attendance', attendanceId);
    }

    const docSnap = await getDoc(attendanceRef);
    return docSnap.exists();
}
