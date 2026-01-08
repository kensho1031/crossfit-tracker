import { RandomWODGenerator } from '../components/tools/RandomWODGenerator';
import { OneRepMaxCalculator } from '../components/tools/OneRepMaxCalculator';
import { WeightConverter } from '../components/tools/WeightConverter';
import { Dumbbell } from 'lucide-react';

export function Tools() {
    return (
        <div style={{ paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{
                textAlign: 'center',
                marginBottom: '2.5rem',
                fontFamily: 'var(--font-heading)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '2rem'
            }}>
                <Dumbbell size={32} color="var(--color-primary)" />
                TOOLS
            </h2>

            <div style={{ display: 'grid', gap: '2.5rem' }}>
                {/* 1. Weight Converter */}
                <section>
                    <WeightConverter />
                </section>

                {/* 2. 1RM Calculator */}
                <section>
                    <OneRepMaxCalculator />
                </section>

                {/* 3. WOD Generator */}
                <section>
                    <RandomWODGenerator />
                </section>
            </div>
        </div>
    );
}
