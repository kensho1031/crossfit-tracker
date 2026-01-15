import { Quote } from 'lucide-react';

const quotes = [
    "悪いワークアウトは、\nやらなかったワークアウトだけだ。",
    "強さは肉体的な能力からではなく、\n不屈の意志から生まれる。",
    "今日感じる痛みは、\n明日感じる強さになる。",
    "あなたの体はほとんど何でも耐えられる。\n説得しなければならないのは心だ。",
    "つらい日々こそが、\nあなたを強くする。",
    "疲れたときに止めるな。\n終わったときに止めろ。",
    "限界を定義する唯一の方法は、\nそれを超えることだ。",
    "成功は常に偉大さについてではない。\n一貫性についてだ。",
    "自分の体を大切にすることを愛せ。",
    "挑戦と勝利の違いは、\n少しの気合いだ。",
    "規律とは、\n今欲しいものと最も欲しいものの間で選択することだ。",
    "極端である必要はない。\n一貫していればいい。",
];

export function QuoteOfTheDay() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quote = quotes[dayOfYear % quotes.length];

    // Determine if quote is short or long for adaptive styling
    const isShortQuote = quote.replace(/\n/g, '').length < 30;

    return (
        <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: '0 var(--spacing-md)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div className="quote-card" style={{
                maxWidth: isShortQuote ? '340px' : '420px',
                width: '100%',
                margin: '0 auto',
                padding: isShortQuote ? '1.75rem 1.5rem' : '2rem 1.75rem',
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(0, 255, 255, 0.05) 100%)',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}>
                {/* Decorative gradient overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
                    opacity: 0.6
                }} />

                {/* Icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '0.75rem'
                }}>
                    <Quote size={18} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                </div>

                {/* Label */}
                <div style={{
                    fontSize: '0.6rem',
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    textAlign: 'center',
                    opacity: 0.7
                }}>
                    今日の格言
                </div>

                {/* Quote Text */}
                <div style={{
                    fontSize: isShortQuote ? 'clamp(1rem, 3.2vw, 1.3rem)' : 'clamp(0.9rem, 2.8vw, 1.15rem)',
                    fontStyle: 'italic',
                    color: 'var(--color-text)',
                    letterSpacing: '0.04em',
                    lineHeight: isShortQuote ? '1.8' : '1.9',
                    textAlign: 'center',
                    fontWeight: isShortQuote ? 400 : 300,
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '0.2em'
                }}>
                    {quote.split('\n').map((segment, index) => (
                        <span key={index} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                            {segment}
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
                .quote-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 30px rgba(0, 255, 255, 0.08);
                }

                @media (max-width: 600px) {
                    .quote-card {
                        max-width: 100% !important;
                        padding: 1.25rem 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
