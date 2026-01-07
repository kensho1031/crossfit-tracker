

export interface ExerciseMaster {
    id: string; // e.g., 'back_squat'
    name: string; // 'Back Squat'
    aliases: string[]; // ['BS', 'BackSquat']
    category: 'weightlifting' | 'powerlifting' | 'gymnastics' | 'monostructural' | 'cardio' | 'other';
    defaultUnit: 'kg' | 'lb' | 'reps' | 'cal' | 'm' | 'sec' | 'min';
    measureType?: 'weight' | 'time' | 'distance' | 'reps';
}

export interface PR {
    id: string;
    uid: string;
    exerciseId: string;
    exerciseName: string; // Denormalized for easier display
    value: number;
    unit: string;
    date: string; // ISO string 'YYYY-MM-DD'
    source: 'manual' | 'wod_analysis';
    note?: string;
    wadeAnalysisId?: string; // Link to draftLog if applicable
    createdAt: any; // Timestamp
}
