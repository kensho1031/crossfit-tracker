import { Dumbbell } from 'lucide-react';

interface AvatarDisplayProps {
    level: number;
    totalWeight: number; // Sum of SQ + BP + DL + WL
}

/**
 * Avatar Evolution Logic:
 * Level 1 (Beginner): < 100kg Total
 * Level 2 (Intermediate): 100kg - 250kg
 * Level 3 (Advanced): 250kg - 400kg
 * Level 4 (Elite): > 400kg
 */
export function AvatarDisplay({ level: _, totalWeight }: AvatarDisplayProps) {
    let stage = 1;
    let stageName = "Novice";

    // In minimal luxury, we use subtle color shifts or just opacity/size
    // rather than strong neon colors.
    let accentColor = "var(--color-primary)";

    if (totalWeight >= 400) {
        stage = 4; stageName = "Elite"; accentColor = "var(--color-secondary)";
    } else if (totalWeight >= 250) {
        stage = 3; stageName = "Advanced"; accentColor = "#eab308";
    } else if (totalWeight >= 100) {
        stage = 2; stageName = "Intermediate"; accentColor = "#94a3b8";
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--border-radius)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'var(--backdrop-blur)',
            boxShadow: 'var(--shadow-sm)'
        }}>

            <div style={{ zIndex: 1, textAlign: 'center' }}>
                <h3 style={{
                    color: "var(--color-text-muted)",
                    fontSize: '0.8rem',
                    marginBottom: '1.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em'
                }}>
                    Role: {stageName}
                </h3>

                {/* Avatar Representation - Minimalist Emoji with sophisticated spacing */}
                <div style={{
                    fontSize: '4rem',
                    lineHeight: 1,
                    marginBottom: '2rem',
                    opacity: 0.9,
                    filter: 'grayscale(0.2)' // De-saturate for luxury feel
                }}>
                    {stage === 1 && "😐"}
                    {stage === 2 && "🙂"}
                    {stage === 3 && "😎"}
                    {stage === 4 && "🦍"}
                </div>

                {/* Stats Summary - Clean Typography */}
                <div style={{
                    display: 'flex',
                    gap: '2rem',
                    fontSize: '0.9rem',
                    color: 'var(--color-text)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ padding: '4px', border: '1px solid var(--color-border)', borderRadius: '50%' }}>
                            <Dumbbell size={14} strokeWidth={1.5} color={accentColor} />
                        </div>
                        <span>{totalWeight} <span style={{ fontSize: '0.8em', color: 'var(--color-text-muted)' }}>kg</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
