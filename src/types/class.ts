import type { Timestamp } from 'firebase/firestore';

export type SectionType = 'warmup' | 'skill' | 'strength' | 'wod' | 'extracredit' | 'mobility' | 'other';

export interface ClassSection {
    id: string; // Unique ID for keying/rendering
    type: SectionType;
    title?: string;
    content: string; // The raw text or summarized list
    note?: string; // Coach's private notes

    // New Fields for Structured Data
    scoreType?: ScoreType;
    sets?: number; // For Strength or multi-part WODs
    category?: 'custom' | 'girls' | 'hero' | 'open' | 'benchmark';
    wodName?: string; // e.g. "Murph"
}

export interface DailyClass {
    id: string;
    date: string; // YYYY-MM-DD
    title?: string; // e.g. "Murph" or "Heavy Day"

    // New Dynamic Structure
    sections: ClassSection[];

    // Deprecated (Keep for backward compatibility type checking if needed, but logic will migrate)
    warmup?: ClassSection;
    strength?: ClassSection;
    wod?: ClassSection;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Result / Score Types
export type ScoreType = 'time' | 'rounds_reps' | 'reps' | 'weight' | 'points' | 'none';

export interface ClassResult {
    id: string;
    classId: string;
    userId: string;

    // Strength Result
    strengthResult?: {
        weight: string;
        notes?: string;
    };

    // WOD Result
    wodResult?: {
        type: ScoreType;
        score: string; // "12:30", "150 reps", "5 rounds + 10", "100kg"
        rx: boolean; // true = Rx, false = Scaled
        notes?: string;
    };

    createdAt: Timestamp;
}
