import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ClassSection } from '../../types/class';

interface ClassSectionAccordionProps {
    title: string;
    section: ClassSection;
    defaultOpen?: boolean;
    color?: string;
}

export function ClassSectionAccordion({ title, section, defaultOpen = false, color = 'var(--color-text)' }: ClassSectionAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div style={{
            marginBottom: '1rem',
            background: 'var(--color-surface)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.2rem',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                    boxShadow: 'none' // Override default button shadow
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '4px',
                        height: '24px',
                        background: color,
                        borderRadius: '2px'
                    }} />
                    <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.2rem',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        {title}
                    </span>
                </div>
                {isOpen ? <ChevronUp size={20} color="var(--color-text-muted)" /> : <ChevronDown size={20} color="var(--color-text-muted)" />}
            </button>

            {isOpen && (
                <div style={{
                    padding: '1.5rem', // Added top padding
                    borderTop: '1px solid var(--color-border)',
                    marginTop: '-1px' // Collapse border
                }}>
                    {section.title && (
                        <div style={{
                            fontWeight: 600,
                            marginBottom: '0.5rem',
                            color: color,
                            fontSize: '0.9rem'
                        }}>
                            {section.title}
                        </div>
                    )}
                    <div style={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.8,
                        color: 'var(--color-text-muted)',
                        fontSize: '0.95rem'
                    }}>
                        {section.content}
                    </div>
                </div>
            )}
        </div>
    );
}
