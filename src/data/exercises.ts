import type { ExerciseMaster } from '../types/pr';

export const EXERCISE_MASTER_DATA: ExerciseMaster[] = [
    // --- Squat ---
    { id: 'back_squat', name: 'Back Squat', aliases: ['BS', 'Squat'], category: 'powerlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'front_squat', name: 'Front Squat', aliases: ['FS'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'overhead_squat', name: 'Overhead Squat', aliases: ['OHS'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },

    // --- Deadlift ---
    { id: 'deadlift', name: 'Deadlift', aliases: ['DL'], category: 'powerlifting', defaultUnit: 'kg', measureType: 'weight' },

    // --- Press ---
    { id: 'bench_press', name: 'Bench Press', aliases: ['BP'], category: 'powerlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'shoulder_press', name: 'Shoulder Press', aliases: ['Press', 'Strict Press'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'push_press', name: 'Push Press', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'push_jerk', name: 'Push Jerk', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'split_jerk', name: 'Split Jerk', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },

    // --- Olympic Lifts (Clean) ---
    { id: 'clean_jerk', name: 'Clean & Jerk', aliases: ['C&J'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'clean', name: 'Clean', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'power_clean', name: 'Power Clean', aliases: ['PC'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'squat_clean', name: 'Squat Clean', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'hang_clean', name: 'Hang Clean', aliases: ['Hang Squat Clean'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'hang_power_clean', name: 'Hang Power Clean', aliases: ['HPC'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },

    // --- Olympic Lifts (Snatch) ---
    { id: 'snatch', name: 'Snatch', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'power_snatch', name: 'Power Snatch', aliases: ['PS'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'squat_snatch', name: 'Squat Snatch', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'hang_snatch', name: 'Hang Snatch', aliases: ['Hang Squat Snatch'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
    { id: 'hang_power_snatch', name: 'Hang Power Snatch', aliases: ['HPS'], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },

    // --- Cardio / Time Based ---
    { id: 'row_500m', name: 'Row 500m', aliases: [], category: 'monostructural', defaultUnit: 'sec', measureType: 'time' },
    { id: 'run_1km', name: 'Run 1km', aliases: [], category: 'monostructural', defaultUnit: 'sec', measureType: 'time' },
    { id: 'assault_bike_1km', name: 'Assault Bike 1km', aliases: [], category: 'monostructural', defaultUnit: 'sec', measureType: 'time' },
    { id: 'bike_time', name: 'Bike 1000m', aliases: ['Assault Bike'], category: 'monostructural', defaultUnit: 'sec', measureType: 'time' },

    // --- Other ---
    { id: 'thruster', name: 'Thruster', aliases: [], category: 'weightlifting', defaultUnit: 'kg', measureType: 'weight' },
];

// Define key exercises that should always appear in the dashboard suggestion list (Top 6 + backups)
// The user explicitly requested Top 6: Back Squat, Front Squat, Deadlift, Bench Press, Snatch, Clean & Jerk
export const SUGGESTED_EXERCISES = [
    'clean_jerk',
    'snatch',
    'back_squat',
    'front_squat',
    'overhead_squat',
    'deadlift',
    'bench_press',
    'shoulder_press',
    'power_clean',
    'power_snatch',
    'push_jerk',
    'split_jerk',
    'squat_clean',
    'squat_snatch',
    'thruster',
    'row_500m',
    'bike_time'
];
