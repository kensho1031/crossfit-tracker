export interface UserStats {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;

    // Level System (Monthly)
    level: number;
    monthlyWorkouts: number;
    lastWorkoutDate: string | null;
    currentMonth: string; // "YYYY-MM" to track resets

    // Stats (For Avatar Evolution)
    maxWeights: {
        sq: number; // Squat (kg)
        bp: number; // Bench Press (kg)
        dl: number; // Deadlift (kg)
        wl: number; // Weightlifting Total (kg)
    };

    // Body Scale
    bodyWeight: number | null; // kg
    bodyFatPercentage: number | null;

    createdAt: string;
}

export const INITIAL_STATS: Omit<UserStats, 'uid' | 'displayName' | 'email' | 'photoURL' | 'createdAt'> = {
    level: 1,
    monthlyWorkouts: 0,
    lastWorkoutDate: null,
    currentMonth: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7), // "YYYY-MM"
    maxWeights: {
        sq: 0,
        bp: 0,
        dl: 0,
        wl: 0
    },
    bodyWeight: null,
    bodyFatPercentage: null,
};
