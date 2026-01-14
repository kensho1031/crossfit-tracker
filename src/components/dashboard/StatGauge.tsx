import { useEffect, useState } from 'react';

interface StatGaugeProps {
    value: number;
    target: number;
    color: string;
    label: string;
    unit: string;
    size?: number;
}

export function StatGauge({ value, target, color, label, unit, size = 160 }: StatGaugeProps) {
    const [offset, setOffset] = useState(0);
    const center = size / 2;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Calculate percentage (clamped to 100%)
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;

    useEffect(() => {
        const progressOffset = circumference - (percentage / 100) * circumference;
        setOffset(progressOffset);
    }, [percentage, circumference]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            width: size,
            height: size + 40
        }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        strokeLinecap: 'round',
                        filter: `drop-shadow(0 0 5px ${color})`
                    }}
                />
            </svg>

            {/* Center Content */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                marginTop: '-20px'
            }}>
                <div style={{
                    fontSize: value === 0 ? '0.9rem' : '2rem',
                    fontWeight: 800,
                    color: value === 0 ? 'var(--color-text-muted)' : 'var(--color-text)',
                    lineHeight: 1,
                    fontFamily: 'var(--font-heading)'
                }}>
                    {value === 0 ? '未登録' : value}
                </div>
                {value > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {unit}
                    </div>
                )}
            </div>

            {/* Label Below */}
            <div style={{
                marginTop: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: 'var(--letter-spacing-wider)',
                textTransform: 'uppercase'
            }}>
                {label}
            </div>
        </div>
    );
}
