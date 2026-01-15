import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export interface WeeklySummaryData {
    workoutCount: number;
    prCount: number;
    exerciseFrequency: { [key: string]: number };
    categoryRatio: { [key: string]: number };
    totalCategories: number;
    sourceRatio: { scan: number; log: number };
    loading: boolean;
}

export function useWeeklySummary() {
    const { user, currentBox } = useAuth();
    const [data, setData] = useState<WeeklySummaryData>({
        workoutCount: 0,
        prCount: 0,
        exerciseFrequency: {},
        categoryRatio: {},
        totalCategories: 0,
        sourceRatio: { scan: 0, log: 0 },
        loading: true
    });

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const now = new Date();
                const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
                const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday

                const startStr = format(weekStart, 'yyyy-MM-dd');
                const endStr = format(weekEnd, 'yyyy-MM-dd');

                // 1. Fetch WODs
                const wodQuery = query(
                    collection(db, 'calendar_entries'),
                    where('uid', '==', user.uid),
                    where('type', '==', 'wod'),
                    where('boxId', '==', currentBox?.id || null),
                    where('date', '>=', startStr),
                    where('date', '<=', endStr)
                );
                const wodSnap = await getDocs(wodQuery);
                const wods = wodSnap.docs.map(doc => doc.data());

                // 2. Fetch PRs
                const prQuery = query(
                    collection(db, 'prs'),
                    where('uid', '==', user.uid),
                    where('boxId', '==', currentBox?.id || null),
                    where('date', '>=', startStr),
                    where('date', '<=', endStr)
                );
                const prSnap = await getDocs(prQuery);
                const prCount = prSnap.size;

                // 3. Process WODs for frequency and ratios
                const exerciseFrequency: { [key: string]: number } = {};
                const categoryRatio: { [key: string]: number } = {};
                let totalCategories = 0;
                let scanCount = 0;
                let logCount = 0;

                wods.forEach(wod => {
                    // Source
                    if (wod.source === 'scan') scanCount++;
                    else if (wod.source === 'log') logCount++;

                    // Exercises (exclude 'other')
                    const exercises: string[] = wod.exercises || [];
                    exercises.forEach(ex => {
                        if (ex.toLowerCase() !== 'other') {
                            exerciseFrequency[ex] = (exerciseFrequency[ex] || 0) + 1;
                        }
                    });

                    // Categories
                    const categories: string[] = wod.categories || [];
                    categories.forEach(cat => {
                        categoryRatio[cat] = (categoryRatio[cat] || 0) + 1;
                        totalCategories++;
                    });
                });

                setData({
                    workoutCount: wodSnap.size,
                    prCount,
                    exerciseFrequency,
                    categoryRatio,
                    totalCategories,
                    sourceRatio: { scan: scanCount, log: logCount },
                    loading: false
                });
            } catch (error) {
                console.error("Error fetching weekly summary:", error);
                setData(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();
    }, [user, currentBox?.id]);

    return data;
}
