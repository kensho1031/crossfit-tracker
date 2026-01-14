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

export async function checkInToClass(classId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const attendanceId = `${classId}_${user.uid}`;
    const attendanceRef = doc(db, 'attendance', attendanceId);

    // Check if already checked in to avoid overwrite (though setDoc with merge is safe too)
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

export async function isUserCheckedIn(classId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const attendanceId = `${classId}_${user.uid}`;
    const docSnap = await getDoc(doc(db, 'attendance', attendanceId));

    return docSnap.exists();
}
