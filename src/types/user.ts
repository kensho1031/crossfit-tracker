export type UserRole = 'admin' | 'coach' | 'member' | 'visitor';

// Multi-Box Membership Interface
export interface UserBoxMembership {
    id?: string; // composite key: {userId}_{boxId}
    userId: string;
    boxId: string;
    role: UserRole; // Role within this specific box
    joinedAt: string;
}

export interface UserStats {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;

    // Legacy mapping (will be deprecated or computed from currentBox)
    role?: UserRole;
    boxId?: string | null;

    // New Fields
    currentBoxId?: string | null; // Last accessed box

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
    bodyWeight: 0,
    maxWeights: {
        sq: 0,
        bp: 0,
        dl: 0,
        wl: 0
    }
};

export interface UserProfile extends UserStats { } // Alias for backward compatibility if needed
