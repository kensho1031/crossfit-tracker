import { Quote } from 'lucide-react';

const quotes = [
    "悪いワークアウトは、やらなかったワークアウトだけだ。",
    "強さは肉体的な能力からではなく、不屈の意志から生まれる。",
    "今日感じる痛みは、明日感じる強さになる。",
    "あなたの体はほとんど何でも耐えられる。説得しなければならないのは心だ。",
    "つらい日々こそが、あなたを強くする。",
    "疲れたときに止めるな。終わったときに止めろ。",
    "限界を定義する唯一の方法は、それを超えることだ。",
    "成功は常に偉大さについてではない。一貫性についてだ。",
    "自分の体を大切にすることを愛せ。",
    "挑戦と勝利の違いは、少しの気合いだ。",
    "規律とは、今欲しいものと最も欲しいものの間で選択することだ。",
    "極端である必要はない。一貫していればいい。",
];

export function QuoteOfTheDay() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quote = quotes[dayOfYear % quotes.length];

    return (
        <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 'var(--spacing-sm)'
            }}>
                <Quote size={20} color="var(--color-accent)" />
            </div>
            <div style={{
                fontSize: '0.65rem',
                letterSpacing: 'var(--letter-spacing-wider)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--spacing-sm)',
                textTransform: 'uppercase',
                fontWeight: 500,
                fontFamily: 'var(--font-body)'
            }}>
                今日の格言
            </div>
            <div style={{
                fontSize: '1.1rem',
                fontStyle: 'italic',
                color: 'var(--color-text)',
                letterSpacing: 'var(--letter-spacing-normal)',
                lineHeight: 1.6,
                maxWidth: '600px',
                margin: '0 auto',
                fontWeight: 300,
                fontFamily: 'var(--font-body)'
            }}>
                「{quote}」
            </div>
        </div>
    );
}
