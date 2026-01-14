import { RandomWODGenerator } from '../components/tools/RandomWODGenerator';
import { OneRepMaxCalculator } from '../components/tools/OneRepMaxCalculator';
import { WeightConverter } from '../components/tools/WeightConverter';
import { Dumbbell, ShieldAlert } from 'lucide-react';
import { setUserRole } from '../services/userService';

export function Tools() {
    const handleBecomeAdmin = async () => {
        if (confirm('現在のユーザーを管理者にしますか？')) {
            try {
                await setUserRole('admin');
                alert('管理者権限を付与しました！リロードしてください。');
            } catch (e) {
                alert('失敗しました: ' + e);
            }
        }
    };

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
                {/* Dev Tool: Become Admin */}
                <section style={{ border: '2px dashed var(--color-neon)', padding: '1rem', borderRadius: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <div
                            onClick={handleBecomeAdmin}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid var(--color-neon)', borderRadius: '8px' }}
                        >
                            <ShieldAlert size={20} color="var(--color-neon)" />
                            <span style={{ color: 'var(--color-neon)', fontSize: '0.9rem' }}>権限付与</span>
                        </div>
                        <div
                            onClick={() => window.location.href = '/admin/class'}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--color-neon)', borderRadius: '8px' }}
                        >
                            <Dumbbell size={20} color="black" />
                            <span style={{ color: 'black', fontWeight: 'bold', fontSize: '0.9rem' }}>管理画面へ</span>
                        </div>
                    </div>
                </section>

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
