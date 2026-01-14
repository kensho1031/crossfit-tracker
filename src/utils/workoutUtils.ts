import { EXERCISE_MASTER_DATA } from '../data/exercises';

export function getCategoriesByExercises(exercises: string[]): string[] {
    const categories = new Set<string>();

    exercises.forEach(name => {
        const normalized = name.toLowerCase().trim();
        const master = EXERCISE_MASTER_DATA.find(e =>
            e.name.toLowerCase() === normalized ||
            e.aliases.some(alias => alias.toLowerCase() === normalized)
        );

        if (master) {
            categories.add(master.category);
        }
    });

    return Array.from(categories);
}
