export interface CalendarEntry {
    id?: string;
    uid: string;
    type: 'wod' | 'other';
    source: 'scan' | 'log';
    date: string; // YYYY-MM-DD
    raw_text: string; // memo or AI summary
    image_url: string | null;
    exercises: string[]; // List of exercise names
    categories: string[]; // List of categories (e.g., 'weightlifting', 'gymnastics')
    rpe?: number;
    condition?: string;
    createdAt: any;
    updatedAt: any;
}
