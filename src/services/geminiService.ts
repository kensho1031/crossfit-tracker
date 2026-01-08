import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzedWOD, Exercise } from '../types/draftLog';

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAQsBydtDEhRtS_EBgOSX2pHSlHZhhGtSs';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

export async function analyzeWODImage(imageUrl: string): Promise<AnalyzedWOD> {
    console.log('🔮 Starting categorized AI WOD analysis...');

    try {
        const base64Data = await getBase64FromUrl(imageUrl);
        const [mimeType, base64Image] = base64Data.split(';base64,');

        const prompt = `
            Analyze this CrossFit whiteboard photo. 
            Extract exercises and categorize them into: "warmup", "strength", or "wod".
            
            Return ONLY a valid JSON object:
            {
              "warmup": [{"name": "string", "reps": "string", "sets": "string"}],
              "strength": [{"name": "string", "reps": "string", "sets": "string", "requiresWeight": boolean, "suggestedWeight": "string or null"}],
              "wod": [{"name": "string", "reps": "string", "sets": "string", "requiresWeight": boolean, "suggestedWeight": "string or null"}],
              "wodType": "AMRAP / For Time / EMOM / etc.",
              "commonWeight": "string or null",
              "confidence": 0.0 to 1.0
            }

            Guidelines:
            - warmup: General movements (Row, Burpee, Stretching).
            - strength: Weightlifting parts (Back Squat 5x5, EMOM lifting).
            - wod: The metcon or circuit.
            - confidence: If messy or unclear, use < 0.6.
        `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType.split(':')[1] || 'image/jpeg'
                }
            }
        ]);

        const responseText = result.response.text();
        const sanitizedJson = responseText.replace(/```json|```/g, '').trim();
        const parsedData = JSON.parse(sanitizedJson);

        const mapExercise = (ex: any, category: 'warmup' | 'strength' | 'wod', idx: number): Exercise => ({
            id: `ex-${Date.now()}-${category}-${idx}`,
            name: ex.name || 'Unknown',
            reps: String(ex.reps || ''),
            sets: String(ex.sets || '1'),
            requiresWeight: !!ex.requiresWeight,
            suggestedWeight: ex.suggestedWeight || null,
            category
        });

        const analyzedData: AnalyzedWOD = {
            sections: {
                warmup: (parsedData.warmup || []).map((e: any, i: number) => mapExercise(e, 'warmup', i)),
                strength: (parsedData.strength || []).map((e: any, i: number) => mapExercise(e, 'strength', i)),
                wod: (parsedData.wod || []).map((e: any, i: number) => mapExercise(e, 'wod', i)),
            },
            commonWeight: parsedData.commonWeight || null,
            wodType: parsedData.wodType || null,
            confidence: parsedData.confidence || 0.5,
            manualModeRecommended: (parsedData.confidence || 0.5) < 0.6
        };

        return analyzedData;
    } catch (error) {
        console.error('❌ Error in categorization analysis:', error);
        throw new Error('解析に失敗しました。');
    }
}


export async function generateWeeklyComment(stats: {
    workoutCount: number;
    prCount: number;
    categories: string[];
    sourceRatio: { scan: number; log: number };
}): Promise<string> {
    try {
        const logRatio = stats.sourceRatio.log / (stats.sourceRatio.scan + stats.sourceRatio.log || 1);
        let warning = "";
        if (logRatio > 0.7) {
            warning = "【注意】今週は手動入力（LOG）が多いようです。AIスキャン（SCAN WOD）を活用すると、より詳細なメニュー分析が可能になります。";
        }

        const prompt = `
            CrossFitの週間トレーニング記録に基づき、ユーザーのモチベーションを高める短いアドバイスを1〜2文で生成してください。
            日本語で、力強く前向きなトーンでお願いします。
            【重要】プレーンテキストのみで回答し、引用（>）や箇条書き（-）などのマークダウン記法は一切使用しないでください。

            今週のデータ:
            - ワークアウト回数: ${stats.workoutCount}回
            - PR更新数: ${stats.prCount}回
            - 主なカテゴリ: ${stats.categories.join(', ')}
            
            以前の注意メッセージがあれば考慮してください: ${warning}
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error('Error generating weekly comment:', error);
        return "ナイスワーク！来週も限界を超えていきましょう！";
    }
}

async function getBase64FromUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
