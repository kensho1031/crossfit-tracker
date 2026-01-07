export interface Exercise {
    id: string;
    name: string;
    reps?: string;
    sets?: string;
    requiresWeight: boolean;
    suggestedWeight?: string | null;
    category?: 'warmup' | 'strength' | 'wod';
}

export interface AnalyzedWOD {
    sections: {
        warmup: Exercise[];
        strength: Exercise[];
        wod: Exercise[];
    };
    commonWeight?: string | null;
    wodType?: string | null;
    confidence?: number;
    manualModeRecommended?: boolean;
}

export interface DraftLog {
    id: string;
    uid: string;
    imageUrl: string;
    analyzedData: AnalyzedWOD;
    userInputs: {
        [exerciseId: string]: {
            weight?: string;
            notes?: string;
        };
    };
    status: 'draft' | 'completed';
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}
