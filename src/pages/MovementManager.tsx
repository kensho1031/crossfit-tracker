
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMovements, addMovement, deleteMovement, seedDefaultMovements, type Movement } from '../services/movementService';
import { Plus, Trash2, Dumbbell } from 'lucide-react';

export function MovementManager() {
    const { user } = useAuth();
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(false);

    // New Movement State
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState<Movement['category']>('Weightlifting');
    const [newType, setNewType] = useState<Movement['type']>('Weight');

    useEffect(() => {
        if (user) {
            loadMovements();
        }
    }, [user]);

    const loadMovements = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMovements(user.uid);
            setMovements(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!user || !newName) return;
        try {
            await addMovement({
                uid: user.uid,
                name: newName,
                category: newCategory,
                type: newType,
                isDefault: false
            });
            setNewName('');
            loadMovements();
        } catch (error) {
            alert('Error adding movement');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await deleteMovement(id);
            loadMovements();
        } catch (error) {
            alert('Error deleting movement');
        }
    };

    const handleSeed = async () => {
        if (!confirm('Add default CrossFit movements?')) return;
        try {
            await seedDefaultMovements();
            loadMovements();
        } catch (error: any) {
            alert(`Error seeding data: ${error.message}`);
            console.error(error);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', textAlign: 'center', marginBottom: '2rem' }}>
                Movement Manager
            </h2>

            {loading && <p style={{ textAlign: 'center' }}>Loading...</p>}

            {/* Add New Section */}
            <div style={{
                background: 'var(--color-surface)',
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '2rem'
            }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} /> Add Custom Movement
                </h3>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr auto auto auto' }}>
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Movement Name (e.g. Thruster)"
                        style={{
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)'
                        }}
                    />
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        style={{
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)'
                        }}
                    >
                        <option value="Weightlifting">Weightlifting</option>
                        <option value="Gymnastics">Gymnastics</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Girl WOD">Girl WOD</option>
                        <option value="Hero WOD">Hero WOD</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        style={{
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            background: 'var(--color-bg)',
                            color: 'var(--color-text)'
                        }}
                    >
                        <option value="Weight">Weight (kg)</option>
                        <option value="Reps">Reps</option>
                        <option value="Time">Time</option>
                    </select>
                    <button
                        onClick={handleAdd}
                        className="primary"
                        style={{ padding: '0 1.5rem', fontWeight: 700, borderRadius: '8px' }}
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {movements.map(mov => (
                    <div key={mov.id} style={{
                        background: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                background: 'var(--color-bg)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Dumbbell size={20} color="var(--color-primary)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{mov.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {mov.category} • {mov.type}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {mov.isDefault && <span style={{ fontSize: '0.75rem', background: '#eee', padding: '2px 8px', borderRadius: '4px' }}>Default</span>}
                            {!mov.isDefault && (
                                <button onClick={() => handleDelete(mov.id!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <button onClick={handleSeed} style={{ background: 'transparent', border: '1px solid var(--color-border)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    DEBUG: Seed Defaults
                </button>
            </div>
        </div>
    );
}
