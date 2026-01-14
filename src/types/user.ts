export type UserRole = 'admin' | 'coach' | 'member';

export interface UserStats {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
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
    bodyWeight: 0,
    maxWeights: {
        sq: 0,
        bp: 0,
        dl: 0,
        wl: 0
    }
};

export interface UserProfile extends UserStats { } // Alias for backward compatibility if needed
