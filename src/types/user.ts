export type UserRole = 'admin' | 'coach' | 'member' | 'visitor';

export interface UserStats {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    boxId: string | null; // null means "Personal Mode" (no box)
    visitorExpiresAt?: string | null; // ISO date string for visitors
    createdAt: string;
    currentMonth: string;

    // Physical Stats
    bodyWeight: number;
    maxWeights: {
        sq: number; // Squat
        bp: number; // Bench Press
        dl: number; // Deadlift
        wl: number; // Weightlifting (C&J / Snatch avg)
    };
}

export const INITIAL_STATS: Omit<UserStats, 'uid' | 'email' | 'displayName' | 'createdAt' | 'currentMonth'> = {
    role: 'member',
    boxId: null,
    visitorExpiresAt: null,
    bodyWeight: 0,
    maxWeights: {
        sq: 0,
        bp: 0,
        dl: 0,
        wl: 0
    }
};

export interface UserProfile extends UserStats { } // Alias for backward compatibility if needed
